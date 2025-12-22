
import { NextResponse } from 'next/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_PROMPT = `
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

        const concept = await prisma.creativeConcept.findUnique({
            where: { id },
            include: {
                angle: true,
                theme: true,
                demographic: true,
                brand: true
            }
        });

        if (!concept) {
            return NextResponse.json({ error: "Concept not found" }, { status: 404 });
        }

        if (!concept.conceptDoc) {
            return NextResponse.json({ error: "Buyer Persona must be generated first." }, { status: 400 });
        }

        const context = `
BUYER PERSONA:
${concept.conceptDoc}

CONCEPT CONTEXT:
Concept Name: ${concept.name}
Angle: ${concept.angle.name}
Theme: ${concept.theme.name}
        `;

        const systemPrompt = (concept.brand as any)?.scenariosPrompt || DEFAULT_SCENARIOS_PROMPT;
        const fullPrompt = `${context}\n\n${systemPrompt}`;

        const response = await fetch('https://api.openai.com/v1/responses', {
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
        await prisma.$executeRaw`UPDATE CreativeConcept SET personaScenarios = ${content} WHERE id = ${id}`;

        const updatedConcept = await prisma.creativeConcept.findUnique({ where: { id } });

        if (updatedConcept) {
            (updatedConcept as any).personaScenarios = content;
            // Ensure we also return the conceptDoc since the client might need it
            (updatedConcept as any).conceptDoc = concept.conceptDoc;
        }

        return NextResponse.json(updatedConcept);

    } catch (error: any) {
        console.error("Generate scenarios error:", error);
        return NextResponse.json({
            error: "Failed to generate scenarios",
            details: error?.message || String(error)
        }, { status: 500 });
    }
}
