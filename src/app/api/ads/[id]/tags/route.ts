
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const { formatId, hookId, themeId, desireId, awarenessLevelId, awarenessLevelReason, demographicId } = await request.json();

        const data: any = {};
        if (formatId !== undefined) data.formatId = formatId;
        if (hookId !== undefined) data.hookId = hookId;
        if (themeId !== undefined) data.themeId = themeId;
        if (desireId !== undefined) data.desireId = desireId;
        if (awarenessLevelId !== undefined) data.awarenessLevelId = awarenessLevelId;
        if (awarenessLevelReason !== undefined) data.awarenessLevelReason = awarenessLevelReason;
        if (demographicId !== undefined) data.demographicId = demographicId;

        const updatedAd = await prisma.ad.update({
            where: { id },
            data,
            include: {
                format: true,
                hook: true,
                theme: true,
                desire: true,
                awarenessLevel: true,
                demographic: true
            }
        });

        return NextResponse.json(updatedAd);
    } catch (error) {
        console.error("Failed to update tags:", error);
        return NextResponse.json({ error: "Failed to update tags" }, { status: 500 });
    }
}
