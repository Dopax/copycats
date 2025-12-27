import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

        const batch = await prisma.adBatch.findUnique({
            where: { id },
            include: {
                angle: {
                    include: {
                        desire: true,
                        theme: true,
                        demographic: true,
                        awarenessLevel: true,
                    }
                },
                brand: true,
                format: true,
            },
        });

        if (!batch) {
            return NextResponse.json({ error: "Batch not found" }, { status: 404 });
        }

        // Construct the prompt
        const demographic = batch.angle.demographic.name;
        const desire = batch.angle.desire.name;
        const theme = batch.angle.theme.name;
        const themeDesc = batch.angle.theme.description || "";
        const awareness = batch.angle.awarenessLevel?.name || "Unaware";
        const brandDesc = batch.brand?.brandDescription || "";
        const offerBrief = batch.brand?.offerBrief || "";
        const mainMessaging = batch.mainMessaging || "Not specified";
        const formatName = batch.format?.name || "Generic Format";
        const formatDesc = batch.format?.description || "";
        const brandName = batch.brand?.name || "The Brand";
        const idea = batch.idea || "No specific idea provided";

        const systemPrompt = `You are a world-class Creative Strategist.
Your goal is to write a ONE-SENTENCE "Strategy Summary" for a new ad batch.
This sentence will dictate the entire direction of the creative.

It must be:
- Punchy and direct.
- Psychologically astute.
- Action-oriented.
- NO "marketing fluff".
- CRITICAL: Do NOT use technical terms like "Problem Aware", "Solution Aware", or "Unaware". Instead, describe their *mindset* or *struggle* naturally.

Use this format:
"Targeting [Detailed Demographic Nuance] who [Describe their mindset/struggle without using technical labels], we will [Specific Psychological Approach] by [Concrete Creative Execution]."
`;


        const userPrompt = `
CONTEXT:
- Brand: ${brandName}
- Brand Description: ${brandDesc}
- Product/Offer: ${offerBrief}
- Demographic: ${demographic}
- Awareness Level: ${awareness}
- Core Desire/Angle: ${desire}
- Visual Theme: ${theme} (${themeDesc})
- Format: ${formatName} (${formatDesc})
- Main Messaging Focus: ${mainMessaging}
- Initial Idea: ${idea}

Generate the Strategy Sentence. return ONLY the sentence.`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            temperature: 0.7,
        });

        const strategySentence = completion.choices[0].message.content?.replace(/^"|"$/g, '').trim() || "Failed to generate strategy.";

        // Save to DB
        await prisma.adBatch.update({
            where: { id },
            data: { strategySentence }
        });

        return NextResponse.json({ strategySentence });

    } catch (error: any) {
        console.error("Failed to generate strategy:", error);
        return NextResponse.json({ error: error.message || "Failed to generate strategy" }, { status: 500 });
    }
}
