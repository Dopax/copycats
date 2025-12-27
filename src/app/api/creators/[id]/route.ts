import { prisma } from '@/lib/prisma';
import { UpdateCreatorSchema } from '@/lib/validations';
import { apiError, validationError, apiSuccess, notFound } from '@/lib/api-utils';
import { randomUUID } from 'crypto';
import { CREATOR_STATUS } from '@/lib/constants/status';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const creator = await prisma.creator.findUnique({ where: { id: params.id } });
        if (!creator) return notFound("Creator");
        return apiSuccess(creator);
    } catch (error) {
        console.error("Fetch creator error:", error);
        return apiError("Error fetching creator");
    }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const rawData = await request.json();

        // Validate with Zod
        const parsed = UpdateCreatorSchema.safeParse(rawData);
        if (!parsed.success) {
            return validationError(parsed.error);
        }

        const data = parsed.data;

        // Check if we need to generate a magic token (on approval)
        let magicLinkToken = data.magicLinkToken;
        if (data.status === CREATOR_STATUS.APPROVED && !magicLinkToken) {
            const existing = await prisma.creator.findUnique({ where: { id: params.id } });
            if (existing && !existing.magicLinkToken) {
                magicLinkToken = randomUUID();
            }
        }

        const creator = await prisma.creator.update({
            where: { id: params.id },
            data: {
                name: data.name,
                country: data.country,
                language: data.language,
                pricePerVideo: data.pricePerVideo,
                demographicId: data.demographicId,
                collabCount: data.collabCount,
                email: data.email,
                phone: data.phone,
                gender: data.gender,
                ageGroup: data.ageGroup,
                source: data.source,
                messagingPlatform: data.messagingPlatform,
                paymentMethod: data.paymentMethod,
                isRecurring: data.isRecurring,
                status: data.status,
                profileImageUrl: data.profileImageUrl,
                onboardingStep: data.onboardingStep,
                offerType: data.offerType,
                offerAmount: data.offerAmount,
                productLink: data.productLink,
                couponCode: data.couponCode,
                orderNumber: data.orderNumber,
                magicLinkToken: magicLinkToken,
                activeBatchId: data.activeBatchId,
            }
        });
        return apiSuccess(creator);
    } catch (error) {
        console.error("Update creator error:", error);
        return apiError("Error updating creator");
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        await prisma.creator.delete({ where: { id: params.id } });
        return apiSuccess({ success: true });
    } catch (error) {
        console.error("Delete creator error:", error);
        return apiError("Error deleting creator");
    }
}

