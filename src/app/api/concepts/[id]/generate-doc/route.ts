
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

        const concept = await prisma.creativeConcept.findUnique({
            where: { id },
            include: {
                angle: true,
                theme: true,
                demographic: true,
                awarenessLevel: true,
                brand: true
            }
        });

        if (!concept) {
            return NextResponse.json({ error: "Concept not found" }, { status: 404 });
        }

        const brandInfo = (concept.brand as any)?.brandDescription || concept.brand?.offerBrief || "No brand description found.";

        const context = `
INFORMATION ABOUT THE BRAND:
${brandInfo}

CONCEPT CONTEXT:
Concept Name: ${concept.name}
Angle: ${concept.angle.name} (${(concept.angle as any).description || "No description"})
Theme: ${concept.theme.name} (${(concept.theme as any).description || "No description"})
Demographic: ${concept.demographic.name}
Awareness Level: ${concept.awarenessLevel?.name || "Unknown"}
`;

        let finalSystemPrompt = (concept.brand as any)?.personaPrompt || DEFAULT_PERSONA_PROMPT;

        // Dynamic Placeholder Replacement
        const demoName = concept.demographic.name || "";
        // Simple heuristic: assume demographic is something like "Male 25-34"
        const gender = demoName.split(' ')[0] || "Unknown";
        const ageRange = demoName.replace(gender, '').trim() || "Unknown";

        const replacements: Record<string, string> = {
            "\\[GENDER\\]": gender,
            "\\[AGE RANGE\\]": ageRange,
            "\\[AWARENESS STAGE\\]": concept.awarenessLevel?.name || "Unknown",
            "\\[ANGLE\\]": concept.angle.name,
            "\\[THEME\\]": concept.theme.name,
            "\\[BRAND DESCRIPTION\\]": (concept.brand as any)?.brandDescription || "No description",
            "\\[OFFER BRIEF\\]": concept.brand?.offerBrief || "No offer brief",
            "\\[ANGLE DESCRIPTION\\]": (concept.angle as any).description || (concept.angle as any).notes || "No description",
            "\\[THEME DESCRIPTION\\]": (concept.theme as any).description || "No description"
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
        await prisma.$executeRaw`UPDATE CreativeConcept SET conceptDoc = ${content} WHERE id = ${id} `;

        // Fetch the updated record to return it (optional but good for UI update)
        const updatedConcept = await prisma.creativeConcept.findUnique({
            where: { id },
            include: {
                angle: true,
                theme: true,
                demographic: true,
                awarenessLevel: true,
                brand: true
            }
        });

        // Manually attach the conceptDoc since the stale client might not return it
        if (updatedConcept) {
            (updatedConcept as any).conceptDoc = content;
        }

        return NextResponse.json(updatedConcept);

    } catch (error: any) {
        console.error("Generate doc error:", error);
        return NextResponse.json({
            error: "Failed to generate concept doc",
            details: error?.message || String(error)
        }, { status: 500 });
    }
}
