
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const creatorCount = await prisma.creator.count();
    console.log(`Total Creators: ${creatorCount}`);

    const creators = await prisma.creator.findMany({
        take: 10,
        include: {
            _count: {
                select: { creatives: true }
            }
        },
        orderBy: {
            creatives: {
                _count: 'desc'
            }
        }
    });

    console.log("Top 10 Creators by Creative Count:");
    creators.forEach(c => {
        console.log(`- ${c.name} (${c.email}): ${c._count.creatives} creatives`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
