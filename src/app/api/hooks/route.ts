import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const brandId = searchParams.get('brandId');

        const hooks = await prisma.adHook.findMany({
            where: brandId ? {
                OR: [
                    { brandId: null },
                    { brandId: brandId }
                ]
            } : {},
            orderBy: { name: 'asc' },
            include: {
                brand: true,
                _count: {
                    select: { ads: true, batchItems: true }
                }
            }
        });
        return NextResponse.json(hooks);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch hooks" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name, type, content, videoUrl, thumbnailUrl, brandId } = await request.json();
        const hook = await prisma.adHook.create({
            data: {
                name,
                type,
                content,
                videoUrl,
                thumbnailUrl,
                brandId: brandId || null
            }
        });
        return NextResponse.json(hook);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create hook" }, { status: 500 });
    }
}
