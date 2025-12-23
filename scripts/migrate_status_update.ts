
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting Migration: BRIEFING -> EDITOR_BRIEFING");

    const result = await prisma.adBatch.updateMany({
        where: { status: 'BRIEFING' },
        data: { status: 'EDITOR_BRIEFING' }
    });

    console.log(`Updated ${result.count} batches.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
