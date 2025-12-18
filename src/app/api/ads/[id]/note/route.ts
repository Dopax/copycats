
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const { notes, whyItWorks } = await request.json();

        const updatedAd = await prisma.ad.update({
            where: { id },
            data: { notes, whyItWorks },
        });

        return NextResponse.json(updatedAd);
    } catch (error) {
        console.error("Failed to update notes:", error);
        return NextResponse.json({ error: "Failed to update notes" }, { status: 500 });
    }
}
