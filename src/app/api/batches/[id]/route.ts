import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

        const batch = await prisma.adBatch.findUnique({
            where: { id },
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
                awarenessLevel: true
            },
        });

        if (!batch) {
            return NextResponse.json({ error: "Batch not found" }, { status: 404 });
        }

        return NextResponse.json(batch);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch batch" }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

        const data = await request.json();

        // Prevent updating items directly here, usually done via separate endpoints or careful nested updates
        // For now, allow simple field updates
        const updatedBatch = await prisma.adBatch.update({
            where: { id },
            data: {
                name: data.name,
                status: data.status,
                batchType: data.batchType,
                priority: data.priority,
                assignee: data.assignee,
                brief: data.brief,
                formatId: data.formatId,
                conceptId: data.conceptId,
                referenceAdId: data.referenceAdId,
                awarenessLevelId: data.awarenessLevelId
            },
        });

        return NextResponse.json(updatedBatch);
    } catch (error) {
        console.error("Failed to update batch:", error);
        return NextResponse.json({ error: "Failed to update batch" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        await prisma.adBatch.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete batch" }, { status: 500 });
    }
}
