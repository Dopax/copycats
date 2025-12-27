import { prisma } from '@/lib/prisma';
import { apiError, apiSuccess } from '@/lib/api-utils';

export async function GET() {
    try {
        const formats = await prisma.adFormat.findMany({
            include: {
                _count: {
                    select: {
                        ads: true,
                        batchItems: true
                    }
                },
                batchItems: {
                    select: {
                        id: true,
                        variationIndex: true,
                        batch: {
                            select: { id: true, name: true, status: true }
                        }
                    }
                },
                ads: {
                    select: { id: true, postId: true, brand: true, thumbnailUrl: true, videoUrl: true }
                }
            },
            orderBy: [
                { category: 'asc' },
                { name: 'asc' }
            ]
        });

        return apiSuccess(formats);
    } catch (error) {
        console.error("Failed to fetch formats:", error);
        return apiError("Failed to fetch formats");
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, description, brandId, audioChoice } = body;

        if (!name) {
            return apiError("Format name is required", 400);
        }

        const format = await prisma.adFormat.create({
            data: {
                name,
                description,
                brandId,
                audioChoice
            }
        });

        return apiSuccess(format, 201);
    } catch (error) {
        console.error("Failed to create format:", error);
        return apiError("Failed to create format");
    }
}

