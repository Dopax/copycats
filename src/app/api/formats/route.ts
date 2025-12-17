import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const formats = await prisma.adFormat.findMany({
            orderBy: { name: 'asc' },
            include: {
                ads: {
                    select: { id: true, postId: true, brand: true, thumbnailUrl: true, videoUrl: true }
                },
                batches: {
                    select: { id: true, name: true, status: true }
                }
            }
        });
        return NextResponse.json(formats);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch formats" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name } = await request.json();
        const format = await prisma.adFormat.create({
            data: { name }
        });
        return NextResponse.json(format);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create format" }, { status: 500 });
    }
}
