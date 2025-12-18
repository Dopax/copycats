
import { NextResponse } from 'next/server';
import { uploadFile, ensureFolder } from '@/lib/drive';
import { prisma } from '@/lib/prisma';
import { getOAuthClient } from '@/lib/google-oauth';
import { google } from 'googleapis';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const batchName = formData.get('batchName') as string || 'Unknown Batch';
        const type = formData.get('type') as string;
        const brandId = formData.get('brandId') as string;
        const batchId = formData.get('batchId') as string;
        const variationLabel = formData.get('variationLabel') as string; // e.g. "A"

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        // Default naming
        let fileName = file.name;
        const timestamp = Date.now();
        const cleanBatchName = batchName.replace(/[^a-zA-Z0-9]/g, '_');
        fileName = type === 'zip'
            ? `${cleanBatchName}_ProjectFiles_${timestamp}.zip`
            : `${cleanBatchName}_${file.name}`;

        // Strategy Check
        let authClient = undefined;
        let folderId: string | undefined = undefined;

        if (brandId) {
            const brand = await prisma.brand.findUnique({ where: { id: brandId } });
            if (brand && brand.googleRefreshToken) {
                console.log(`Using Brand Drive: ${brand.name} (${brand.googleEmail})`);
                const oauth = getOAuthClient();
                oauth.setCredentials({ refresh_token: brand.googleRefreshToken });
                authClient = oauth;
                folderId = brand.googleDriveFolderId || undefined;

                // Subfolder & Renaming Logic for Brand Drive
                if (folderId && batchId) {
                    const drive = google.drive({ version: 'v3', auth: oauth });
                    try {
                        // Create/Get BATCH{ID} folder inside Brand Folder
                        const subFolder = await ensureFolder(drive, folderId, `BATCH${batchId}`);
                        if (subFolder) folderId = subFolder;

                        // Apply specific naming convention requested
                        const ext = file.name.split('.').pop() || '';
                        if (type === 'video' && variationLabel) {
                            fileName = `BATCH${batchId}${variationLabel}.${ext}`;
                        } else if (type === 'zip') {
                            fileName = `BATCH${batchId}_ProjectFiles.${ext || 'zip'}`;
                        }
                        console.log(`Renamed upload to: ${fileName} in folder ${folderId}`);
                    } catch (e) {
                        console.error("Subfolder/Rename logic failed:", e);
                    }
                }
            }
        }

        const driveFile = await uploadFile(
            buffer,
            fileName,
            file.type,
            folderId,
            authClient
        );

        return NextResponse.json(driveFile);

    } catch (error: any) {
        console.error("Upload API Error:", error);
        return NextResponse.json({
            error: error.message || "Upload failed",
            details: error.toString()
        }, { status: 500 });
    }
}
