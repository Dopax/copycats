import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { authorize } from '@/lib/drive';
import { prisma } from '@/lib/prisma';
import { getOAuthClient } from '@/lib/google-oauth';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('videoId');
    const brandId = searchParams.get('brandId');

    if (!videoId) {
        return NextResponse.json({ error: "Missing videoId" }, { status: 400 });
    }

    try {
        let auth;
        // 1. Try Brand Auth first if provided
        if (brandId) {
            const brand = await prisma.brand.findUnique({ where: { id: brandId } });
            if (brand && brand.googleRefreshToken) {
                const oauth = getOAuthClient();
                oauth.setCredentials({ refresh_token: brand.googleRefreshToken });
                auth = oauth;
            }
        }

        // 2. Fallback to Service Account
        if (!auth) {
            // Only try authorize if env vars exist to avoid crashing if user only relies on Brand Auth
            if (process.env.GOOGLE_CLIENT_EMAIL) {
                auth = await authorize();
            } else {
                throw new Error("Missing Google Drive Credentials (ENV) and no valid Brand Auth provided.");
            }
        }

        const drive = google.drive({ version: 'v3', auth });

        // 1. Get Metadata (size, mimeType)
        const fileMetadata = await drive.files.get({
            fileId: videoId,
            fields: 'size, mimeType',
        });

        // 3. Range Support
        const range = req.headers.get('range');
        const fileSize = Number(fileMetadata.data.size);
        const mimeType = fileMetadata.data.mimeType || 'video/mp4';

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
            const chunksize = (end - start) + 1;

            const driveRes = await drive.files.get(
                { fileId: videoId, alt: 'media' },
                {
                    responseType: 'stream',
                    headers: { Range: `bytes=${start}-${end}` }
                }
            );

            const iterator = nodeStreamToIterator(driveRes.data);

            const headers = new Headers();
            headers.set('Content-Range', `bytes ${start}-${end}/${fileSize}`);
            headers.set('Accept-Ranges', 'bytes');
            headers.set('Content-Length', String(chunksize));
            headers.set('Content-Type', mimeType);

            return new NextResponse(iterator, {
                status: 206,
                headers,
            });
        } else {
            // Full Content
            const driveRes = await drive.files.get(
                { fileId: videoId, alt: 'media' },
                { responseType: 'stream' }
            );

            const iterator = nodeStreamToIterator(driveRes.data);

            const headers = new Headers();
            headers.set('Content-Length', String(fileSize));
            headers.set('Content-Type', mimeType);

            return new NextResponse(iterator, {
                status: 200,
                headers,
            });
        }

    } catch (error: any) {
        console.error("Video Stream Error Details:", {
            message: error.message,
            code: error.code,
            status: error.status,
            errors: error.errors
        });
        return NextResponse.json({ error: "Failed to stream video", details: error.message }, { status: 500 });
    }
}

// Helper to convert Node Stream to Web Stream
function nodeStreamToIterator(stream: any) {
    return new ReadableStream({
        start(controller) {
            stream.on('data', (chunk: any) => controller.enqueue(chunk));
            stream.on('end', () => controller.close());
            stream.on('error', (err: any) => controller.error(err));
        }
    });
}
