import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const { name, type, content, videoUrl, thumbnailUrl } = await request.json();
        const { id } = params;

        const updated = await prisma.adHook.update({
            where: { id },
            data: {
                name,
                type,
                content,
                videoUrl,
                thumbnailUrl
            },
        });

        return NextResponse.json(updated);
    } catch (error) {
        return NextResponse.json({ error: "Failed to update hook" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        await prisma.adHook.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete hook" }, { status: 500 });
    }
}
