
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;

        // Toggle logic: get current, flip it
        const creative = await prisma.creative.findUnique({
            where: { id },
            select: { isFavorite: true }
        });

        if (!creative) {
            return NextResponse.json({ error: 'Creative not found' }, { status: 404 });
        }

        const updated = await prisma.creative.update({
            where: { id },
            data: { isFavorite: !creative.isFavorite }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error toggling favorite:', error);
        return NextResponse.json({ error: 'Failed to toggle favorite' }, { status: 500 });
    }
}
