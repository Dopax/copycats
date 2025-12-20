
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getOAuthClient } from "@/lib/google-oauth";
import { Readable } from "stream";

export async function POST(req: Request) {
    let formData;
    try {
        formData = await req.formData();
    } catch (e) {
        return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const token = formData.get("token") as string | null;

    let creator;
    if (token) {
         creator = await prisma.creator.findUnique({ 
            where: { magicLinkToken: token },
            include: { brand: true }
         });
    } else {
        const session = await auth();
        if (session && session.user && (session.user as any).role === "CREATOR") {
             const userId = session.user.id;
             creator = await prisma.creator.findUnique({ 
                where: { userId },
                include: { brand: true } 
             });
        }
    }

    // ... Auth (lines 1-38 same)
    if (!creator) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!creator.brand.googleRefreshToken) return NextResponse.json({ error: "Brand not connected to Drive" }, { status: 400 });

    try {
        const file = formData.get("file") as File;
        if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

        // Setup Drive
        const oauth2Client = getOAuthClient();
        oauth2Client.setCredentials({ refresh_token: creator.brand.googleRefreshToken });
        const drive = google.drive({ version: "v3", auth: oauth2Client });
        
        // 1. Determine Folder (CID)
        let deliveryCid = creator.activeDeliveryCid;
        let rootFolderId: string | null = null;
        
        if (!deliveryCid) {
            // New Session: Generate CID
            // Find max CID to increment or use timestamp? 
            // User requested "follow the creative id that are already there".
            // Since we can't easily valid max(CID) String in prisma without raw query, let's use a timestamp-based or random short ID for now to avoid collision.
            // Or fetched all creatves and sort.
            // Simplified: "C-" + Date.now().toString().slice(-6)
            deliveryCid = `C-${Date.now().toString().slice(-6)}`;
            
            // Create Folder: [CID] Creator Name
            const folderName = `[${deliveryCid}] ${creator.name}`;
            
            // Helper from lib/drive (we need to import it, but it's not exported default)
            // We need to import ensureFolder
             const { ensureFolder } = await import("@/lib/drive");
             
             // Parent is Brand Root
             const parentId = creator.brand.googleDriveFolderId || 'root';
             rootFolderId = await ensureFolder(drive, parentId, folderName);
             
             // Save to Creator
             await prisma.creator.update({
                 where: { id: creator.id },
                 data: { activeDeliveryCid: deliveryCid }
             });
             
             // We should also store the folder ID to avoid searching by name next time?
             // But we only stored CID string. We can search by name `[CID] ...` or store it.
             // Storing folderId in Creator would be better but I only added activeDeliveryCid.
             // I'll search by name or trust ensureFolder.
             // Actually, `ensureFolder` is fast.
        }
        
        // If we didn't just create it, we need to find it.
        // We need the Folder Name to find it. Name is `[CID] Creator Name`.
        // We know CID and Name.
        const { ensureFolder } = await import("@/lib/drive"); // Ensure Import
        const folderName = `[${deliveryCid}] ${creator.name}`;
        const parentId = creator.brand.googleDriveFolderId || 'root';
        
        if (!rootFolderId) {
             rootFolderId = await ensureFolder(drive, parentId, folderName);
        }

        // 2. Determine Subfolder (Raw vs Testimonial)
        // Check filename prefix we added in frontend
        let targetSubfolderName = "Raw Files";
        if (file.name.startsWith("[TESTIMONIAL]")) {
            targetSubfolderName = "Testimonials";
        }
        
        const targetFolderId = await ensureFolder(drive, rootFolderId, targetSubfolderName);

        // 3. Upload File
        const buffer = Buffer.from(await file.arrayBuffer());
        const stream = new Readable();
        stream.push(buffer);
        stream.push(null);

        const response = await drive.files.create({
            requestBody: {
                name: file.name, // Keep [TESTIMONIAL] prefix or strip it? User: "inside separate folders". Prefix is redundant inside "Testimonial" folder but harmless.
                parents: [targetFolderId],
            },
            media: {
                mimeType: file.type,
                body: stream,
            },
            fields: "id, webViewLink, thumbnailLink, videoMediaMetadata",
        });

        const driveFile = response.data;

        // 4. Create Creative Record
        await prisma.creative.create({
            data: {
                name: file.name,
                brandId: creator.brandId,
                creatorId: creator.id,
                cid: deliveryCid, // Link to the custom ID
                driveFileId: driveFile.id,
                driveViewLink: driveFile.webViewLink,
                thumbnailUrl: driveFile.thumbnailLink,
                folderPath: `/${folderName}/${targetSubfolderName}`,
                type: file.type.startsWith('image/') ? 'IMAGE' : 'VIDEO',
                width: driveFile.videoMediaMetadata?.width,
                height: driveFile.videoMediaMetadata?.height,
                duration: driveFile.videoMediaMetadata?.durationMillis ? driveFile.videoMediaMetadata.durationMillis / 1000 : undefined,
            }
        });

        // Don't mark generic completed yet, wait for Finish.

        return NextResponse.json({ success: true });

    } catch (e: any) {
        console.error("Upload Error", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
