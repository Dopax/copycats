import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const brandId = searchParams.get('brandId');

        const angles = await prisma.adAngle.findMany({
            where: brandId ? {
                OR: [
                    { brandId: null },
                    { brandId: brandId }
                ]
            } : {},
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(angles);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch angles" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name, brandId, category, description, brainClicks, notes } = await request.json();

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const angle = await prisma.adAngle.create({
            data: {
                name,
                category,
                description,
                brainClicks,
                notes,
                brandId: brandId || null
            }
        });

        return NextResponse.json(angle);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create angle" }, { status: 500 });
    }
}
