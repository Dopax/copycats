
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_SCENARIOS_PROMPT = `
You are a world-class marketing strategist. Based on the provided Buyer Persona and Core Problem, generate 5 specific, "Day in the Life" scenarios where this persona acutely feels the pain of their problem.

Structure each scenario as follows:
**Scenario [N]: [Title]**
- **The Situation:** What exactly is happening?
- **The Internal Monologue:** What are they thinking? (Use raw, unfiltered thoughts)
- **The External Reaction:** What do they say or do visibly?
- **The Emotional Cost:** How does this make them feel about themselves?

The scenarios should be vivid, emotional, and relatable to the target audience.
`;

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

        if (!angle.conceptDoc) {
            return NextResponse.json({ error: "Buyer Persona must be generated first." }, { status: 400 });
        }

        const context = `
BUYER PERSONA:
${angle.conceptDoc}

CONCEPT CONTEXT:
Concept Name: ${angle.name}
Desire: ${angle.desire.name}
Theme: ${angle.theme.name}
Demographic: ${angle.demographic.name}
Awareness Level: ${angle.awarenessLevel?.name || "Unknown"}
        `;

        const systemPrompt = (angle.brand as any)?.scenariosPrompt || DEFAULT_SCENARIOS_PROMPT;
        const fullPrompt = `${context}\n\n${systemPrompt}`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4-turbo",
                messages: [
                    { role: "system", content: "You are a world-class marketing strategist." },
                    { role: "user", content: fullPrompt }
                ],
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error("Failed to communicate with AI provider");
        }

        const completion = await response.json();
        const content = completion.choices[0]?.message?.content;

        if (!content) {
            throw new Error("No content generated");
        }

        // Save to DB using raw SQL to bypass stale Prisma Client interface
        await prisma.$executeRaw`UPDATE AdAngle SET personaScenarios = ${content} WHERE id = ${id}`;

        const updatedAngle = await prisma.adAngle.findUnique({ where: { id } });

        if (updatedAngle) {
            (updatedAngle as any).personaScenarios = content;
            // Ensure we also return the conceptDoc since the client might need it
            (updatedAngle as any).conceptDoc = angle.conceptDoc;
        }

        return NextResponse.json(updatedAngle);

    } catch (error: any) {
        console.error("Generate scenarios error:", error);
        return NextResponse.json({
            error: "Failed to generate scenarios",
            details: error?.message || String(error)
        }, { status: 500 });
    }
}
