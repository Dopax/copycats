
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { CreateCreatorSchema } from '@/lib/validations';

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
        const rawData = await request.json();

        // Validate input with Zod
        const parsed = CreateCreatorSchema.safeParse(rawData);
        if (!parsed.success) {
            return NextResponse.json(
                { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            );
        }

        const data = parsed.data;

        const creator = await prisma.creator.create({
            data: {
                name: data.name,
                brandId: data.brandId,
                country: data.country,
                language: data.language,
                pricePerVideo: data.pricePerVideo,
                demographicId: data.demographicId,
                collabCount: data.collabCount,
                email: data.email || undefined,
                phone: data.phone,
                source: data.source,
                messagingPlatform: data.messagingPlatform,
                paymentMethod: data.paymentMethod,
                isRecurring: data.isRecurring,
                joinedAt: data.joinedAt ? new Date(data.joinedAt) : new Date(),
                profileImageUrl: data.profileImageUrl || undefined,
                gender: data.gender,
                ageGroup: data.ageGroup,
            },
            include: { demographic: true }
        });
        return NextResponse.json(creator);
    } catch (error) {
        console.error("Create creator error:", error);
        return NextResponse.json({ error: "Failed to create creator" }, { status: 500 });
    }
}
