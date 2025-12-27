import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const { hookId, formatId, notes, script, status, videoUrl, videoName, clearComments, requestedDuration } = await request.json();

        console.log(`[API] Updating Item ${id}`, { formatId, hookId, status });

        // Clear comments if requested (e.g. when replacing a video)
        if (clearComments) {
            await prisma.creativeComment.deleteMany({ where: { batchItemId: id } });
        }

        const updated = await prisma.batchItem.update({
            where: { id },
            data: {
                hookId: hookId,
                formatId: formatId,
                notes: notes,
                script: script,
                status: status,
                videoUrl: videoUrl,
                videoName: videoName,
                requestedDuration: requestedDuration
            },
            include: { hook: true, format: true }
        });

        // Loopback: If Revision Requested (PENDING + Notes), revert Batch to EDITING
        if (status === 'PENDING' && notes) {
            await prisma.adBatch.update({
                where: { id: updated.batchId },
                data: { status: 'EDITING' }
            });
        }

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        await prisma.batchItem.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
    }
}
