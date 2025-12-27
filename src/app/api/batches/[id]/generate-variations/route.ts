import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// ... imports

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
                format: true, // Keeping batch format for context
                referenceAd: {
                    include: {
                        hook: true
                    }
                }
            },
        });

        if (!batch) {
            return NextResponse.json({ error: "Batch not found" }, { status: 404 });
        }

        // Parse MODE from request
        const { mode } = await request.json().catch(() => ({ mode: 'variations' })); // Default to variations if no body

        // --- CONTEXT CONSTRUCTION ---
        const strategy = batch.strategySentence || "Not yet defined.";
        const brandName = batch.brand?.name || "The Brand";
        const brandDesc = batch.brand?.brandDescription || "";
        const offerBrief = batch.brand?.offerBrief || "";

        const demographic = batch.angle.demographic.name || "";
        const awareness = batch.angle.awarenessLevel?.name || "";
        const desire = batch.angle.desire.name || "";
        const theme = batch.angle.theme.name || "";
        const themeDesc = batch.angle.theme.description || "";

        const mainMessaging = batch.mainMessaging || "";

        // Ref Ad Context
        const refHook = batch.referenceAd?.hook?.name || "";
        const refWhy = batch.referenceAd?.whyItWorks || "";
        const refNotes = batch.referenceAd?.notes || "";
        const refTranscript = batch.referenceAd?.transcript || "";

        const isCopycat = batch.batchType === 'COPYCAT';
        let variationCount = 5;
        let startChar = 'A';
        let generateCopycatA = false;

        // FETCH EXISTING ITEMS to determine what to build
        const existingItems = await prisma.batchItem.findMany({
            where: { batchId: id },
            orderBy: { variationIndex: 'asc' }
        });

        const hasA = existingItems.some(i => i.variationIndex === 'A');

        // LOGIC BRANCHING
        if (mode === 'copycat_only') {
            if (!isCopycat) return NextResponse.json({ error: "Batch is not Copycat type" }, { status: 400 });
            if (hasA) return NextResponse.json({ error: "Variation A (Copycat) already exists" }, { status: 400 });

            variationCount = 1;
            generateCopycatA = true;
            startChar = 'A';
        }
        else {
            // mode === 'variations' or default
            if (isCopycat && !hasA) {
                // If Copycat batch and A is missing, we must generate it first
                generateCopycatA = true;
                startChar = 'A';
                // valid logic: generate A + 4 others? or just A?
                // User: "auto vary should generate variation b and onwards"
                // Let's generate A (Copycat) + 4 regular ones if A is missing.
                variationCount = 5;
            } else {
                // Determine next available letter
                const indices = existingItems.map(i => i.variationIndex?.charCodeAt(0) || 0).filter(c => c > 0);
                const maxChar = indices.length > 0 ? Math.max(...indices) : 64; // 64 is '@', +1 = 'A'
                startChar = String.fromCharCode(maxChar + 1);

                // If we are starting at B (66) or later, we just generate count
                variationCount = 5;
                generateCopycatA = false;
            }
        }

        // FETCH AND GROUP FORMATS
        const allFormats = await prisma.adFormat.findMany({
            orderBy: { category: 'asc' }
        });

        const groupedFormats: Record<string, string[]> = {};
        allFormats.forEach(f => {
            const cat = f.category || "General";
            if (!groupedFormats[cat]) groupedFormats[cat] = [];
            groupedFormats[cat].push(`- "${f.name}": ${f.description}`);
        });

        const formatList = Object.entries(groupedFormats).map(([cat, formats]) => {
            return `CATEGORY: ${cat}\n${formats.join('\n')}`;
        }).join('\n\n');

        const systemPrompt = `You are a world-class Viral Video Strategist.
Your goal is to generate ${variationCount} DISTINCT video variations for a specific Ad Batch.

THE STRATEGY: "${strategy}"

CONTEXT INPUTS:
1. Brand Core:
   - Name: ${brandName}
   - Description: ${brandDesc}
   - Offer: ${offerBrief}
2. Targeting:
   - Demographic: ${demographic}
   - Awareness: ${awareness}
   - Desire: ${desire}
   - Visual Theme: ${theme} (${themeDesc})
3. Messaging Focus: ${mainMessaging}
4. Reference Material:
   - ${refHook ? `Ref Hook: ${refHook}` : ""}
   - ${refWhy ? `Why It Works: ${refWhy}` : ""}
   - ${refNotes ? `General Notes: ${refNotes}` : ""}
   - ${refTranscript ? `Ref Transcript: ${refTranscript.substring(0, 300)}...` : ""}

AVAILABLE FORMAT FRAMEWORKS:
${formatList}

TASK:
1. Select ${variationCount} distinct Frameworks from the list above.
   ${generateCopycatA ? '- NOTE: For the FIRST variation (Variation A), you MUST select the "Direct Response / Copycat" format.' : ''}
2. Generate a variation for EACH selected framework.

IMPORTANT RULES:
1. **Script Field**: Strictly for VOICE OVER (spoken words) or Text-on-Screen.
2. **Notes Field**: Visual Directions (Shots, camera moves).
3. **Durations**: Vary durations (15s - 60s).
4. **Format Selection**: You MUST use the EXACT format name from the provided list.

OUTPUT JSON FORMAT:
{
  "variations": [
    {
      "label": "[Title of the concept]",
      "formatName": "[Exact Name of Selected Framework]",
      "script": "Spoken words...",
      "notes": "Visuals...",
      "duration": 15
    },
    ...
  ]
}
`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Generate ${variationCount} variations now.` },
            ],
            response_format: { type: "json_object" },
            temperature: 0.9, // Higher temp for diverse format selection
        });

        const content = completion.choices[0].message.content;
        if (!content) throw new Error("No content generated");

        const result = JSON.parse(content);
        const variations = result.variations || [];

        // Save to DB
        const createdItems = [];
        let currentVariatonCharCode = startChar.charCodeAt(0);

        for (let i = 0; i < variations.length; i++) {
            const v = variations[i];

            // Normalize names for comparison
            const targetName = (v.formatName || "").toLowerCase().trim();

            // 1. Exact Match (Case Insensitive)
            let matchedFormat = allFormats.find(f => f.name.toLowerCase().trim() === targetName);

            // 2. Fuzzy/Partial Match if exact fails
            if (!matchedFormat) {
                matchedFormat = allFormats.find(f => f.name.toLowerCase().includes(targetName) || targetName.includes(f.name.toLowerCase()));
            }

            // 3. Fallback to first if still nothing (should be rare with improved prompt)
            if (!matchedFormat) matchedFormat = allFormats[0];

            // FORCE COPYCAT FORMAT FOR VARIATION A (only if flag is on AND it's the first one generated)
            if (generateCopycatA && i === 0) {
                const copycatFormat = allFormats.find(f => f.name.includes("Direct Response") || f.name.includes("Copycat"));
                if (copycatFormat) matchedFormat = copycatFormat;
            }

            const variationLetter = String.fromCharCode(currentVariatonCharCode);
            currentVariatonCharCode++; // Increment for next item

            const newItem = await prisma.batchItem.create({
                data: {
                    batchId: id,
                    status: 'PENDING',
                    formatId: matchedFormat?.id,
                    hookId: (isCopycat && generateCopycatA && i === 0) ? batch.referenceAd?.hookId : undefined, // Auto-assign Ref Hook ONLY for Copycat A
                    script: v.script,
                    notes: `**Concept: ${v.label}**\n${v.notes}`,
                    requestedDuration: v.duration,
                    variationIndex: variationLetter
                }
            });
            createdItems.push(newItem);
        }

        return NextResponse.json({ success: true, count: createdItems.length });

    } catch (error: any) {
        console.error("Failed to generate variations:", error);
        return NextResponse.json({ error: error.message || "Failed" }, { status: 500 });
    }
}
