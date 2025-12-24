
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const body = await request.json();
        const { conceptDoc, personaScenarios } = body;

        const updateData: any = {};
        if (conceptDoc !== undefined) updateData.conceptDoc = conceptDoc; // Allow null to clear
        if (personaScenarios !== undefined) updateData.personaScenarios = personaScenarios; // Allow null to clear

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: "No update data provided" }, { status: 400 });
        }

        const angle = await prisma.adAngle.update({
            where: { id },
            data: updateData,
            include: {
                desire: true,
                theme: true,
                demographic: true,
                awarenessLevel: true,
                brand: true
            }
        });

        return NextResponse.json(angle);
    } catch (error) {
        console.error("Failed to update angle", error);
        return NextResponse.json({ error: "Failed to update angle" }, { status: 500 });
    }
}
