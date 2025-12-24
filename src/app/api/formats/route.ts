
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const formats = await prisma.adFormat.findMany({
            include: {
                _count: {
                    select: {
                        ads: true,
                        batches: true
                    }
                },
                batches: {
                    select: { id: true, name: true, status: true }
                },
                ads: {
                    select: { id: true, postId: true, brand: true, thumbnailUrl: true, videoUrl: true }
                }
            },
            orderBy: {
                name: 'asc'
            }
        });

        return NextResponse.json(formats);
    } catch (error) {
        console.error("Failed to fetch formats:", error);
        return NextResponse.json({ error: "Failed to fetch formats" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, description, brandId, audioChoice } = body;

        const format = await prisma.adFormat.create({
            data: {
                name,
                description,
                brandId,
                audioChoice
            }
        });

        return NextResponse.json(format);
    } catch (error) {
        console.error("Failed to create format:", error);
        return NextResponse.json({ error: "Failed to create format" }, { status: 500 });
    }
}
