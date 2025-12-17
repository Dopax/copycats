import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: { id: string } }) {
    try {
        const { url, name, type } = await request.json();

        const asset = await prisma.brandAsset.create({
            data: {
                brandId: params.id,
                url,
                name,
                type: type || 'IMAGE'
            }
        });

        return NextResponse.json(asset);
    } catch (error) {
        console.error("Failed to create brand asset:", error);
        return NextResponse.json({ error: "Failed to create brand asset" }, { status: 500 });
    }
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const assets = await prisma.brandAsset.findMany({
            where: { brandId: params.id },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(assets);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch assets" }, { status: 500 });
    }
}
