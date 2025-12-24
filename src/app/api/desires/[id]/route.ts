import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const { name, category, description, brainClicks, notes } = await request.json();
        const { id } = params;

        const updated = await prisma.adDesire.update({
            where: { id },
            data: { name, category, description, brainClicks, notes },
        });

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update desire" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        await prisma.adDesire.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete desire" }, { status: 500 });
    }
}
