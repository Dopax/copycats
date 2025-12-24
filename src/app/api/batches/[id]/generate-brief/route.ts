import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const { customPrompt } = await request.json();
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: "OpenAI API Key not configured" }, { status: 500 });
        }

        if (!customPrompt) {
            return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
        }

        // Fetch all context
        const batch = await prisma.adBatch.findUnique({
            where: { id: parseInt(id) },
            include: {
                angle: {
                    include: {
                        desire: true,
                        theme: true,
                        demographic: true,
                        awarenessLevel: true,
                    }
                },
                brand: true
            }
        });

        if (!batch) {
            return NextResponse.json({ error: "Batch not found" }, { status: 404 });
        }

        const angle = batch.angle;
        const brand = batch.brand;

        // Replacement Map
        const replacements: Record<string, string> = {
            "\\[BRAND NAME\\]": brand?.name || "Unknown Brand",
            "\\[OFFER BRIEF\\]": brand?.offerBrief || "No product info provided",
            "\\[BRAND DESCRIPTION\\]": brand?.brandDescription || "No brand description",
            "\\[AUDIENCE\\]": angle.demographic.name || "General Audience",
            "\\[DESIRE\\]": angle.desire.name || "Unknown Desire",
            "\\[DESIRE DESCRIPTION\\]": angle.desire.description || "",
            "\\[AWARENESS\\]": angle.awarenessLevel?.name || "Unknown Awareness",
            "\\[THEME\\]": angle.theme.name || "General",
            "\\[THEME DESCRIPTION\\]": angle.theme.description || "",
            "\\[IDEA\\]": batch.idea || "No specific idea notes",
            "\\[MAIN MESSAGING\\]": (() => {
                if (!batch.mainMessaging) return "No messaging analysis";
                try {
                    const parsed = JSON.parse(batch.mainMessaging);
                    // Extract summary or core promise from Layer 1
                    const summary = parsed.layer1?.summary || parsed.layer1?.corePromise || "";
                    if (summary) return summary;
                    return "No core messaging defined";
                } catch (e) {
                    // Fallback if it's plain text
                    return batch.mainMessaging;
                }
            })()
        };

        let finalPrompt = customPrompt;

        Object.entries(replacements).forEach(([placeholder, value]) => {
            // Escape regex special chars if needed, but for simple brackets it's mostly fine
            // We use a simple replaceAll approach or regex with global flag
            finalPrompt = finalPrompt.replace(new RegExp(placeholder, 'gi'), value);
        });

        // Call OpenAI
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey} `
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: "You are a world-class creative strategist." },
                    { role: "user", content: finalPrompt }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("OpenAI API error:", err);
            return NextResponse.json({ error: "Failed to communicate with AI provider" }, { status: 500 });
        }

        const completion = await response.json();
        const content = completion.choices[0]?.message?.content;

        return NextResponse.json({ content });

    } catch (error: any) {
        console.error("Generate brief error:", error);
        return NextResponse.json({
            error: "Failed to generate brief",
            details: error?.message
        }, { status: 500 });
    }
}
