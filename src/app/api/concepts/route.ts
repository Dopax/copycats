import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const brandId = searchParams.get('brandId');

        const concepts = await prisma.creativeConcept.findMany({
            where: brandId ? { brandId } : undefined,
            include: {
                angle: true,
                theme: true,
                demographic: true,
                awarenessLevel: true,
                batches: {
                    select: {
                        id: true,
                        name: true,
                        status: true
                    }
                }
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
        const { angleId, themeId, demographicId, awarenessLevelId, brandId } = await request.json();

        // Fetch names to generate concept name
        const angle = await prisma.adAngle.findUnique({ where: { id: angleId } });
        const theme = await prisma.adTheme.findUnique({ where: { id: themeId } });
        const demographic = await prisma.adDemographic.findUnique({ where: { id: demographicId } });
        const awareness = awarenessLevelId ? await prisma.adAwarenessLevel.findUnique({ where: { id: awarenessLevelId } }) : null;

        if (!angle || !theme || !demographic) {
            return NextResponse.json({ error: "Invalid IDs provided" }, { status: 400 });
        }

        const generatedName = `${angle.name} - ${theme.name} - ${demographic.name}${awareness ? ` (${awareness.name})` : ''}`;

        const concept = await prisma.creativeConcept.create({
            data: {
                name: generatedName,
                angleId,
                themeId,
                demographicId,
                awarenessLevelId,
                brandId
            },
            include: {
                angle: true,
                theme: true,
                demographic: true,
                awarenessLevel: true
            }
        });

        return NextResponse.json(concept);
    } catch (error) {
        console.error("Failed to create concept:", error);
        return NextResponse.json({ error: "Failed to create concept" }, { status: 500 });
    }
}
