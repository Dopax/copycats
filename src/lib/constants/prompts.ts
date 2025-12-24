export const DEFAULT_PERSONA_PROMPT = `
Create a detailed buyer persona for a [PRODUCT TYPE / CATEGORY] brand.

Audience Profile
Gender: [GENDER]
Age range: [AGE RANGE]
Awareness stage: [AWARENESS STAGE]

Desire
They buy because of: [DESIRE, for example connecting to identity, self care, productivity, gifting, mastery]

Theme / Aesthetic World
Core theme: [THEME]

Output Requirements
Generate a buyer persona document that includes:
- Persona name
- Demographics
- Psychographics
- Lifestyle and routines
- Interests and hobbies
- Emotional motivations
- Pain points or unmet desires, appropriate to their awareness stage
- Buying triggers
- Objections or hesitations
- How [PRODUCT] naturally fits into their identity and lifestyle
- Ideal messaging tone and language
- Best marketing channels
- Key messaging hooks

Writing Guidelines
- Focus on identity alignment and emotional resonance
- Do not over explain the product
- Use marketing ready language
- Avoid technical feature descriptions unless relevant to the awareness stage
- Make the persona immediately usable for ads, emails, and branding decisions.
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
