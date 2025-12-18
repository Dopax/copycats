
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const body = await request.json();

        // Construct data object dynamically to allow partial updates if needed
        const data: any = {};
        if (body.notes !== undefined) data.notes = body.notes;
        if (body.whyItWorks !== undefined) data.whyItWorks = body.whyItWorks;
        if (body.transcript !== undefined) data.transcript = body.transcript;

        const updatedAd = await prisma.ad.update({
            where: { id },
            data,
        });

        return NextResponse.json(updatedAd);
    } catch (error) {
        console.error("Failed to update ad details:", error);
        return NextResponse.json({ error: "Failed to update ad details" }, { status: 500 });
    }
}
