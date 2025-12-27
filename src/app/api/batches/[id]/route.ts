import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        if (isNaN(id)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

        const batch = await prisma.adBatch.findUnique({
            where: { id },
            include: {
                angle: {
                    include: {
                        desire: true,
                        theme: true,
                        demographic: true,
                        awarenessLevel: true,
                        brand: true
                    }
                },
                format: true,
                items: { include: { hook: true, format: true }, orderBy: { id: 'asc' } },
                referenceAd: {
                    include: {
                        snapshots: true,
                        hook: true,
                        format: true,
                        awarenessLevel: true // Include this
                    }
                },
                referenceBatch: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                facebookAds: true,
                assignedCreators: true // Include assigned creators
            },
        });

        if (!batch) {
            return NextResponse.json({ error: "Batch not found" }, { status: 404 });
        }

        // WORKAROUND: Manually fetch conceptDoc for the related concept
        try {
            const raw = await prisma.$queryRaw`SELECT conceptDoc FROM AdAngle WHERE id = ${batch.angleId}`;
            if (Array.isArray(raw) && raw.length > 0) {
                (batch.angle as any).conceptDoc = (raw[0] as any).conceptDoc;
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
        // Check for status change to LAUNCHED
        let extraUpdates: any = {};
        if (data.status === "LAUNCHED") {
            // Only set launchedAt if it wasn't set before? Or reset it? 
            // Let's set it if we are moving TO launched.
            // But we need to know previous status to be sure? 
            // Simplified: If passing LAUNCHED, update launchedAt if not present, or maybe just update it.
            // Let's just update `launchedAt` if data.launchedAt is passed OR if status is LAUNCHED
            // Actually, best to do it if status changes. We can check if it's currently not LAUNCHED?
            // For simplicity in this one-shot update:
            extraUpdates.launchedAt = new Date();
        }

        // Allow manual override if passed
        if (data.launchedAt) extraUpdates.launchedAt = data.launchedAt;

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
                angleId: data.angleId,
                referenceAdId: data.referenceAdId,
                referenceBatchId: data.referenceBatchId,
                aiAdCopy: data.aiAdCopy,
                aiImagePrompt: data.aiImagePrompt,
                aiVideoPrompt: data.aiVideoPrompt,
                projectFilesUrl: data.projectFilesUrl,
                // New Fields
                idea: data.idea,
                creatorBrief: data.creatorBrief,
                shotlist: data.shotlist,
                creatorBriefType: data.creatorBriefType,

                mainMessaging: data.mainMessaging,
                learnings: data.learnings,
                strategySentence: data.strategySentence,
                ...extraUpdates
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
