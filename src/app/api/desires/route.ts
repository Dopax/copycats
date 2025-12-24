import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const brandId = searchParams.get('brandId');

        const desires = await prisma.adDesire.findMany({
            where: brandId ? {
                OR: [
                    { brandId: null },
                    { brandId: brandId }
                ]
            } : {},
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(desires);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch desires" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name, brandId, category, description, brainClicks } = await request.json();

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const newDesire = await prisma.adDesire.create({
            data: {
                name,
                category,
                description,
                brainClicks,
                brandId: brandId || null
            }
        });

        return NextResponse.json(newDesire);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create desire" }, { status: 500 });
    }
}
