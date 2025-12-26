import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const batchId = parseInt(params.id);
        if (isNaN(batchId)) return NextResponse.json({ error: "Invalid Batch ID" }, { status: 400 });

        const { hookId, notes, status } = await request.json();

        // Calculate next variationIndex
        const existingItems = await prisma.batchItem.findMany({
            where: { batchId },
            select: { variationIndex: true }
        });

        let nextIndex = 0;
        if (existingItems.length > 0) {
            const indices = existingItems
                .map(item => item.variationIndex ? item.variationIndex.charCodeAt(0) - 65 : -1)
                .filter(idx => idx >= 0);

            if (indices.length > 0) {
                nextIndex = Math.max(...indices) + 1;
            } else {
                nextIndex = existingItems.length; // Fallback if no indices are set yet
            }
        }
        const variationIndex = String.fromCharCode(65 + nextIndex);

        // Create a new batch item
        const newItem = await prisma.batchItem.create({
            data: {
                batchId,
                hookId: hookId || null,
                notes: notes || "",
                status: status || "PENDING",
                variationIndex
            },
            include: { hook: true }
        });

        return NextResponse.json(newItem);
    } catch (error) {
        console.error("Failed to add item to batch:", error);
        return NextResponse.json({ error: "Failed to add item" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        // This endpoint might be tricky if "id" is interpreted as batchId. 
        // Ideally we want /api/batches/[batchId]/items/[itemId] for DELETE.
        // But for simplicity let's assume we pass itemId in body or use a different structure.
        // Actually, let's make a separate route /api/batch-items/[id] for item management to be cleaner.
        return NextResponse.json({ error: "Use /api/batch-items/[id] to delete items" }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}
