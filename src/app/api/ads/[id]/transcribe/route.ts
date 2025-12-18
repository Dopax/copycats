import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import os from 'os';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';

// Set ffmpeg path
if (ffmpegStatic) {
    ffmpeg.setFfmpegPath(ffmpegStatic);
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
    const TEMP_DIR = os.tmpdir();
    const videoPath = path.join(TEMP_DIR, `video-${params.id}-${Date.now()}.mp4`);
    const audioPath = path.join(TEMP_DIR, `audio-${params.id}-${Date.now()}.mp3`);

    try {
        const ad = await prisma.ad.findUnique({ where: { id: params.id } });
        if (!ad || !ad.videoUrl) {
            return NextResponse.json({ error: "Ad not found or missing video" }, { status: 404 });
        }

        // 1. Download Video
        console.log("Downloading video from:", ad.videoUrl);
        const response = await fetch(ad.videoUrl);
        if (!response.ok) throw new Error("Failed to fetch video");

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(videoPath, buffer);

        // 2. Convert to Audio (mp3)
        console.log("Extracting audio...");
        await new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .toFormat('mp3')
                .on('end', resolve)
                .on('error', (err) => {
                    console.error("FFmpeg error:", err);
                    reject(err);
                })
                .save(audioPath);
        });

        // 3. Transcribe with Whisper
        console.log("Sending to Whisper...");
        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(audioPath),
            model: "whisper-1",
        });

        const transcriptText = transcription.text;

        // 4. Update DB
        await prisma.ad.update({
            where: { id: ad.id },
            data: { transcript: transcriptText }
        });

        // Cleanup
        try {
            if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
            if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
        } catch (e) {
            console.warn("Cleanup warning:", e);
        }

        return NextResponse.json({ transcript: transcriptText });

    } catch (error: any) {
        console.error("Transcription failed", error);
        // Cleanup on error
        try {
            if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
            if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
        } catch (e) { }

        return NextResponse.json({ error: error.message || "Transcription failed" }, { status: 500 });
    }
}
