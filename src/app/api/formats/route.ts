
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const formats = await prisma.adFormat.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(formats);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch formats" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name } = await request.json();
        const format = await prisma.adFormat.create({
            data: { name }
        });
        return NextResponse.json(format);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create format" }, { status: 500 });
    }
}
