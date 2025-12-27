
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const brandId = searchParams.get('brandId');

        if (!brandId) {
            return NextResponse.json([]);
        }

        const creators = await prisma.creator.findMany({
            where: { brandId },
            include: {
                demographic: true,
                creatives: {
                    take: 20,
                    select: { id: true, thumbnailUrl: true, driveFileId: true },
                    where: { thumbnailUrl: { not: null } },
                    orderBy: { createdAt: 'desc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(creators);
    } catch (error) {
        console.error("Fetch creators error:", error);
        return NextResponse.json({ error: "Failed to fetch creators" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();

        if (!data.brandId || !data.name) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const creator = await prisma.creator.create({
            data: {
                name: data.name,
                country: data.country,
                language: data.language,
                pricePerVideo: data.pricePerVideo ? parseFloat(data.pricePerVideo) : 0,
                demographicId: data.demographicId,
                collabCount: data.collabCount ? parseInt(data.collabCount) : 0,
                email: data.email,
                phone: data.phone,
                source: data.source,
                messagingPlatform: data.messagingPlatform,
                paymentMethod: data.paymentMethod,
                isRecurring: data.isRecurring || false,
                joinedAt: data.joinedAt ? new Date(data.joinedAt) : new Date(),
                profileImageUrl: data.profileImageUrl,
                brandId: data.brandId
            },
            include: { demographic: true }
        });
        return NextResponse.json(creator);
    } catch (error) {
        console.error("Create creator error:", error);
        return NextResponse.json({ error: "Failed to create creator" }, { status: 500 });
    }
}
