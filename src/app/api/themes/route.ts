
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const themes = await prisma.adTheme.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(themes);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch themes" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name } = await request.json();
        const theme = await prisma.adTheme.create({
            data: { name }
        });
        return NextResponse.json(theme);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create theme" }, { status: 500 });
    }
}
