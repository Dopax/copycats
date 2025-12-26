
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
    try {
        const { adId } = await request.json();

        if (!adId) {
            return NextResponse.json({ error: "Ad ID is required" }, { status: 400 });
        }

        const ad = await prisma.ad.findUnique({
            where: { id: adId },
            include: { awarenessLevel: true }
        });

        if (!ad) {
            return NextResponse.json({ error: "Ad not found" }, { status: 404 });
        }

        if (!ad.transcript) {
            return NextResponse.json({ error: "No transcript available for this ad. Please transcribe the video first." }, { status: 400 });
        }

        const awarenessLevels = await prisma.adAwarenessLevel.findMany();
        const awarenessLevelsList = awarenessLevels.map(l => `- ${l.name}`).join('\n');

        const prompt = `
You are an expert marketing analyst.
Analyze the following ad transcript and determine the most appropriate "Awareness Level" for the target audience.

Available Awareness Levels:
${awarenessLevelsList}
Unaware: Doesn't know they have a problem.
Problem Aware: Knows the problem, but not the solution.
Solution Aware: Knows solutions exist, but not yours.
Product Aware: Knows your product, but isn't sold yet.
Most Aware: Ready to buy, just needs an offer.

Transcript:
"${ad.transcript}"

Return a JSON object with:
1. "awarenessLevelId": The exact ID of the matching level from the list below.
2. "reason": A concise (1-2 sentences) explanation of why this level fits, citing specific cues from the transcript.

IDs Reference:
${awarenessLevels.map(l => `${l.name}: ${l.id}`).join('\n')}
`;

        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-4-turbo-preview",
            response_format: { type: "json_object" },
        });

        const responseContent = completion.choices[0].message.content;
        if (!responseContent) throw new Error("No response from AI");

        const result = JSON.parse(responseContent);

        return NextResponse.json(result);

    } catch (error: any) {
        console.error("AI Analysis failed:", error);
        return NextResponse.json({ error: error.message || "Analysis failed" }, { status: 500 });
    }
}
