import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const brandId = searchParams.get('brandId');
        const status = searchParams.get('status');

        const where: any = { brandId: brandId || null };
        if (status) {
            where.status = status;
        } else {
            where.status = { not: "TRASHED" };
        }

        const batches = await prisma.adBatch.findMany({
            where,
            include: {
                angle: {
                    include: {
                        desire: true,
                        theme: true,
                        demographic: true
                    }
                },
                format: true,
                items: { include: { hook: true } },
                referenceAd: true,
                editor: true,
                strategist: true
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
        if (!data.name || !data.angleId || !data.batchType) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const batch = await prisma.adBatch.create({
            data: {
                name: data.name,
                status: data.batchType === "COPYCAT" ? "CREATOR_BRIEFING" : "IDEATION",
                batchType: data.batchType,
                priority: data.priority,
                angleId: data.angleId,
                formatId: data.formatId,
                assignee: data.assignee, // Legacy/Fallback
                editorId: data.editorId || null,
                strategistId: data.strategistId || null,
                brief: data.brief,
                referenceAdId: data.referenceAdId,
                brandId: data.brandId,
                mainMessaging: data.mainMessaging,
            },
            include: {
                angle: true,
                editor: true,
                strategist: true
            }
        });

        return NextResponse.json(batch);
    } catch (error) {
        console.error("Failed to create batch:", error);
        return NextResponse.json({ error: `Failed to create batch: ${error instanceof Error ? error.message : String(error)}` }, { status: 500 });
    }
}
