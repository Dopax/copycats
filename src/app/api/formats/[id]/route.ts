import { prisma } from '@/lib/prisma';
import { apiError, apiSuccess, notFound } from '@/lib/api-utils';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;

        const format = await prisma.adFormat.findUnique({
            where: { id },
            include: {
                ads: {
                    select: {
                        id: true,
                        headline: true,
                        thumbnailUrl: true,
                        videoUrl: true,
                        createdAt: true
                    },
                    orderBy: { createdAt: 'desc' }
                },
                batches: {
                    select: {
                        id: true,
                        name: true,
                        status: true,
                        createdAt: true
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!format) {
            return notFound("Format");
        }

        return apiSuccess(format);
    } catch (error) {
        console.error("Failed to fetch format details:", error);
        return apiError("Failed to fetch format details");
    }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        const body = await request.json();
        const { name, description, audioChoice } = body;

        const format = await prisma.adFormat.update({
            where: { id },
            data: { name, description, audioChoice }
        });

        return apiSuccess(format);
    } catch (error) {
        console.error("Failed to update format:", error);
        return apiError("Failed to update format");
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const { id } = params;
        await prisma.adFormat.delete({ where: { id } });
        return apiSuccess({ success: true });
    } catch (error) {
        console.error("Failed to delete format:", error);
        return apiError("Failed to delete format");
    }
}

