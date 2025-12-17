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
        return NextResponse.json(levels);
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
