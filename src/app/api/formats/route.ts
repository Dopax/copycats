import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const brandId = searchParams.get('brandId');

        const formats = await prisma.adFormat.findMany({
            where: brandId ? {
                OR: [
                    { brandId: null },
                    { brandId: brandId }
                ]
            } : {},
            include: {
                ads: {
                    select: {
                        id: true,
                        postId: true,
                        brand: true,
                        thumbnailUrl: true,
                        videoUrl: true,
                    },
                    take: 5
                },
                batches: {
                    select: {
                        id: true,
                        name: true,
                        status: true
                    },
                    take: 5
                }
            },
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(formats);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch formats" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name, description, audioChoice, brandId } = await request.json();

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const format = await prisma.adFormat.create({
            data: {
                name,
                description,
                audioChoice,
                brandId: brandId || null
            }
        });

        return NextResponse.json(format);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create format" }, { status: 500 });
    }
}
