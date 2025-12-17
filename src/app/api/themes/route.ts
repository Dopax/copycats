import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const brandId = searchParams.get('brandId');

        const themes = await prisma.adTheme.findMany({
            where: brandId ? {
                OR: [
                    { brandId: null },
                    { brandId: brandId }
                ]
            } : {},
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(themes);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch themes" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name, brandId } = await request.json();

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const theme = await prisma.adTheme.create({
            data: {
                name,
                brandId: brandId || null
            }
        });

        return NextResponse.json(theme);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create theme" }, { status: 500 });
    }
}
