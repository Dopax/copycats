import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        // Find Creator
        // Note: Email might not be unique globally if multiple brands use same creator?
        // But Schema says `email String?`. It's not unique.
        // We should probably pick the most recent one or require brand context?
        // Default to finding the first one for now.
        const creator = await prisma.creator.findFirst({
            where: { email },
            orderBy: { createdAt: 'desc' } 
        });

        if (!creator) {
            return NextResponse.json({ error: "Creator not found" }, { status: 404 });
        }

        // Generate Token if missing
        let token = creator.magicLinkToken;
        if (!token) {
            token = randomUUID();
            await prisma.creator.update({
                where: { id: creator.id },
                data: { magicLinkToken: token }
            });
        }

        // Return token to frontend to simulate "Email Sent" + "Click"
        return NextResponse.json({ token, status: creator.status });

    } catch (error) {
        console.error("Portal Login Error:", error);
        return NextResponse.json({ error: "Login failed" }, { status: 500 });
    }
}
