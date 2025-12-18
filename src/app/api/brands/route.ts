import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const brands = await prisma.brand.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(brands);
    } catch (error) {
        console.error("GET Brands Error:", error);
        return NextResponse.json({ error: "Failed to fetch brands" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name, logoUrl, color } = await request.json();
        const brand = await prisma.brand.create({
            data: { name, logoUrl, color }
        });
        return NextResponse.json(brand);
    } catch (error) {
        console.error("POST Brand Error:", error);
        return NextResponse.json({ error: "Failed to create brand" }, { status: 500 });
    }
}
