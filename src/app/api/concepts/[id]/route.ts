import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Update concept details (Angle, Theme, etc.)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const body = await request.json();
        const { angleId, themeId, demographicId, awarenessLevelId } = body;

        // 1. Fetch existing concept to get current IDs for any missing ones (partial update support)
        const existingConcept = await prisma.creativeConcept.findUnique({ where: { id } });
        if (!existingConcept) return NextResponse.json({ error: "Concept not found" }, { status: 404 });

        const finalAngleId = angleId || existingConcept.angleId;
        const finalThemeId = themeId || existingConcept.themeId;
        const finalDemographicId = demographicId || existingConcept.demographicId;
        const finalAwarenessId = awarenessLevelId !== undefined ? awarenessLevelId : existingConcept.awarenessLevelId; // Allow null if passed explicitly

        // 2. Fetch related objects to generate name
        const angle = await prisma.adAngle.findUnique({ where: { id: finalAngleId } });
        const theme = await prisma.adTheme.findUnique({ where: { id: finalThemeId } });
        const demographic = await prisma.adDemographic.findUnique({ where: { id: finalDemographicId } });
        const awareness = finalAwarenessId ? await prisma.adAwarenessLevel.findUnique({ where: { id: finalAwarenessId } }) : null;

        if (!angle || !theme || !demographic) {
            return NextResponse.json({ error: "Invalid IDs provided" }, { status: 400 });
        }

        const generatedName = `${angle.name} - ${theme.name} - ${demographic.name}${awareness ? ` (${awareness.name})` : ''}`;

        // 3. Update
        const updated = await prisma.creativeConcept.update({
            where: { id },
            data: {
                name: generatedName,
                angleId: finalAngleId,
                themeId: finalThemeId,
                demographicId: finalDemographicId,
                awarenessLevelId: finalAwarenessId
            },
            include: {
                angle: true,
                theme: true,
                demographic: true,
                awarenessLevel: true,
                batches: { select: { id: true, name: true, status: true } }
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error("Failed to update concept", error);
        return NextResponse.json({ error: "Failed to update concept" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        await prisma.creativeConcept.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete concept" }, { status: 500 });
    }
}
