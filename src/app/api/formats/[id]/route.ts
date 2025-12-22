
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;

        const format = await prisma.adFormat.findUnique({
            where: { id },
            include: {
                ads: {
                    select: {
                        id: true,
                        headline: true,
                        thumbnailUrl: true,
                        videoUrl: true,
                        createdAt: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                },
                batches: {
                    select: {
                        id: true,
                        name: true,
                        status: true,
                        createdAt: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        });

        if (!format) {
            return NextResponse.json({ error: "Format not found" }, { status: 404 });
        }

        return NextResponse.json(format);
    } catch (error) {
        console.error("Failed to fetch format details:", error);
        return NextResponse.json({ error: "Failed to fetch format details" }, { status: 500 });
    }
}
