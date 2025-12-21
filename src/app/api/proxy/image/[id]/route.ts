
import { auth } from "@/auth";
import { getOAuthClient } from "@/lib/google-oauth";
import { prisma } from "@/lib/prisma";
import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const fileId = params.id;
  if (!fileId) return new NextResponse("Missing ID", { status: 400 });

  try {
    // We need a valid token. Any workspace brand token will do, or the specific brand token.
    // To be safe, we should find which brand owns this file?
    // Or just use the System Service Account if we have one?
    // The current app uses `creator.brand.googleRefreshToken` for uploads.
    // For general viewing, we might need to look up the Creative to find the Brand?
    // But that's slow.
    // Do we have a fallback System/Env credential?
    // `src/lib/drive.ts` uses `process.env.GOOGLE_CLIENT_EMAIL`.
    // If we use Service Account (JWT) from `src/lib/drive.ts`, we can access ANY file shared with it.
    // Assuming the uploaded files are shared with the Service Account (which they are if the Service Account created them or is permitted).
    // Wait, `Portal` uploads are done via "User's Brand Refresh Token".
    // Does the Service Account have access?
    // Not necessarily unless we shared it.
    // So we MUST use the Brand's Refresh Token.


    // Lookup file owner (Creative, BrandAsset, or Creator) to find Brand.
    let brand = null;

    // 1. Check Creative
    const creative = await prisma.creative.findFirst({
      where: { driveFileId: fileId },
      include: { brand: true }
    });
    if (creative?.brand) brand = creative.brand;

    // 2. Check Brand Asset
    if (!brand) {
      // URLs might be full links, need to check contains or extraction
      // But usually we pass ID.
      // BrandAsset.url might be full URL.
      const asset = await prisma.brandAsset.findFirst({
        where: { url: { contains: fileId } },
        include: { brand: true }
      });
      if (asset?.brand) brand = asset.brand;
    }

    // 3. Check Creator (profileImageUrl)
    if (!brand) {
      const creator = await prisma.creator.findFirst({
        where: { profileImageUrl: { contains: fileId } },
        include: { brand: true }
      });
      if (creator?.brand) brand = creator.brand;
    }

    let drive;

    if (brand && brand.googleRefreshToken) {
      const oauth2Client = getOAuthClient();
      oauth2Client.setCredentials({ refresh_token: brand.googleRefreshToken });
      drive = google.drive({ version: "v3", auth: oauth2Client });
    } else {
      const { authorize } = await import("@/lib/drive");
      const authClient = await authorize();
      drive = google.drive({ version: 'v3', auth: authClient });
    }

    // 1. Get File Metadata to check for thumbnailLink
    const metadata = await drive.files.get({
      fileId: fileId,
      fields: 'id, mimeType, thumbnailLink'
    });

    const thumbnailLink = metadata.data.thumbnailLink;

    // If we have a thumbnail link, let's proxy IT instead of the full file (especially if video)
    if (thumbnailLink) {
      // High-res thumbnail if possible? By default s220. We can try modifying to =s1000?
      // But let's just use what we get for now.
      const thumbRes = await fetch(thumbnailLink);
      if (thumbRes.ok) {
        const blob = await thumbRes.blob();
        const headers = new Headers();
        headers.set("Cache-Control", "public, max-age=3600");
        headers.set("Content-Type", mimeTypeFromLink(thumbnailLink) || "image/jpeg");
        return new NextResponse(blob, { headers });
      }
    }

    // Fallback: Download full media (images only? or fail if video?)
    // If it's a video and we failed to get a thumbnail, piping the video to an img tag won't work anyway.
    // But let's keep existing behavior as fallback.
    const response = await drive.files.get({
      fileId: fileId,
      alt: 'media',
    }, { responseType: 'stream' });

    // @ts-ignore
    const stream = response.data;

    const headers = new Headers();
    headers.set("Cache-Control", "public, max-age=3600");
    if (metadata.data.mimeType) headers.set("Content-Type", metadata.data.mimeType);

    return new NextResponse(stream as any, { headers });

  } catch (error) {
    console.error("Proxy Error", error);
    return new NextResponse("Error fetching image", { status: 500 });
  }
}

function mimeTypeFromLink(link: string) {
  if (link.includes("=s")) return "image/jpeg"; // Usually JPG
  return "image/jpeg";
}
