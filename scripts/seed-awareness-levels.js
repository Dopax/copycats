
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const LEVELS = [
    "Most Aware",
    "Product Aware",
    "Solution Aware",
    "Problem Aware",
    "Unaware" // "Problem Unaware" is usually just "Unaware" in standard marketing, but I will stick to user request if they want exactly "Problem Unaware". The list provided says "Problem Unaware".
];

const CUSTOM_LEVELS = [
    "Most Aware",
    "Product Aware",
    "Solution Aware",
    "Problem Aware",
    "Problem Unaware"
];

async function main() {
    console.log("Seeding Awareness Levels...");

    for (const name of CUSTOM_LEVELS) {
        await prisma.adAwarenessLevel.upsert({
            where: { name },
            update: {},
            create: { name }
        });
    }

    console.log("Done.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
