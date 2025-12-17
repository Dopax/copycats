import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const brandId = searchParams.get('brandId');

        const batches = await prisma.adBatch.findMany({
            where: brandId ? { brandId } : undefined,
            include: {
                concept: {
                    include: {
                        angle: true,
                        theme: true,
                        demographic: true
                    }
                },
                format: true,
                items: { include: { hook: true } },
                referenceAd: true,
            },
            orderBy: { updatedAt: 'desc' },
        });
        return NextResponse.json(batches);
    } catch (error) {
        console.error("Failed to fetch batches:", error);
        return NextResponse.json({ error: "Failed to fetch batches" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();

        // Basic validation
        if (!data.name || !data.conceptId || !data.batchType) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const batch = await prisma.adBatch.create({
            data: {
                name: data.name,
                status: "IDEATION",
                batchType: data.batchType,
                priority: data.priority,
                conceptId: data.conceptId,
                formatId: data.formatId,
                assignee: data.assignee,
                brief: data.brief,
                referenceAdId: data.referenceAdId,
                brandId: data.brandId,
            },
            include: {
                concept: true
            }
        });

        return NextResponse.json(batch);
    } catch (error) {
        console.error("Failed to create batch:", error);
        return NextResponse.json({ error: "Failed to create batch" }, { status: 500 });
    }
}
