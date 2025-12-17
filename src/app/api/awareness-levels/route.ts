import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const levels = await prisma.adAwarenessLevel.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(levels);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch awareness levels" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name } = await request.json();
        const level = await prisma.adAwarenessLevel.create({
            data: { name }
        });
        return NextResponse.json(level);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create awareness level" }, { status: 500 });
    }
}
