
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEFAULT_PERSONA_PROMPT } from '@/lib/constants/prompts';
// (Line 5 removal is implicit by replacing surrounding lines or just targeting it. I will target the imports area to clean up.)

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: "OpenAI API Key not configured" }, { status: 500 });
        }

        const angle = await prisma.adAngle.findUnique({
            where: { id },
            include: {
                desire: true,
                theme: true,
                demographic: true,
                awarenessLevel: true,
                brand: true
            }
        });

        if (!angle) {
            return NextResponse.json({ error: "Angle not found" }, { status: 404 });
        }

        const brandInfo = (angle.brand as any)?.brandDescription || angle.brand?.offerBrief || "No brand description found.";

        const context = `
INFORMATION ABOUT THE BRAND:
${brandInfo}

CONCEPT CONTEXT:
Concept Name: ${angle.name}
Angle: ${angle.desire?.name || "Unknown"} (${angle.desire?.description || "No description"})
Theme: ${angle.theme.name} (${(angle.theme as any).description || "No description"})
Demographic: ${angle.demographic.name}
Awareness Level: ${angle.awarenessLevel?.name || "Unknown"}
`;

        let finalSystemPrompt = (angle.brand as any)?.personaPrompt || DEFAULT_PERSONA_PROMPT;

        // Dynamic Placeholder Replacement
        const demoName = angle.demographic.name || "";
        // Simple heuristic: assume demographic is something like "Male 25-34"
        const gender = demoName.split(' ')[0] || "Unknown";
        const ageRange = demoName.replace(gender, '').trim() || "Unknown";

        const replacements: Record<string, string> = {
            "\\[GENDER\\]": gender,
            "\\[AGE RANGE\\]": ageRange,
            "\\[AWARENESS STAGE\\]": angle.awarenessLevel?.name || "Unknown",
            "\\[ANGLE\\]": angle.name, // The concept name is now the angle name
            "\\[THEME\\]": angle.theme.name,
            "\\[BRAND DESCRIPTION\\]": (angle.brand as any)?.brandDescription || "No description",
            "\\[OFFER BRIEF\\]": angle.brand?.offerBrief || "No offer brief",
            "\\[ANGLE DESCRIPTION\\]": (angle.desire as any)?.description || "No description", // Fallback to desire description
            "\\[THEME DESCRIPTION\\]": (angle.theme as any).description || "No description"
        };

        Object.entries(replacements).forEach(([placeholder, value]) => {
            finalSystemPrompt = finalSystemPrompt.replace(new RegExp(placeholder, 'gi'), value);
        });

        const fullPrompt = `${context}\n\n${finalSystemPrompt}`;

        // Call OpenAI Chat Completions API
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey} `
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: "You are a world-class marketing analyst." },
                    { role: "user", content: fullPrompt }
                ]
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("OpenAI API error:", err);
            return NextResponse.json({ error: "Failed to communicate with AI provider" }, { status: 500 });
        }

        const completion = await response.json();
        const content = completion.choices[0]?.message?.content;

        if (!content) {
            return NextResponse.json({ error: "No content generated" }, { status: 500 });
        }

        // Save to DB using raw SQL to bypass stale Prisma Client interface (Windows file lock issue)
        await prisma.$executeRaw`UPDATE AdAngle SET conceptDoc = ${content} WHERE id = ${id} `;

        // Fetch the updated record to return it (optional but good for UI update)
        const updatedAngle = await prisma.adAngle.findUnique({
            where: { id },
            include: {
                desire: true,
                theme: true,
                demographic: true,
                awarenessLevel: true,
                brand: true
            }
        });

        // Manually attach the conceptDoc since the stale client might not return it
        if (updatedAngle) {
            (updatedAngle as any).conceptDoc = content;
        }

        return NextResponse.json(updatedAngle);

    } catch (error: any) {
        console.error("Generate doc error:", error);
        return NextResponse.json({
            error: "Failed to generate concept doc",
            details: error?.message || String(error)
        }, { status: 500 });
    }
}
