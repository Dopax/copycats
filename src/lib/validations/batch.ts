/**
 * Batch Validation Schemas
 * Zod schemas for validating Batch API requests
 */

import { z } from 'zod';
import { BATCH_STATUS, BATCH_TYPE } from '../constants/status';

export const CreateBatchSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    angleId: z.string().uuid('Invalid angle ID'),
    batchType: z.enum([BATCH_TYPE.COPYCAT, BATCH_TYPE.NET_NEW, BATCH_TYPE.ITERATION]),

    // Optional fields
    brandId: z.string().uuid().optional(),
    formatId: z.string().uuid().optional().nullable(),
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional(),
    assignee: z.string().optional(),
    editorId: z.string().uuid().optional().nullable(),
    strategistId: z.string().uuid().optional().nullable(),
    brief: z.string().optional(),
    referenceAdId: z.string().uuid().optional().nullable(),
    mainMessaging: z.string().optional(),
});

export const UpdateBatchSchema = z.object({
    name: z.string().min(1).optional(),
    status: z.enum([
        BATCH_STATUS.IDEATION,
        BATCH_STATUS.CREATOR_BRIEFING,
        BATCH_STATUS.FILMING,
        BATCH_STATUS.EDITOR_BRIEFING,
        BATCH_STATUS.EDITING,
        BATCH_STATUS.REVIEW,
        BATCH_STATUS.AI_BOOST,
        BATCH_STATUS.LEARNING,
        BATCH_STATUS.ARCHIVED,
        BATCH_STATUS.TRASHED,
    ]).optional(),
    priority: z.enum(['HIGH', 'MEDIUM', 'LOW']).optional().nullable(),
    brief: z.string().optional(),
    idea: z.string().optional(),
    creatorBrief: z.string().optional(),
    shotlist: z.string().optional(),
    creatorBriefType: z.enum(['GENERAL', 'SPECIFIC', 'COPYCAT']).optional(),
    mainMessaging: z.string().optional(),
    learnings: z.string().optional(),
    projectFilesUrl: z.string().url().optional().or(z.literal('')),
    formatId: z.string().uuid().optional().nullable(),
    editorId: z.string().uuid().optional().nullable(),
    strategistId: z.string().uuid().optional().nullable(),
});

export type CreateBatchInput = z.infer<typeof CreateBatchSchema>;
export type UpdateBatchInput = z.infer<typeof UpdateBatchSchema>;
