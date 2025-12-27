/**
 * Creator Validation Schemas
 * Zod schemas for validating Creator API requests
 */

import { z } from 'zod';

export const CreateCreatorSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    brandId: z.string().uuid('Invalid brand ID'),

    // Optional fields
    country: z.string().optional(),
    language: z.string().optional(),
    pricePerVideo: z.union([z.number(), z.string()]).optional().transform(val =>
        val ? parseFloat(String(val)) : 0
    ),
    demographicId: z.string().uuid().optional().nullable(),
    collabCount: z.union([z.number(), z.string()]).optional().transform(val =>
        val ? parseInt(String(val)) : 0
    ),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    source: z.string().optional(),
    messagingPlatform: z.string().optional(),
    paymentMethod: z.string().optional(),
    isRecurring: z.boolean().optional().default(false),
    joinedAt: z.string().optional(),
    profileImageUrl: z.string().url().optional().or(z.literal('')),
    gender: z.string().optional(),
    ageGroup: z.string().optional(),
});

export const UpdateCreatorSchema = CreateCreatorSchema.partial().extend({
    // Fields that can only be updated, not created
    status: z.enum(['APPLIED', 'APPROVED', 'REJECTED', 'ARCHIVED']).optional(),
    onboardingStep: z.enum(['OFFER', 'ORDER', 'UPLOAD', 'COMPLETED']).optional(),
    offerType: z.string().optional(),
    offerAmount: z.number().optional(),
    productLink: z.string().url().optional().or(z.literal('')),
    couponCode: z.string().optional(),
    orderNumber: z.string().optional(),
    activeBatchId: z.number().optional().nullable(),
    magicLinkToken: z.string().optional(),
});

export type CreateCreatorInput = z.infer<typeof CreateCreatorSchema>;
export type UpdateCreatorInput = z.infer<typeof UpdateCreatorSchema>;
