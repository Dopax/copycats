
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const creator = await prisma.creator.findUnique({ where: { id: params.id } });
        if (!creator) return NextResponse.json({ error: "Not found" }, { status: 404 });
        return NextResponse.json(creator);
    } catch (error) {
        console.error("Fetch creator error:", error);
        return NextResponse.json({ error: "Error fetching creator" }, { status: 500 });
    }
}

import { randomUUID } from 'crypto';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const data = await request.json();
        console.log("PUT /api/creators/[id]:", { id: params.id, data });

        // Helper to safe parse floats/ints
        const safeFloat = (val: any) => {
            if (val === null || val === "") return null;
            if (val === undefined) return undefined;
            const num = parseFloat(val);
            return isNaN(num) ? undefined : num;
        };

        const safeInt = (val: any) => {
            if (val === null || val === "") return null;
            if (val === undefined) return undefined;
            const num = parseInt(val);
            return isNaN(num) ? undefined : num;
        };

        // Check if we need to generate a magic token (e.g. on approval or if missing)
        let magicLinkToken = data.magicLinkToken;
        if ((data.status === 'APPROVED' || data.onboardingStep) && !magicLinkToken) {
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
                pricePerVideo: safeFloat(data.pricePerVideo),
                demographicId: data.demographicId,
                collabCount: safeInt(data.collabCount) ?? undefined,
                email: data.email,
                phone: data.phone,
                socialHandle: data.socialHandle,
                gender: data.gender,
                ageGroup: data.ageGroup,

                source: data.source,
                messagingPlatform: data.messagingPlatform,
                paymentMethod: data.paymentMethod,
                isRecurring: data.isRecurring,
                status: data.status,
                joinedAt: data.joinedAt ? new Date(data.joinedAt) : undefined,
                profileImageUrl: data.profileImageUrl,

                onboardingStep: data.onboardingStep,
                offerType: data.offerType,
                offerAmount: safeFloat(data.offerAmount),
                productLink: data.productLink,
                couponCode: data.couponCode,

                orderNumber: data.orderNumber,
                magicLinkToken: magicLinkToken,

                activeBatchId: safeInt(data.activeBatchId)
            }
        });
        return NextResponse.json(creator);
    } catch (error) {
        console.error("Update creator error:", error);
        return NextResponse.json({ error: "Error updating creator" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        await prisma.creator.delete({ where: { id: params.id } });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete creator error:", error);
        return NextResponse.json({ error: "Error deleting creator" }, { status: 500 });
    }
}
