import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const body = await request.json();
        const { hookId, notes, script, status, name } = body;

        // WORKAROUND: Use raw SQL because Prisma Client is stale (Windows file lock issue on generate)
        // We use $executeRaw for the update to support the new 'name' field.
        await prisma.$executeRaw`
            UPDATE BatchItem 
            SET name = ${name}, 
                hookId = ${hookId}, 
                notes = ${notes}, 
                script = ${script}, 
                status = ${status}
            WHERE id = ${id}
        `;

        // Fetch the updated item to return it (with relations)
        const updated = await prisma.batchItem.findUnique({
            where: { id },
            include: { hook: true }
        });

        if (updated) {
            // Manually attach name since stale client might not return it
            (updated as any).name = name;
        }

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Update item error:", error);
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
