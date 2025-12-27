
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const frameworks = [
    // --- DEMONSTRATION FORMATS ---
    { name: "Before & After in Action", category: "DEMONSTRATION", description: "Visual proof of transformation." },
    { name: "Live Demo", category: "DEMONSTRATION", description: "Real-time usage of the product." },
    { name: "Product in Action", category: "DEMONSTRATION", description: "Showing the product doing its job." },
    { name: "Silent Demo with Text Overlay", category: "DEMONSTRATION", description: "Visual-only demonstration with captions." },
    { name: "Unboxing Experience", category: "DEMONSTRATION", description: "The excitement of opening the product." },
    { name: "Process Showcase", category: "DEMONSTRATION", description: "Step-by-step of how it works or is made." },
    { name: "I Tried X So You Don't Have To", category: "DEMONSTRATION", description: "Testing a hack or product for the audience." },
    { name: "Satisfying Process Reveal", category: "DEMONSTRATION", description: "ASMR/Visually pleasing process." },
    { name: "Product Hack Demonstration", category: "DEMONSTRATION", description: "Using the product in a unique/clever way." },
    { name: "Quick Tutorial", category: "DEMONSTRATION", description: "Fast how-to guide." },
    { name: "Micro-Feature Spotlight", category: "DEMONSTRATION", description: "Focusing on one specific small feature." },
    { name: "Side-by-Side Comparison", category: "DEMONSTRATION", description: "Visual split showing with vs without." },
    { name: "Split-Screen Comparison", category: "DEMONSTRATION", description: "Simultaneous comparison." },
    { name: "Extreme Close-Up Details", category: "DEMONSTRATION", description: "Macro shots of texture and quality." },
    { name: "Slow-Motion Result Reveal", category: "DEMONSTRATION", description: "Dramatized result in slow motion." },
    { name: "Fast-Forward Transformation", category: "DEMONSTRATION", description: "Timelapse style speed run." },
    { name: "Silent ASMR Demonstration", category: "DEMONSTRATION", description: "Sound-focused sensory demo." },
    { name: "One Simple Swap Demonstration", category: "DEMONSTRATION", description: "Replacing an old habit with the product." },
    { name: "Timelapse Transformation", category: "DEMONSTRATION", description: "Long process compressed into seconds." },
    { name: "From this to this Transition", category: "DEMONSTRATION", description: "Quick cut transformation." },
    { name: "Gift with Purchase Unboxing", category: "DEMONSTRATION", description: "Showing bonus items." },

    // --- STORYTELLING & NARRATIVE ---
    { name: "Customer Journey", category: "STORYTELLING", description: "The path from problem to solution." },
    { name: "Origin Story", category: "STORYTELLING", description: "How the brand started." },
    { name: "Product Origin Story", category: "STORYTELLING", description: "Why this specific product was made." },
    { name: "Hero's Journey", category: "STORYTELLING", description: "Classic narrative arc applied to customer." },
    { name: "Personal Storytelling", category: "STORYTELLING", description: "Relatable personal anecdote." },
    { name: "Storytime with Product Solution", category: "STORYTELLING", description: "Telling a story while using the product." },
    { name: "What Happened Next?", category: "STORYTELLING", description: "Hook with a cliffhanger." },
    { name: "First-Time Experience", category: "STORYTELLING", description: "Genuine reaction to trying it first time." },
    { name: "Day in the Life", category: "STORYTELLING", description: "Vlog style usage integration." },
    { name: "This Changed Everything Revelation", category: "STORYTELLING", description: "Epiphany moment." },
    { name: "This Changed My Routine", category: "STORYTELLING", description: "Impact on daily life." },
    { name: "Life before/after Product Storyline", category: "STORYTELLING", description: "Narrative contrast." },
    { name: "Confession Style", category: "STORYTELLING", description: "Vulnerable/Honest admission to camera." },
    { name: "Documentary Style", category: "STORYTELLING", description: "Raw, unpolished, journalistic vibe." },
    { name: "Time Travel Format", category: "STORYTELLING", description: "Looking back or forward in time." },
    { name: "How It Started vs. How It's Going", category: "STORYTELLING", description: "Progress/Success story." },
    { name: "What I'd Tell My Younger Self", category: "STORYTELLING", description: "Advice and reflection." },
    { name: "I Was Wrong About...", category: "STORYTELLING", description: "Admitting a misconception corrected by product." },
    { name: "This is My Reality Clips", category: "STORYTELLING", description: "Raw, unfiltered life glimpses." },
    { name: "Obstacle Overcome Narrative", category: "STORYTELLING", description: "Beating a struggle." },
    { name: "Day in the Life (With/Without) Format", category: "STORYTELLING", description: "Comparative vlog." },

    // --- PROBLEM-SOLUTION ---
    { name: "Problem-Solution Reveal", category: "PROBLEM-SOLUTION", description: "Classic PAS structure." },
    { name: "3 Reasons Why", category: "PROBLEM-SOLUTION", description: "Logical arguments for the product." },
    { name: "Never Again Pain Focus", category: "PROBLEM-SOLUTION", description: "Emphasizing the end of a struggle." },
    { name: "This We Fixed Demonstration", category: "PROBLEM-SOLUTION", description: "Showcasing a specific fix." },
    { name: "Objection Crusher", category: "PROBLEM-SOLUTION", description: "Directly addressing consumer doubts." },
    { name: "Problem-Agitate-Solution Breakdown", category: "PROBLEM-SOLUTION", description: "Structured persuasion." },

    // --- COMPARISON ---
    { name: "This Versus Leading Brand", category: "COMPARISON", description: "Direct head-to-head." },
    { name: "Competitive Challenge", category: "COMPARISON", description: "Putting them to the test." },
    { name: "Expectation vs. Reality", category: "COMPARISON", description: "The product actually delivering." },
    { name: "Dramatic Cost Comparison", category: "COMPARISON", description: "Showing value/savings." },
    { name: "Price-Per-Use Breakdown", category: "COMPARISON", description: "Justifying cost over time." },
    { name: "Money-Saving Calculation", category: "COMPARISON", description: "ROI focus." },
    { name: "Time-Saving Demonstration", category: "COMPARISON", description: "Efficiency focus." },
    { name: "Ultimate Showdown", category: "COMPARISON", description: "Winner takes all competition." },
    { name: "Enemy vs. Us Comparison", category: "COMPARISON", description: "Villainizing the alternative." },
    { name: "Comparison Matrix Breakdown", category: "COMPARISON", description: "Checklist of features." },

    // --- CREDIBILITY ---
    { name: "Customer Testimonial", category: "CREDIBILITY", description: "Review from a buyer." },
    { name: "Expert Interview", category: "CREDIBILITY", description: "Authority figure validation." },
    { name: "Expert Tip Highlight", category: "CREDIBILITY", description: "Value-add advice from pro." },
    { name: "Authority Demonstration", category: "CREDIBILITY", description: "Showing mastery/credentials." },
    { name: "Case Study Presentation", category: "CREDIBILITY", description: "Data-backed results." },
    { name: "We Asked AI About... Product Validation", category: "CREDIBILITY", description: "Using AI as neutral arbiter." },
    { name: "Transparency Report", category: "CREDIBILITY", description: "Honest look at ingredients/process." },
    { name: "What We Learned Reflection", category: "CREDIBILITY", description: "Humility and growth." },
    { name: "Tried and Tested Format", category: "CREDIBILITY", description: "Rigorous testing proof." },
    { name: "Behind-the-Scenes", category: "CREDIBILITY", description: "Authentic look at production." },
    { name: "How We Made This", category: "CREDIBILITY", description: "Craftsmanship focus." },
    { name: "User Road Test", category: "CREDIBILITY", description: "Real world stress test." },
    { name: "Social Proof Montage", category: "CREDIBILITY", description: "Rapid fire reviews." },
    { name: "Expert Endorsement Clip", category: "CREDIBILITY", description: "Snippet of praise." },
    { name: "Celebrity Alignment Teaser", category: "CREDIBILITY", description: "Famous face usage." },
    { name: "Stats & Figures Credibility Clip", category: "CREDIBILITY", description: "Hard numbers." },
    { name: "Research Results Teaser", category: "CREDIBILITY", description: "Scientific backing." },
    { name: "Community-Driven Review Collage", category: "CREDIBILITY", description: "Aggregation of feedback." },

    // --- ATTENTION ---
    { name: "Stop Scrolling Hook", category: "ATTENTION", description: "Direct command to stop." },
    { name: "Controversial Hook", category: "ATTENTION", description: "Polarizing statement." },
    { name: "Curiosity Gap", category: "ATTENTION", description: "Hinting at something interesting." },
    { name: "Pattern Interrupt", category: "ATTENTION", description: "Visual/Audio jolt." },
    { name: "Wait Until You See Teaser", category: "ATTENTION", description: "Promise of a payoff." },
    { name: "Guess What This Does", category: "ATTENTION", description: "Interactive mystery." },
    { name: "What No One Tells You About...", category: "ATTENTION", description: "Insider secret." },
    { name: "You Won't Believe... Setup", category: "ATTENTION", description: "High stakes promise." },
    { name: "Weird Trick or Hack", category: "ATTENTION", description: "Unconventional solution." },
    { name: "Secret Hack Format", category: "ATTENTION", description: "Hidden knowledge." },
    { name: "Direct Question Format", category: "ATTENTION", description: "Provocative question." },
    { name: "Countdown-Style Content", category: "ATTENTION", description: "Urgency building." },
    { name: "Surprising Fact Reveal", category: "ATTENTION", description: "Did you know?" },
    { name: "FOMO Countdown Offer", category: "ATTENTION", description: "Fear of missing out." },
    { name: "Weird Trick/Unusual Hack Demo", category: "ATTENTION", description: "Strange but effective." },
    { name: "Insider Knowledge Teaser", category: "ATTENTION", description: "Expert secret." },
    { name: "Flash Sale Countdown", category: "ATTENTION", description: "Time sensitive." },
    { name: "New Discovery Product Launch", category: "ATTENTION", description: "Breaking news vibe." },
    { name: "Free Giveaway Announcement", category: "ATTENTION", description: "Incentive hook." },
    { name: "Buy One, Get One Free Demo", category: "ATTENTION", description: "Offer focus." },
    { name: "Disruptive Message (Losers vs. Winners)", category: "ATTENTION", description: "Identity polarization." },
    { name: "Exclusive Access Behind Closed Doors", category: "ATTENTION", description: "VIP feeling." },
    { name: "First Time Ever Format", category: "ATTENTION", description: "Novelty." },

    // --- INTERACTIVE & ENGAGEMENT ---
    { name: "Comment-Driven Responses", category: "INTERACTIVE", description: "Answering specific user comments." },
    { name: "Reacting to Comments", category: "INTERACTIVE", description: "Engaging with community feedback." },
    { name: "Quick-Fire FAQ", category: "INTERACTIVE", description: "Rapid question answering." },
    { name: "Fill in the Blank Challenge", category: "INTERACTIVE", description: "Inviting user completion." },
    { name: "This or That Choice Format", category: "INTERACTIVE", description: "Binary choice poll." },
    { name: "Choose Your Own Adventure", category: "INTERACTIVE", description: "Interactive narrative." },
    { name: "Duet/Stitch Format", category: "INTERACTIVE", description: "Building on other content." },
    { name: "Blind React Format", category: "INTERACTIVE", description: "Authentic first reaction." },
    { name: "Social Experiment", category: "INTERACTIVE", description: "Public testing/prank style." },
    { name: "Street Interview", category: "INTERACTIVE", description: "Man on the street vox pop." },
    { name: "24-Hour Challenge Results", category: "INTERACTIVE", description: "Time-bound test." },
    { name: "30-Second Challenge", category: "INTERACTIVE", description: "Speed test." },
    { name: "7-Day Transformation", category: "INTERACTIVE", description: "Short term journey." },
    { name: "Get Smarter in 5 Minutes", category: "INTERACTIVE", description: "Micro-learning." },
    { name: "Make It Ugly First Challenge", category: "INTERACTIVE", description: "Trust the process." },
    { name: "Gamified Tutorials", category: "INTERACTIVE", description: "Learning as a game." },

    // --- SKITS & SCENARIOS ---
    { name: "Acting Out a Scenario", category: "SKITS", description: "Dramatization of use case." },
    { name: "POV Skits", category: "SKITS", description: "First person perspective drama." },
    { name: "Husband/Wife Dynamics", category: "SKITS", description: "Relatable relationship humor." },
    { name: "Stay at Home Mom", category: "SKITS", description: "Relatable parenting humor." },
    { name: "If X Were a Person Skits", category: "SKITS", description: "Personification humor." },
    { name: "Fake Guru Parody", category: "SKITS", description: "Satire of industry tropes." },
    { name: "Situational Humor", category: "SKITS", description: "Relatable everyday funny moments." },
    { name: "Self-Doubt Moments", category: "SKITS", description: "Honest internal monologue." },
    { name: "Epic Fails & Recovery", category: "SKITS", description: "Disaster to success story." },
    { name: "Relatability-Based Skit", category: "SKITS", description: "It's funny because it's true." },

    // --- VISUAL & PRODUCTION ---
    { name: "Walking + Talking", category: "VISUAL", description: "Dynamic movement vlog." },
    { name: "iPhone Self-Recorded", category: "VISUAL", description: "Lo-fi authentic selfie mode." },
    { name: "No Makeup / No Edit", category: "VISUAL", description: "Raw authenticity." },
    { name: "Animation/Motion Graphics", category: "VISUAL", description: "High fidelity visual explanation." },
    { name: "Green Screen Effects", category: "VISUAL", description: "Commentary over visual assets." },
    { name: "Stop Motion Graphic", category: "VISUAL", description: "Stylized frame by frame animation." },
    { name: "Car/Studio Podcast Style", category: "VISUAL", description: "Talking heads conversation." },
    { name: "Car Podcast", category: "VISUAL", description: "Casual intimate setting." },
    { name: "Text Message/iMessage Style", category: "VISUAL", description: "Narrative through chat." },
    { name: "Reddit Post Style", category: "VISUAL", description: "Community story reading." },
    { name: "Billboard-like Statics", category: "VISUAL", description: "Bold simple messaging." },
    { name: "Visual Metaphor", category: "VISUAL", description: "Symbolic representation." },
    { name: "Emoji Storytelling", category: "VISUAL", description: "Narrative assisted by icons." },
    { name: "Deepfake / Face Swap Content", category: "VISUAL", description: "AI generated visual trickery." },
    { name: "Fake Product Ads", category: "VISUAL", description: "Satirical product concepts." },
    { name: "AI-Generated Content", category: "VISUAL", description: "Fully synthetic visuals." },
    { name: "AI Voiceover/Text-to-Speech", category: "VISUAL", description: "TikTok TTS style." },
    { name: "Voice-Over Internal Monologue", category: "VISUAL", description: "Hearing thoughts." },
    { name: "Whispered Secret Format", category: "VISUAL", description: "ASMR/Intimate secret sharing." },
    { name: "Trending Sound + Product Connection", category: "VISUAL", description: "Riding an audio trend." },
    { name: "Reaction Memes", category: "VISUAL", description: "Visual response to situations." },
    { name: "Reactive Trends", category: "VISUAL", description: "Jumping on current memes." },

    // --- EDUCATIONAL ---
    { name: "Myth vs. Fact", category: "EDUCATIONAL", description: "Correcting misconceptions." },
    { name: "X Habits/Tips for Success", category: "EDUCATIONAL", description: "Listicle advice." },
    { name: "How-To Guides", category: "EDUCATIONAL", description: "Instructional content." },
    { name: "Top 5/10 List", category: "EDUCATIONAL", description: "Ranked recommendations." },
    { name: "Quick Facts Overlay", category: "EDUCATIONAL", description: "Fast info delivery." },
    { name: "Rapid-Fire Features List", category: "EDUCATIONAL", description: "Benefit blitz." },
    { name: "Ingredient/Component Breakdown", category: "EDUCATIONAL", description: "What's inside." },
    { name: "Product Evolution Timeline", category: "EDUCATIONAL", description: "History of improvement." },
    { name: "Future of X Technology", category: "EDUCATIONAL", description: "Visionary outlook." },
    { name: "Industry Predictions & Trends", category: "EDUCATIONAL", description: "Thought leadership." },
    { name: "Behind the Numbers", category: "EDUCATIONAL", description: "Data driven insight." },
    { name: "Unbelievable Trivia", category: "EDUCATIONAL", description: "Fun facts." },
    { name: "What You Didn’t Know Series", category: "EDUCATIONAL", description: "Hidden knowledge." },

    // --- LIFESTYLE ---
    { name: "Aspirational Lifestyle Demo", category: "LIFESTYLE", description: "Selling the dream." },
    { name: "Morning Routine Integration", category: "LIFESTYLE", description: "Daily habit placement." },
    { name: "Seamless Integration Story", category: "LIFESTYLE", description: "Product fitting naturally." },
    { name: "Mission-Driven Content", category: "LIFESTYLE", description: "Values first." },
    { name: "Mission in Action", category: "LIFESTYLE", description: "Demonstrating impact." },
    { name: "Progress Over Time", category: "LIFESTYLE", description: "Journey documentation." },
    { name: "Real Customer Reactions", category: "LIFESTYLE", description: "Authentic joy/surprise." },
    { name: "User Experience Reaction", category: "LIFESTYLE", description: "UX focus." },
    { name: "User-Generated Compilation", category: "LIFESTYLE", description: "Community montage." },
    { name: "Unexpected Benefit Reveal", category: "LIFESTYLE", description: "Bonus value." },
    { name: "Unexpected Use Case", category: "LIFESTYLE", description: "Hack/New way to use." },
    { name: "2000s Nostalgia Format", category: "LIFESTYLE", description: "Throwback vibe." },
    { name: "Gen Z / Boomer / Millennial Tropes", category: "LIFESTYLE", description: "Generational humor." },
    { name: "Sarcasm & Satire", category: "LIFESTYLE", description: "Edgy humor." },
    { name: "Contrarian View", category: "LIFESTYLE", description: "Going against the grain." },
    { name: "Seasonal Problem Solver", category: "LIFESTYLE", description: "Relevant to time of year." },
    { name: "Niche Community Spotlight", category: "LIFESTYLE", description: "Focus on subculture." },
    { name: "Community Spotlight Showcase", category: "LIFESTYLE", description: "Featuring members." },
    { name: "Niche Community Appeal", category: "LIFESTYLE", description: "Speaking their language." },
    { name: "Subculture Adoption Angle", category: "LIFESTYLE", description: "Trend adoption." },
];

async function main() {
    console.log(`Seeding ${frameworks.length} Ad Frameworks...`);

    for (const f of frameworks) {
        // Upsert by name to avoid duplicates but update categories/descriptions
        await prisma.adFormat.upsert({
            where: { name: f.name },
            update: {
                category: f.category,
                description: f.description
            },
            create: {
                name: f.name,
                category: f.category,
                description: f.description
            }
        });
    }
    console.log("Seeding Completed.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
