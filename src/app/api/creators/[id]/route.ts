
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const creator = await prisma.creator.findUnique({ where: { id: params.id } });
        if (!creator) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(creator);
    } catch (error) {
        console.error("Fetch creator error:", error);
        return NextResponse.json({ error: "Error fetching creator" }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const data = await request.json();
        const creator = await prisma.creator.update({
            where: { id: params.id },
            data: {
                name: data.name,
                country: data.country,
                language: data.language,
                pricePerVideo: data.pricePerVideo ? parseFloat(data.pricePerVideo) : undefined,
                demographic: data.demographic,
                collabCount: data.collabCount ? parseInt(data.collabCount) : undefined,
                email: data.email,
                phone: data.phone,
                source: data.source,
                type: data.type,
                joinedAt: data.joinedAt ? new Date(data.joinedAt) : undefined,
            }
        });
        return NextResponse.json(creator);
    } catch (error) {
        console.error("Update creator error:", error);
        return NextResponse.json({ error: "Error updating creator" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        await prisma.creator.delete({ where: { id: params.id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete creator error:", error);
        return NextResponse.json({ error: "Error deleting creator" }, { status: 500 });
    }
}
