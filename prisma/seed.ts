
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Start seeding ...')

    // 0. Brand (Davincified)
    // We keep this to ensure at least one brand exists for login
    const brand = await prisma.brand.upsert({
        where: { name: 'Davincified' },
        update: {},
        create: {
            name: 'Davincified',
            color: '#161618',
            color2: '#ffffff'
        }
    })

    // 1. Hooks (Empty)
    // User requested to remove irrelevant seed data
    // const hooksData = [...] 

    // 2. Formats (Empty)

    // 3. Themes (Empty)

    // 4. Angles (Empty)

    // 5. Demographics
    const genders = ['Male', 'Female', 'All']; // Added 'All' just in case? User said Male/Female. I will stick to Male/Female and maybe All.
    // User explicitly said: "to be male/female and this age groups".
    // I will generate permutations for Male and Female.
    const ageGroups = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
    const demographics: string[] = [];

    // Add distinct permutations
    ['Male', 'Female'].forEach(g => {
        ageGroups.forEach(a => {
            demographics.push(`${g} ${a}`);
        });
    });
    // Add Age Only (Any Gender)? User didn't ask, but good practice. I'll stick to strict requests first.

    for (const name of demographics) {
        await prisma.adDemographic.upsert({
            where: { name },
            update: {},
            create: { name }
        })
    }

    // 6. Awareness Levels (Likely needed for logic, so keeping them is safe, or User might want to define them per brand? 
    // User specifically asked for these standard Marketing Levels in previous prompt.
    // "Most Aware", etc. These are universal specific marketing terms.
    // I will KEEP Awareness Levels because they are structural)
    const awarenessData = [
        'Most Aware',
        'Product Aware',
        'Solution Aware',
        'Problem Aware',
        'Problem Unaware'
    ]
    for (const name of awarenessData) {
        await prisma.adAwarenessLevel.upsert({
            where: { name },
            update: {},
            create: { name }
        })
    }

    console.log('Seeding finished (Clean).')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
