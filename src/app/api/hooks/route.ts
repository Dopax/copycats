import { prisma } from '@/lib/prisma';
import { apiError, apiSuccess } from '@/lib/api-utils';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const brandId = searchParams.get('brandId');

        const hooks = await prisma.adHook.findMany({
            where: brandId ? {
                OR: [
                    { brandId: null },
                    { brandId: brandId }
                ]
            } : {},
            orderBy: { name: 'asc' },
            include: {
                brand: true,
                _count: {
                    select: { ads: true, batchItems: true }
                },
                ads: {
                    select: {
                        id: true,
                        postId: true,
                        headline: true,
                        thumbnailUrl: true
                    },
                    take: 5
                },
                batchItems: {
                    select: {
                        id: true,
                        batch: {
                            select: {
                                id: true,
                                name: true,
                                status: true
                            }
                        }
                    },
                    take: 5
                }
            }
        });
        return apiSuccess(hooks);
    } catch (error) {
        console.error("Failed to fetch hooks:", error);
        return apiError("Failed to fetch hooks");
    }
}

export async function POST(request: Request) {
    try {
        const { name, type, content, videoUrl, thumbnailUrl, brandId } = await request.json();

        if (!name) {
            return apiError("Hook name is required", 400);
        }

        const hook = await prisma.adHook.create({
            data: {
                name,
                type,
                content,
                videoUrl,
                thumbnailUrl,
                brandId: brandId || null
            }
        });
        return apiSuccess(hook, 201);
    } catch (error) {
        console.error("Failed to create hook:", error);
        return apiError("Failed to create hook");
    }
}

