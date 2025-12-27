import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CreateBatchSchema } from '@/lib/validations';
import { apiError, validationError, apiSuccess } from '@/lib/api-utils';
import { BATCH_STATUS, BATCH_TYPE } from '@/lib/constants/status';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const brandId = searchParams.get('brandId');
        const status = searchParams.get('status');

        const where: any = { brandId: brandId || null };
        if (status) {
            where.status = status;
        } else {
            where.status = { not: BATCH_STATUS.TRASHED };
        }

        const batches = await prisma.adBatch.findMany({
            where,
            include: {
                angle: {
                    include: {
                        desire: true,
                        theme: true,
                        demographic: true
                    }
                },
                format: true,
                items: { include: { hook: true } },
                referenceAd: true,
                editor: true,
                strategist: true
            },
            orderBy: { updatedAt: 'desc' },
        });
        return apiSuccess(batches);
    } catch (error) {
        console.error("Failed to fetch batches:", error);
        return apiError("Failed to fetch batches");
    }
}

export async function POST(request: Request) {
    try {
        const rawData = await request.json();

        // Validate input with Zod
        const parsed = CreateBatchSchema.safeParse(rawData);
        if (!parsed.success) {
            return validationError(parsed.error);
        }

        const data = parsed.data;

        const batch = await prisma.adBatch.create({
            data: {
                name: data.name,
                status: data.batchType === BATCH_TYPE.COPYCAT
                    ? BATCH_STATUS.CREATOR_BRIEFING
                    : BATCH_STATUS.IDEATION,
                batchType: data.batchType,
                priority: data.priority,
                angleId: data.angleId,
                formatId: data.formatId,
                assignee: data.assignee,
                editorId: data.editorId,
                strategistId: data.strategistId,
                brief: data.brief,
                referenceAdId: data.referenceAdId,
                brandId: data.brandId,
                mainMessaging: data.mainMessaging,
            },
            include: {
                angle: true,
                editor: true,
                strategist: true
            }
        });

        return apiSuccess(batch, 201);
    } catch (error) {
        console.error("Failed to create batch:", error);
        return apiError(`Failed to create batch: ${error instanceof Error ? error.message : String(error)}`);
    }
}

