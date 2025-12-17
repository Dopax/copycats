import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Start seeding ...')

    // 1. Hooks
    const hooksData = [
        'Negative Hook',
        'Benefit Hook',
        'Question Hook',
        'Stat Hook',
        'Story Hook',
        'Contrarian Hook'
    ]
    const hooks = []
    for (const name of hooksData) {
        const h = await prisma.adHook.upsert({
            where: { name },
            update: {},
            create: { name }
        })
        hooks.push(h)
    }

    // 2. Formats
    const formatsData = [
        'UGC Testimonial',
        'UGC Problem/Solution',
        'Static Image',
        'Carousel',
        'Green Screen',
        'Unboxing',
        'Founder Story'
    ]
    const formats = []
    for (const name of formatsData) {
        const f = await prisma.adFormat.upsert({
            where: { name },
            update: {},
            create: { name }
        })
        formats.push(f)
    }

    // 3. Themes
    const themesData = [
        'Sustainability',
        'Luxury',
        'Affordability',
        'Health',
        'Convenience',
        'Gift'
    ]
    const themes = []
    for (const name of themesData) {
        const t = await prisma.adTheme.upsert({
            where: { name },
            update: {},
            create: { name }
        })
        themes.push(t)
    }

    // 4. Angles
    const anglesData = [
        'Save Money',
        'Save Time',
        'Feel Better',
        'Look Better',
        'Social Status',
        'Fear Of Missing Out'
    ]
    const angles = []
    for (const name of anglesData) {
        const a = await prisma.adAngle.upsert({
            where: { name },
            update: {},
            create: { name }
        })
        angles.push(a)
    }

    // 5. Demographics
    const demographicsData = [
        'Gen Z',
        'Millennials',
        'Parents',
        'Students',
        'Professionals',
        'Seniors'
    ]
    const demos = []
    for (const name of demographicsData) {
        const d = await prisma.adDemographic.upsert({
            where: { name },
            update: {},
            create: { name }
        })
        demos.push(d)
    }

    // 6. Sample Concept
    const concept = await prisma.creativeConcept.create({
        data: {
            name: "Eco-Friendly Budget Hack",
            angleId: angles[0].id, // Save Money
            themeId: themes[0].id, // Sustainability
            demographicId: demos[1].id, // Millennials
        }
    })

    // 7. Sample Batch
    const batch = await prisma.adBatch.create({
        data: {
            name: "Sustainability UGC Batch",
            batchType: "NET_NEW",
            priority: "HIGH",
            conceptId: concept.id,
            formatId: formats[0].id,
            status: "BRIEFING",
            brief: "Focus on the money-saving aspect of being eco-friendly.",
            items: {
                create: [
                    { status: 'PENDING', hookId: hooks[0].id, notes: "Start with 'Stop throwing away money...'" },
                    { status: 'PENDING', hookId: hooks[1].id, notes: "Show the bill comparison." }
                ]
            }
        }
    })

    console.log('Seeding finished.')
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
