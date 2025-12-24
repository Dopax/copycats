import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const brandId = searchParams.get('brandId');

        const angles = await prisma.adAngle.findMany({
            where: brandId ? { brandId } : undefined,
            include: {
                desire: true,
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

        // WORKAROUND: Fetch conceptDoc using raw SQL because Prisma Client is stale
        // and doesn't know about this new field yet (requires server restart).
        try {
            const rawDocs = await prisma.$queryRaw`SELECT id, conceptDoc FROM AdAngle`;
            const docMap = new Map((rawDocs as any[]).map((r: any) => [r.id, r.conceptDoc]));

            concepts.forEach((c: any) => {
                c.conceptDoc = docMap.get(c.id);
            });
        } catch (e) {
            console.warn("Failed to fetch raw concept docs, ignoring...", e);
        }
        return NextResponse.json(angles);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch angles" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { desireId, themeId, demographicId, awarenessLevelId, brandId } = body;

        // Fetch names to generate angle name (formerly concept name)
        const desire = await prisma.adDesire.findUnique({ where: { id: desireId } });
        const theme = await prisma.adTheme.findUnique({ where: { id: themeId } });
        const demographic = await prisma.adDemographic.findUnique({ where: { id: demographicId } });
        const awareness = awarenessLevelId ? await prisma.adAwarenessLevel.findUnique({ where: { id: awarenessLevelId } }) : null;

        if (!desire || !theme || !demographic) {
            return NextResponse.json({ error: "Invalid IDs provided" }, { status: 400 });
        }

        // The provided snippet uses body.name, so the generatedName logic is removed.
        // If body.name is not provided, you might want to re-introduce a generated name.

        const newAngle = await prisma.adAngle.create({
            data: {
                name: body.name,
                desireId: body.desireId,
                themeId: body.themeId,
                demographicId: body.demographicId,
                awarenessLevelId: body.awarenessLevelId,
                brandId: body.brandId,
                conceptDoc: body.conceptDoc
            },
            include: {
                desire: true,
                theme: true,
                demographic: true,
                awarenessLevel: true,
            }
        });
        return NextResponse.json(newAngle);
    } catch (error) {
        console.error("Failed to create ad angle:", error);
        return NextResponse.json({ error: "Failed to create ad angle" }, { status: 500 });
    }
}
