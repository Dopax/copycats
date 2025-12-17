
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const { formatId, hookId, themeId, angleId } = await request.json();

        const data: any = {};
        if (formatId !== undefined) data.formatId = formatId;
        if (hookId !== undefined) data.hookId = hookId;
        if (themeId !== undefined) data.themeId = themeId;
        if (angleId !== undefined) data.angleId = angleId;

        const updatedAd = await prisma.ad.update({
            where: { id },
            data,
            include: {
                format: true,
                hook: true,
                theme: true,
                angle: true
            }
        });

        return NextResponse.json(updatedAd);
    } catch (error) {
        console.error("Failed to update tags:", error);
        return NextResponse.json({ error: "Failed to update tags" }, { status: 500 });
    }
}
