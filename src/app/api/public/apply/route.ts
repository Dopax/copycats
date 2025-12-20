import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, email, brandId, phone, socialHandle, gender, ageGroup, country, language, source } = body;

        if (!name || !email || !brandId || !socialHandle) {
            return NextResponse.json({ error: "Name, Email, Social Account, and Brand are required." }, { status: 400 });
        }

        const token = randomUUID();

        // Create Creator
        const creator = await prisma.creator.create({
            data: {
                name,
                email,
                brandId,
                phone,
                socialHandle,
                gender,
                ageGroup,
                country,
                language,
                source: source || 'PUBLIC_FORM',
                type: 'TEMPORARY',
                status: 'APPLIED',
                onboardingStep: 'OFFER',
                magicLinkToken: token,
                offerType: 'FREE_KIT', // Default
                offerAmount: 0,
            }
        });

        // Return success but NO token (pending approval)
        return NextResponse.json({ success: true, message: "Application Received" });

    } catch (error) {
        console.error("Public Apply Error:", error);
        return NextResponse.json({ error: "Application failed" }, { status: 500 });
    }
}
