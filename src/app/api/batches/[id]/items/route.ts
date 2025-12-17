import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const batchId = parseInt(params.id);
        if (isNaN(batchId)) return NextResponse.json({ error: "Invalid Batch ID" }, { status: 400 });

        const { hookId, notes, status } = await request.json();

        // Create a new batch item
        const newItem = await prisma.batchItem.create({
            data: {
                batchId,
                hookId: hookId || null,
                notes: notes || "",
                status: status || "PENDING"
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
