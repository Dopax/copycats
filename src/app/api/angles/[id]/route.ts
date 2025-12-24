import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Update concept details (Angle, Theme, etc.)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const body = await request.json();
        const { desireId, themeId, demographicId, awarenessLevelId } = body;

        // 1. Fetch existing concept to get current IDs for any missing ones (partial update support)
        const existingAngle = await prisma.adAngle.findUnique({ where: { id: params.id } });
        if (!existingAngle) return NextResponse.json({ error: "Angle not found" }, { status: 404 });

        const finalDesireId = desireId || existingAngle.desireId;
        const finalThemeId = themeId || existingAngle.themeId;
        const finalDemographicId = demographicId || existingAngle.demographicId;
        const finalAwarenessId = awarenessLevelId !== undefined ? awarenessLevelId : existingAngle.awarenessLevelId; // Allow null if passed explicitly

        // 2. Fetch related objects to generate name
        const desire = await prisma.adDesire.findUnique({ where: { id: finalDesireId } });
        const theme = await prisma.adTheme.findUnique({ where: { id: finalThemeId } });
        const demographic = await prisma.adDemographic.findUnique({ where: { id: finalDemographicId } });
        const awareness = finalAwarenessId ? await prisma.adAwarenessLevel.findUnique({ where: { id: finalAwarenessId } }) : null;

        if (!desire || !theme || !demographic) {
            return NextResponse.json({ error: "Invalid IDs provided" }, { status: 400 });
        }

        const generatedName = `${desire.name} - ${theme.name} - ${demographic.name}${awareness ? ` (${awareness.name})` : ''}`;

        // 3. Update
        const updatedAngle = await prisma.adAngle.update({
            where: { id },
            data: {
                name: generatedName,
                desireId: finalDesireId,
                themeId: finalThemeId,
                demographicId: finalDemographicId,
                awarenessLevelId: finalAwarenessId
            },
            include: {
                desire: true,
                theme: true,
                demographic: true,
                awarenessLevel: true,
                batches: { select: { id: true, name: true, status: true } }
            }
        });

        return NextResponse.json(updatedAngle);
    } catch (error) {
        console.error("Failed to update angle", error);
        return NextResponse.json({ error: "Failed to update angle" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        await prisma.adAngle.delete({ where: { id: params.id } });

        return NextResponse.json({ success: true });
    } catch (error) {
    }
