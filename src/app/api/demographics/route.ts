import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const demographics = await prisma.adDemographic.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(demographics);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch demographics" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name } = await request.json();

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const demographic = await prisma.adDemographic.create({
            data: { name }
        });

        return NextResponse.json(demographic);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create demographic" }, { status: 500 });
    }
}
