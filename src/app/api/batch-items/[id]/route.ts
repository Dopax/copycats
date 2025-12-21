import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const { hookId, notes, script, status, videoUrl, videoName } = await request.json();

        const updated = await prisma.batchItem.update({
            where: { id },
            data: {
                hookId: hookId,
                notes: notes,
                script: script,
                status: status,
                videoUrl: videoUrl,
                videoName: videoName
            },
            include: { hook: true }
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
