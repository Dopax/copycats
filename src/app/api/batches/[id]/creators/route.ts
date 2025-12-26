import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// ASSIGN CREATOR TO BATCH
export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const batchId = parseInt(params.id);
        const { creatorId } = await request.json();

        if (isNaN(batchId) || !creatorId) {
            return NextResponse.json({ error: "Invalid parameters" }, { status: 400 });
        }

        // Update creator's active batch
        const updatedCreator = await prisma.creator.update({
            where: { id: creatorId },
            data: { activeBatchId: batchId }
        });

        return NextResponse.json(updatedCreator);
    } catch (error) {
        console.error("Failed to assign creator", error);
        return NextResponse.json({ error: "Failed to assign creator" }, { status: 500 });
    }
}

// UNASSIGN CREATOR FROM BATCH
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const { searchParams } = new URL(request.url);
        const creatorId = searchParams.get('creatorId');

        if (!creatorId) {
            return NextResponse.json({ error: "Creator ID required" }, { status: 400 });
        }

        // Update creator to remove active batch
        const updatedCreator = await prisma.creator.update({
            where: { id: creatorId },
            data: { activeBatchId: null }
        });

        return NextResponse.json(updatedCreator);
    } catch (error) {
        console.error("Failed to unassign creator", error);
        return NextResponse.json({ error: "Failed to unassign creator" }, { status: 500 });
    }
}
