export const DEFAULT_PERSONA_PROMPT = `
Create a "Eugene Schwartz" style buyer persona for a [PRODUCT TYPE / CATEGORY] brand.

CONTEXT:
 Audience Profile: [GENDER], [AGE RANGE]
 Awareness Level: [AWARENESS STAGE]
 Core Desire to Channel: [DESIRE] ([ANGLE DESCRIPTION])
 Visual Theme: [THEME]

SCHWARTZ PRINCIPLES TO APPLY:
1. "Identification": If the awareness is Unaware or Problem Aware, the persona cares about *themselves*, not the product. We must mirror their self-image.
2. "Gradualization": Start with beliefs they *already* hold. Do not ask them to change their mind yet.
3. "Mass Desire": Identify the permanent social/biological force driving them (e.g., to be attractive, to be superior, to belong).

OUTPUT REQUIREMENTS:
Generate a detailed persona document including:
- **Persona Name & Archetype**
- **The "Silent Assumption"**: What do they secretly believe about the world/themselves that we must agree with?
- **Core Desire**: How does [DESIRE] manifest in their daily life?
- **Pain Points**: Specific "Micro-Moments" of failure or frustration.
- **Gradualization Strategy**: What applies to their [AWARENESS STAGE]? 
   - (Unaware: Focus on Identity/Story. Problem Aware: Focus on the Pain. Solution Aware: Focus on the Mechanism.)
- **Key Hooks**: 3 specific opening lines that would stop their scroll.

TONE:
Psychologically astute, empathetic, deep, and raw. Avoid surface-level marketing jargon.
`;

export const DEFAULT_SCENARIOS_PROMPT = `
You are a world-class marketing strategist. Based on the provided Buyer Persona and Core Problem, generate 5 specific, "Day in the Life" scenarios where this persona acutely feels the pain of their problem.

Structure each scenario as follows:
[Scenario Title]
- Context: (Where are they? Who are they with? What time is it?)
- Trigger: (What happens that triggers the problem? Keep it subtle and realistic.)
- Internal Monologue: (What specific thought runs through their head? Use their voice.)
- Emotional Impact: (How does it make them feel in that moment? e.g., ashamed, frustrated, invisible.)

Constraints:
- Make them RAW and EMOTIONAL.
- Avoid generic marketing fluff.
- Focus on the "Micro-Moments" that hurt the most.
- Ensure variety (e.g., at work, at home, social gathering, alone).

Tone: Empathetic, observational, gritty, realistic.
`;

export const DEFAULT_BRIEF_PROMPT = `
You are an expert Direct Response Creative Strategist. Your goal is to write a highly converting filming brief for a UGC creator.

CONTEXT:
- Brand Name: [BRAND NAME]
- Product: [OFFER BRIEF]
- Target Audience: [AUDIENCE]
- Core Desire: [DESIRE] ([DESIRE DESCRIPTION])
- Awareness Level: [AWARENESS]
- Visual Theme/Tone: [THEME] ([THEME DESCRIPTION])
- Main Messaging Focus: [MAIN MESSAGING]
- Unique Idea/Angle: [IDEA]

Brand Info: [BRAND DESCRIPTION]

INSTRUCTIONS:
Write a detailed UGC Filming Brief.

1.  **SCRIPT STRUCTURE (Based on [AWARENESS] Level)**:
    - If "Unaware": Start with a relatable story or identity hook. Do NOT lead with the product.
    - If "Problem Aware": Agitate the specific symptom/pain related to [DESIRE].
    - If "Solution Aware": Compare against previous failed solutions. Focus on the mechanism.
    - If "Product Aware": Focus on proof, unboxing, or direct benefits.
    - If "Most Aware": Focus on the offer and urgency.

2.  **SECTIONS TO GENERATE**:
    - **Hook (0-3s)**: Visually arresting and emotionally resonant.
    - **Body**: The argument/story. Channel the [DESIRE]. Use the [THEME] to set the mood.
    - **CTA**: Clear instruction.

3.  **OUTPUT FORMAT**:
    Return ONLY the brief content in formatted Markdown. Include a "Concept" summary, "Visual Direction", and a "Script Table" (Scene | Visual | Audio).
`;
