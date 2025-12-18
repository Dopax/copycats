import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import os from 'os';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

// Force path to local node_modules to avoid webpack bundling issues with ffmpeg-static
const ffmpegPath = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');

// Check if it exists, otherwise fallback to ffmpeg-static's export or system path
if (fs.existsSync(ffmpegPath)) {
    console.log("Using local ffmpeg binary:", ffmpegPath);
    ffmpeg.setFfmpegPath(ffmpegPath);
} else if (ffmpegStatic) {
    console.warn("Local binary not found, trying import path:", ffmpegStatic);
    ffmpeg.setFfmpegPath(ffmpegStatic);
} else {
    console.warn("ffmpeg-static not found, relying on system PATH");
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
    console.log("Starting transcription for Ad ID:", params.id);

    if (!process.env.OPENAI_API_KEY) {
        console.error("Missing OPENAI_API_KEY");
        return NextResponse.json({ error: "Server configuration error: Missing OpenAI API Key" }, { status: 500 });
    }

    const TEMP_DIR = os.tmpdir();
    const videoPath = path.join(TEMP_DIR, `video-${params.id}-${Date.now()}.mp4`);
    const audioPath = path.join(TEMP_DIR, `audio-${params.id}-${Date.now()}.mp3`);

    try {
        const ad = await prisma.ad.findUnique({ where: { id: params.id } });
        if (!ad || !ad.videoUrl) {
            return NextResponse.json({ error: "Ad not found or missing video URL" }, { status: 404 });
        }

        // 1. Download Video
        console.log("Downloading video from:", ad.videoUrl);
        const response = await fetch(ad.videoUrl);
        if (!response.ok) {
            console.error("Download failed:", response.status, response.statusText);
            throw new Error(`Failed to download video: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(videoPath, buffer);
        console.log("Video saved to:", videoPath, "Size:", buffer.length);

        // 2. Convert to Audio (mp3)
        console.log("Extracting audio using ffmpeg...");
        await new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .toFormat('mp3')
                .on('end', () => {
                    console.log("FFmpeg conversion complete");
                    resolve(true);
                })
                .on('error', (err) => {
                    console.error("FFmpeg error:", err);
                    reject(new Error(`Audio conversion failed: ${err.message}`));
                })
                .save(audioPath);
        });

        // 3. Transcribe with Whisper
        console.log("Sending to OpenAI Whisper...");
        if (!fs.existsSync(audioPath)) {
            throw new Error("Audio file was not created successfully");
        }

        const fileStream = fs.createReadStream(audioPath);

        const transcription = await openai.audio.transcriptions.create({
            file: fileStream,
            model: "whisper-1",
        });

        console.log("Transcription received");
        const transcriptText = transcription.text;

        // 4. Update DB (Using raw query to bypass potential Prisma Client sync issues due to file locks)
        console.log("Saving transcript to DB...");
        const updateResult = await prisma.$executeRaw`UPDATE "Ad" SET "transcript" = ${transcriptText} WHERE "id" = ${ad.id}`;
        console.log("DB Update Result:", updateResult);

        // Cleanup
        try {
            if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
            if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
        } catch (e) {
            console.warn("Cleanup warning:", e);
        }

        return NextResponse.json({ transcript: transcriptText });

    } catch (error: any) {
        console.error("Transcription process failed:", error);

        // Cleanup on error
        try {
            if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
            if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
        } catch (e) { }

        return NextResponse.json({
            error: error.message || "Transcription failed",
            details: error.toString()
        }, { status: 500 });
    }
}
