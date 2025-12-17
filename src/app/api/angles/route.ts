import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const angles = await prisma.adAngle.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(angles);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch angles" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name } = await request.json();

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 });
        }

        const angle = await prisma.adAngle.create({
            data: { name }
        });

        return NextResponse.json(angle);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create angle" }, { status: 500 });
    }
}
