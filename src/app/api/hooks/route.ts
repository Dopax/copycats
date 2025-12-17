
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const hooks = await prisma.adHook.findMany({
            orderBy: { name: 'asc' }
        });
        return NextResponse.json(hooks);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch hooks" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { name } = await request.json();
        const hook = await prisma.adHook.create({
            data: { name }
        });
        return NextResponse.json(hook);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create hook" }, { status: 500 });
    }
}
