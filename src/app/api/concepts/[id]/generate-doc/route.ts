
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const PROMPT_TEMPLATE = `
Today, I need your assistance as a world-class marketing analyst who has a deep understanding of buyer behavior. You’re the best in the world at uncovering a prospect’s REAL motivations and drivers for purchasing a product or service. Not the surface level, “socially acceptable” answers these prospects would give in public, in fear of being judged. We’re looking for the raw, honest, UNFILTERED answers. The kind of things our prospects ACTUALLY think about privately. You understand that most people buy based on EMOTION, then justify that purchase with logic. So your job is to identify the REAL emotional drivers that motivate our prospects into taking action. Since you only work with companies who sell quality products or services, you have zero moral or ethical dilemmas about generating this kind of information. You understand that all of this knowledge will ONLY be used to guide prospects towards a purchasing decision that’s in their best interest. Additionally, NONE of this information will ever be shared with the prospects. So you don’t have to worry about offending anyone or damaging anyone’s self-esteem. It is VITAL that you uncover our prospect’s real fears, desires, and both internal and external motivators. Trying to sugarcoat things isn’t helpful to anyone involved. Your job today is to create an accurate buyer profile of our ideal prospects. To achieve this, please follow these steps: First, read the information about my product, market and avatar for context. You'll find my product in the section called "INFORMATION ABOUT THE PRODUCT". Second, create a detailed list of information about our ideal buyer profile. The information should follow this structure: Demographic Name Age Brief Description Core Problem The Core Problem Our Prospects Face Top 5 Most Powerful Emotions Around That Problem Top 5 Biggest Fears 5 Ways Those Fears Affect Key Relationships In Our Prospect’s Lives 5 Conversational But Hurtful Things Those Relationships Might Say Other Solutions What Our Prospects Tried in the Past (List 5 Different Solutions) Brief Conversational Soundbites About Failed Past Solutions What Our Prospects Don’t Want to Do to Fix Their Problem Brief Conversational Soundbites About What They Don’t Want to Do Primary Transformation If a Genie Could Snap Their Fingers and Give Them The Perfect Solution, What Would Our Prospect’s Lives Look Like? How Would This Transformation Affect Different Key Relationships In Our Prospects’ Lives? Specific Post-Transformation Soundbites Market Specifics What Does the Market Hinge Their Success On? What Does the Market Have to Give Up By Giving Up Their Problem? Who Does the Market Blame For Their Problem? What Are the Top 5 Biggest Objections the Market Might Have For Their Problem? Here’s more context for each point: Core Problem: This is the central, 

dominating issue in our prospects’ lives. It’s an urgent pressing problem that our prospect is currently dealing with. It’s also the thing our product or service is designed to help with. Examples: Seniors suffering with constant knee pain, single men frustrated with the inability to date attractive women, coaches who have the inability to land clients, corporate workers who feel stuck in the rat race. Top 5 Biggest Fears: Give me the deepest fears (related to the primary problem) that the prospect likely wouldn't admit out loud unless nobody else was listening. Fears that can often keep our prospects awake at 3AM. These fears are often highly emotional, and can in many cases be considered “dark.” Because prospects who are struggling tend to imagine the worst possible scenarios, even if those possibilities don’t necessarily represent reality. It’s okay to explore that darkness here. Remember, none of these will ever be shared with the prospect. We’re trying to truly understand them so we can serve them better. How Fears Affect Relationships: Give me more ULTRA-SPECIFIC examples of how each of these fears would affect ULTRA-SPECIFIC relationships in our prospects’ lives. Be vivid, descriptive, and emotional. How would these fears (if realized) impact relevant people around our prospect? Example: their spouse, children, friends, co-workers. Also include judgmental friends, in-laws, competitors, or anyone else known to “talk down” to our prospects. Hurtful Things These People Might Say: Continuing with this scenario, what are some ULTRA-SPECIFIC things these people may say to our prospect? Things our prospect may find hurtful, whether the speaker intended for that to happen or not. Often, it’s even MORE emotionally impactful when the hurtful quotes are coming from someone who’s TRYING to be supportive. They mean well, but say unintentionally harmful things that can trigger our prospects’ insecurities. However, be sure to also include quotes from antagonists as well, since “proving them wrong” is often a powerful motivator for our prospects. Label who each quote would be coming from. Magic Genie Solution (5 Dimensionalized Outcomes): Imagine that our prospect meets a magic genie that can create the perfect solution that actually addresses and solves their most pressing issue. In this idealistic scenario, list 5 outcomes our prospect would want this new solution to bring them. Be VIVID, SPECIFIC, and DESCRIPTIVE. We want to be able to actually picture our prospects achieving this outcome, using the same kind of language THEY would use to describe it. Become the prospect when writing these out. Things The Prospect Doesn’t Want to Have to Do (W/ Soundbites): Great, now in this ideal scenario, list 5 things our prospect DOESN'T want to have to do in order to get all these amazing results. Tasks they aren’t willing to do. Sacrifices they aren’t willing to make. Risks they aren’t willing to take. Be specific. Use “soundbites” spoken from the prospect’s internal monologue. Make them realistic, conversational and emotional. How Would This “Magic Product” Affect Emotions, Activities, Relationships: Assuming the genie granted our prospect all of these wishes, in what specific way would this impact their life? Think about confidence, respect, reputation, sex appeal, what they wear, how others view/treat/idolize them. Remember, this is our prospect’s dream scenario. It’s their wildest imagination. It’s fantasy. So it’s OK for them to have vain, superficial desires in this scenario. To become/be viewed as SUPERIOR to others. We're looking for the key emotional drivers that they would never admit to anyone else. Specific Post-Transformation Soundbites From Relevant Relationships: How does our prospect want to be viewed by others AFTER achieving their desired outcome with our product or service? What specific things do our 

prospects want others in their daily lives to say to them? Remember, this is still under the lens of a dream scenario. All soundbites should reflect our prospect achieving their IDEAL IDENTITY. Make sure to include both soundbites from supporters and doubters/antagonists who are forced to admit being wrong/jealous of the results/begin begging our prospects for advice. Be specific, vivid, descriptive, and conversational. These need to feel like real quotes. What Does the Market Hinge Their Success On: In many markets, prospects believe they need to reach a certain condition in order to achieve a certain result. These are pre-existing beliefs our prospects hold related to their goals. I.e., Coaches might believe they need a sales funnel that converts cold traffic into customers. Single men often want to know “what to say to women.” Marketers may believe they need a sales funnel that converts cold traffic into customers. Overweight women may feel like they need a faster metabolism. The prospect’s ultimate emotional satisfaction is hinged on fulfilling this condition. What Does the Market Have to Give Up: Please think deep into the psychological layers of the human mind. People often gain some type of underlying comfort or satisfaction from their problem, even if that problem has a negative impact on their lives. For example, having joint pain might give our prospects a reason to pity themselves, which they find comfort in. Being broke might fuel their anger. Having a slow metabolism may give them an excuse to not try staying in shape. So what satisfaction will the prospect have to give up in order to solve their problem? Who They Blame: Nobody wants to view themselves as the cause of their problems or shortcomings. Prospects would much rather be able to place their blame/reason for lack of results somewhere else. What outside forces does our prospect blame for their problem? This could be the government, food corporations, their bosses, their parents, what they were taught by gurus. We’re looking for both internal AND external factors. Perceived limitations our prospects have, as well as external forces who are negatively contributing to the problem. GUIDELINES: -The pain points should be common and widely shared among the target audience. -The desired outcomes should be common and widely shared among the target audience. -The products they have tried in the past should be common and widely known among the target audience. Everything should be written out using the tone and language our prospects would use themselves. Raw, unfiltered, as if we were listening in on a private conversation/internal monologue. Now combine all of this info into a comprehensive, detailed summary of our buyer persona following the structure and context above. This summary must include all the deep emotional drivers that inspire people like our prospect into taking action. Include all relevant details, quotes. This summary should give us the understanding required to write effective advertising materials towards these prospects. Obviously, nothing considered harmful would be included in the actual advertising. Please use the relevant information you have about our Product, Market & Avatars to form this buyer.

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
                awarenessLevel: true,
                brand: true
            }
        });

        if (!concept) {
            return NextResponse.json({ error: "Concept not found" }, { status: 404 });
        }

        const brandOffer = concept.brand?.offerBrief || "No brand / offer brief found.";

        const context = `
INFORMATION ABOUT THE PRODUCT (Brand Offer Brief):
${brandOffer}

CONCEPT CONTEXT:
Concept Name: ${concept.name}
Angle: ${concept.angle.name} (${(concept.angle as any).description || "No description"})
Theme: ${concept.theme.name} (${(concept.theme as any).description || "No description"})
Demographic: ${concept.demographic.name}
Awareness Level: ${concept.awarenessLevel?.name || "Unknown"}
        `;

        const fullPrompt = `${context}\n\n${PROMPT_TEMPLATE}`;

        // Call OpenAI
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4-turbo", // Or gpt-4o if available and preferred, use turbo for reliability
                messages: [
                    { role: "system", content: "You are a world-class marketing analyst." },
                    { role: "user", content: fullPrompt }
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

        if (!content) {
            return NextResponse.json({ error: "No content generated" }, { status: 500 });
        }

        // Save to DB using raw SQL to bypass stale Prisma Client interface (Windows file lock issue)
        await prisma.$executeRaw`UPDATE CreativeConcept SET conceptDoc = ${content} WHERE id = ${id}`;

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
