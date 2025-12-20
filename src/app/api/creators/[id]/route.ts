
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

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const data = await request.json();
        const crypto = require('crypto');

        // Check if we need to generate a magic token (e.g. on approval or if missing)
        let magicLinkToken = data.magicLinkToken;
        if ((data.status === 'APPROVED' || data.onboardingStep) && !magicLinkToken) {
             const existing = await prisma.creator.findUnique({ where: { id: params.id } });
             if (existing && !existing.magicLinkToken) {
                 magicLinkToken = crypto.randomUUID();
             }
        }

        const creator = await prisma.creator.update({
            where: { id: params.id },
            data: {
                name: data.name,
                country: data.country,
                language: data.language,
                pricePerVideo: data.pricePerVideo ? parseFloat(data.pricePerVideo) : undefined,
                demographicId: data.demographicId,
                collabCount: data.collabCount ? parseInt(data.collabCount) : undefined,
                email: data.email,
                phone: data.phone,
                socialHandle: data.socialHandle,
                gender: data.gender,
                ageGroup: data.ageGroup,
                
                source: data.source,
                messagingPlatform: data.messagingPlatform,
                paymentMethod: data.paymentMethod,
                type: data.type,
                status: data.status,
                joinedAt: data.joinedAt ? new Date(data.joinedAt) : undefined,
                profileImageUrl: data.profileImageUrl,
                
                onboardingStep: data.onboardingStep,
                offerType: data.offerType,
                offerAmount: data.offerAmount ? parseFloat(data.offerAmount) : undefined,
                productLink: data.productLink,
                couponCode: data.couponCode,
                
                orderNumber: data.orderNumber,
                magicLinkToken: magicLinkToken,
                
                activeBatchId: data.activeBatchId ? parseInt(data.activeBatchId) : undefined
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
