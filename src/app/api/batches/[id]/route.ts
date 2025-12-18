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
                        demographic: true,
                        awarenessLevel: true
                    }
                },
                format: true,
                items: { include: { hook: true } },
                referenceAd: true
            },
        });

        if (!batch) {
            return NextResponse.json({ error: "Batch not found" }, { status: 404 });
        }

        // WORKAROUND: Manually fetch conceptDoc for the related concept
        try {
            const raw = await prisma.$queryRaw`SELECT conceptDoc FROM CreativeConcept WHERE id = ${batch.conceptId}`;
            if (Array.isArray(raw) && raw.length > 0) {
                (batch.concept as any).conceptDoc = (raw[0] as any).conceptDoc;
            }
        } catch (e) {
            console.warn("Failed to patch conceptDoc", e);
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
                aiAdCopy: data.aiAdCopy,
                aiImagePrompt: data.aiImagePrompt,
                aiVideoPrompt: data.aiVideoPrompt,
                projectFilesUrl: data.projectFilesUrl
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
