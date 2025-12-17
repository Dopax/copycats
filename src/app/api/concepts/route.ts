import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const concepts = await prisma.creativeConcept.findMany({
            include: {
                angle: true,
                theme: true,
                demographic: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(concepts);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch concepts" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { angleId, themeId, demographicId } = await request.json();

        // Fetch names to generate concept name
        const angle = await prisma.adAngle.findUnique({ where: { id: angleId } });
        const theme = await prisma.adTheme.findUnique({ where: { id: themeId } });
        const demographic = await prisma.adDemographic.findUnique({ where: { id: demographicId } });

        if (!angle || !theme || !demographic) {
            return NextResponse.json({ error: "Invalid IDs provided" }, { status: 400 });
        }

        const generatedName = `${angle.name} - ${theme.name} - ${demographic.name}`;

        const concept = await prisma.creativeConcept.create({
            data: {
                name: generatedName,
                angleId,
                themeId,
                demographicId
            },
            include: {
                angle: true,
                theme: true,
                demographic: true
            }
        });

        return NextResponse.json(concept);
    } catch (error) {
        console.error("Failed to create concept:", error);
        return NextResponse.json({ error: "Failed to create concept" }, { status: 500 });
    }
}
