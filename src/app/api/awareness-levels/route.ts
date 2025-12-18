import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const brandId = searchParams.get('brandId');

        const levels = await prisma.adAwarenessLevel.findMany({
            where: brandId ? {
                OR: [
                    { brandId: null },
                    { brandId: brandId }
                ]
            } : {},
            orderBy: { name: 'asc' }
        });

        // Custom Sort Order
        const order = ['Most Aware', 'Product Aware', 'Solution Aware', 'Problem Aware', 'Problem Unaware'];
        const sortedLevels = levels.sort((a, b) => {
            const indexA = order.indexOf(a.name);
            const indexB = order.indexOf(b.name);

            if (indexA !== -1 && indexB !== -1) return indexA - indexB; // Both in list
            if (indexA !== -1) return -1; // A is in list (Priority)
            if (indexB !== -1) return 1;  // B is in list (Priority)
            return a.name.localeCompare(b.name); // Neither (Alphabetical)
        });

        return NextResponse.json(sortedLevels);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch awareness levels" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name, brandId } = await request.json();

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const level = await prisma.adAwarenessLevel.create({
            data: {
                name,
                brandId: brandId || null
            }
        });

        return NextResponse.json(level);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create awareness level" }, { status: 500 });
    }
}
