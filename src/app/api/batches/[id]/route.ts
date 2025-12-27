import { prisma } from '@/lib/prisma';
import { UpdateBatchSchema } from '@/lib/validations';
import { apiError, validationError, apiSuccess, notFound } from '@/lib/api-utils';
import { BATCH_STATUS } from '@/lib/constants/status';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        if (isNaN(id)) return apiError("Invalid ID", 400);

        const batch = await prisma.adBatch.findUnique({
            where: { id },
            include: {
                angle: {
                    include: {
                        desire: true,
                        theme: true,
                        demographic: true,
                        awarenessLevel: true,
                        brand: true
                    }
                },
                format: true,
                items: { include: { hook: true, format: true }, orderBy: { id: 'asc' } },
                referenceAd: {
                    include: {
                        snapshots: true,
                        hook: true,
                        format: true,
                        awarenessLevel: true
                    }
                },
                referenceBatch: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                facebookAds: true,
                assignedCreators: true
            },
        });

        if (!batch) {
            return notFound("Batch");
        }

        // WORKAROUND: Manually fetch conceptDoc for the related concept
        try {
            const raw = await prisma.$queryRaw`SELECT conceptDoc FROM AdAngle WHERE id = ${batch.angleId}`;
            if (Array.isArray(raw) && raw.length > 0) {
                (batch.angle as any).conceptDoc = (raw[0] as any).conceptDoc;
            }
        } catch (e) {
            console.warn("Failed to patch conceptDoc", e);
        }

        return apiSuccess(batch);
    } catch (error) {
        console.error("Failed to fetch batch:", error);
        return apiError("Failed to fetch batch");
    }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        if (isNaN(id)) return apiError("Invalid ID", 400);

        const rawData = await request.json();

        // Validate input with Zod
        const parsed = UpdateBatchSchema.safeParse(rawData);
        if (!parsed.success) {
            return validationError(parsed.error);
        }

        const data = parsed.data;

        // Check for status change to LAUNCHED
        let extraUpdates: Record<string, any> = {};
        if (data.status === BATCH_STATUS.LEARNING) {
            extraUpdates.launchedAt = new Date();
        }

        const updatedBatch = await prisma.adBatch.update({
            where: { id },
            data: {
                name: data.name,
                status: data.status,
                priority: data.priority,
                brief: data.brief,
                formatId: data.formatId,
                idea: data.idea,
                creatorBrief: data.creatorBrief,
                shotlist: data.shotlist,
                creatorBriefType: data.creatorBriefType,
                mainMessaging: data.mainMessaging,
                learnings: data.learnings,
                projectFilesUrl: data.projectFilesUrl,
                ...extraUpdates
            },
        });

        return apiSuccess(updatedBatch);
    } catch (error) {
        console.error("Failed to update batch:", error);
        return apiError("Failed to update batch");
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const id = parseInt(params.id);
        if (isNaN(id)) return apiError("Invalid ID", 400);

        await prisma.adBatch.delete({ where: { id } });
        return apiSuccess({ success: true });
    } catch (error) {
        console.error("Failed to delete batch:", error);
        return apiError("Failed to delete batch");
    }
}

