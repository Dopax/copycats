const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const LEVELS = [
    "Most Aware",
    "Problem Aware",
    "Problem Unaware",
    "Product Aware",
    "Solution Aware"
];

async function main() {
    console.log(`Start seeding awareness levels...`);
    for (const name of LEVELS) {
        const level = await prisma.adAwarenessLevel.upsert({
            where: { name },
            update: {},
            create: { name }
        });
        console.log(`Created/Updated awareness level: ${level.name}`);
    }
    console.log(`Seeding finished.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
