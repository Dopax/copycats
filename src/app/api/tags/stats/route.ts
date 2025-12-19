
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        // We want tags sorted by number of creatives using them
        // Prisma doesn't support relation count sorting in findMany directly in all versions comfortably without aggregation
        // But we can usegroupBy or simple query if the dataset is small enough, or distinct count.

        // Let's use an aggregation to get counts
        // Group by tagId in the _TagToCreative join table is not directly exposed in Prisma Client API usually without raw query or explicit explicit join table model (which is implicit here).

        // Alternative: Fetch all tags and their counts.
        const tags = await prisma.tag.findMany({
            include: {
                _count: {
                    select: { creatives: true }
                }
            },
            where: {
                name: {
                    notIn: [], // Placeholder if we had specific ignore list
                    // We want to exclude strictly 'CID-' and 'L1:' starts
                },
                AND: [
                    { name: { not: { startsWith: 'CID-' } } },
                    { name: { not: { startsWith: 'L1:' } } }
                ]
            }
        });

        // Sort via JS (fast enough for < 1000 tags)
        const sortedTags = tags
            .map(t => ({
                id: t.id,
                name: t.name,
                count: t._count.creatives
            }))
            .sort((a, b) => b.count - a.count) // Descending
            .filter(t => t.count > 0); // Only show used tags

        // Limit to top 50, or maybe all if user wants list. Let's send top 100 for now.
        return NextResponse.json(sortedTags.slice(0, 100));

    } catch (error) {
        console.error("Error fetching tag stats:", error);
        return NextResponse.json({ error: "Failed to fetch tags" }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}
