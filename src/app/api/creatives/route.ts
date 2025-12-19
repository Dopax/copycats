
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        // Pagination
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = (page - 1) * limit;

        // Filters
        const brandId = searchParams.get('brandId');
        const creatorId = searchParams.get('creatorId');
        const type = searchParams.get('type');
        const q = searchParams.get('q'); // Search query
        const tags = searchParams.getAll('tags');

        // Build the query
        const where: Prisma.CreativeWhereInput = {
            // Basic filters
            ...(brandId && { brandId }),
            ...(creatorId && { creatorId }),
            ...(type && { type }),

            // Search (Name or Tags)
            ...(q && {
                OR: [
                    { name: { contains: q } },
                    { overallSummary: { contains: q } },
                    { tags: { some: { name: { contains: q } } } }
                ]
            }),

            // Tag filtering (ALL tags must be present if multiple selected - strict filtering)
            // Alternatively, use 'some' for ANY tag. Let's use 'some' for at least one match for now if simple array
            ...(tags.length > 0 && {
                tags: {
                    some: {
                        name: { in: tags }
                    }
                }
            })
        };

        const [creatives, total] = await Promise.all([
            prisma.creative.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    creator: true,
                    tags: true,
                    _count: {
                        select: { segments: true }
                    }
                }
            }),
            prisma.creative.count({ where })
        ]);

        return NextResponse.json({
            data: creatives,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Error fetching creatives:', error);
        return NextResponse.json(
            { error: 'Failed to fetch creatives' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            name,
            brandId,
            url,
            type = 'VIDEO',
            creatorId,
            thumbnailUrl,
            duration,
            width,
            height,
            tags = [] // Expect array of strings
        } = body;

        // Create or connect tags
        const tagConnectOrCreate = tags.map((tagName: string) => ({
            where: { name: tagName },
            create: { name: tagName },
        }));

        const creative = await prisma.creative.create({
            data: {
                name,
                brandId,
                // For now, map simple URL to driveViewLink if it's a drive link, or just ignore. 
                // We'll assume 'url' is provided for generic usages or mapped to specific fields.
                // If the implementation expects specific Google Drive fields, we should parse them.
                // For MVP, assuming direct URL is driveViewLink or proxyUrl.
                driveViewLink: url.includes('drive.google.com') ? url : undefined,
                proxyUrl: !url.includes('drive.google.com') ? url : undefined,

                type,
                creatorId,
                thumbnailUrl,
                duration,
                width,
                height,

                tags: {
                    connectOrCreate: tagConnectOrCreate
                }
            },
            include: {
                tags: true
            }
        });

        return NextResponse.json(creative);

    } catch (error) {
        console.error('Error creating creative:', error);
        return NextResponse.json(
            { error: 'Failed to create creative' },
            { status: 500 }
        );
    }
}
