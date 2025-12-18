import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import { promises as fs } from 'fs';
import path from 'path';

// Ensure ffmpeg path is set
// Webpack in Next.js can mess up __dirname/path resolution for native binaries, 
// pointing to vendor-chunks instead of node_modules.
// We force the path relative to CWD.
const ffmpegPathReal = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');

ffmpeg.setFfmpegPath(ffmpegPathReal);

export async function POST(request: Request) {
    try {
        console.log("Using FFmpeg path:", ffmpegPathReal);
        const { videoUrl, name, duration = 3.5, brandId } = await request.json();

        if (!videoUrl || !name) {
            return NextResponse.json({ error: "Missing videoUrl or name" }, { status: 400 });
        }

        // 1. Setup paths
        const publicHooksDir = path.join(process.cwd(), 'public', 'hooks');
        await fs.mkdir(publicHooksDir, { recursive: true });

        const filename = `hook-${Date.now()}.mp4`;
        const outputPath = path.join(publicHooksDir, filename);
        // Clean temp path name to avoid issues
        const tempInputPath = path.join(publicHooksDir, `temp-${Date.now()}.mp4`);

        // 2. Download Video
        try {
            const response = await fetch(videoUrl);
            if (!response.ok) throw new Error(`Failed to fetch video: ${response.statusText}`);

            const arrayBuffer = await response.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            await fs.writeFile(tempInputPath, buffer);

        } catch (downloadError) {
            console.error("Download failed:", downloadError);
            return NextResponse.json({ error: "Failed to download video" }, { status: 500 });
        }

        // 3. Process with FFmpeg
        await new Promise((resolve, reject) => {
            ffmpeg(tempInputPath)
                .setStartTime(0)
                .setDuration(duration) // Cut first N seconds
                .output(outputPath)
                .videoCodec('libx264') // Re-encode to ensure compatibility
                .audioCodec('aac')     // Ensure audio is AAC
                .outputOptions([
                    '-pix_fmt yuv420p', // Ensure standard pixel format for web transparency/colors
                    '-movflags +faststart', // Optimize for web streaming
                    '-preset fast'      // encode reasonably fast
                ])
                .on('end', resolve)
                .on('error', (err) => {
                    console.error('FFmpeg error:', err);
                    reject(new Error(`FFmpeg error: ${err.message}`));
                })
                .run();
        });

        // 4. Cleanup Temp
        try {
            await fs.unlink(tempInputPath);
        } catch (e) { /* ignore */ }

        // 5. Save to DB
        // Check uniqueness for name
        let finalName = name;
        let counter = 1;

        while (true) {
            const existing = await prisma.adHook.findUnique({ where: { name: finalName } });
            if (!existing) break;
            finalName = `${name} (${counter++})`;
        }

        const newHook = await prisma.adHook.create({
            data: {
                name: finalName,
                type: 'VIDEO_CLIP',
                videoUrl: `/hooks/${filename}`,
                brandId: brandId || null
            }
        });

        return NextResponse.json(newHook);

    } catch (error) {
        console.error("Extract hook error:", error);
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        return NextResponse.json({ error: `Failed to extract hook: ${errorMessage}` }, { status: 500 });
    }
}
