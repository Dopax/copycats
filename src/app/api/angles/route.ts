import { prisma } from '@/lib/prisma';
import { apiError, apiSuccess } from '@/lib/api-utils';

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

        // WORKAROUND: Fetch conceptDoc using raw SQL
        try {
            const rawDocs = await prisma.$queryRaw`SELECT id, conceptDoc FROM AdAngle`;
            const docMap = new Map((rawDocs as any[]).map((r: any) => [r.id, r.conceptDoc]));
            angles.forEach((c: any) => {
                c.conceptDoc = docMap.get(c.id);
            });
        } catch (e) {
            console.warn("Failed to fetch raw concept docs", e);
        }

        return apiSuccess(angles);
    } catch (error) {
        console.error("Failed to fetch angles:", error);
        return apiError("Failed to fetch angles");
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { desireId, themeId, demographicId, awarenessLevelId, brandId } = body;

        if (!desireId || !themeId || !demographicId) {
            return apiError("Missing required fields: desireId, themeId, demographicId", 400);
        }

        // Fetch names to generate angle name
        const desire = await prisma.adDesire.findUnique({ where: { id: desireId } });
        const theme = await prisma.adTheme.findUnique({ where: { id: themeId } });
        const demographic = await prisma.adDemographic.findUnique({ where: { id: demographicId } });

        if (!desire || !theme || !demographic) {
            return apiError("Invalid IDs provided", 400);
        }

        const generatedName = body.name || `${desire.name} + ${theme.name} + ${demographic.name}`;

        const newAngle = await prisma.adAngle.create({
            data: {
                name: generatedName,
                desireId,
                themeId,
                demographicId,
                awarenessLevelId,
                brandId,
                conceptDoc: body.conceptDoc
            },
            include: {
                desire: true,
                theme: true,
                demographic: true,
                awarenessLevel: true,
            }
        });

        return apiSuccess(newAngle, 201);
    } catch (error) {
        console.error("Failed to create ad angle:", error);
        return apiError("Failed to create ad angle");
    }
}

