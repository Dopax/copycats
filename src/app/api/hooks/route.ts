import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
        const { name, type, content, videoUrl, thumbnailUrl } = await request.json();
        const hook = await prisma.adHook.create({
            data: {
                name,
                type,
                content,
                videoUrl,
                thumbnailUrl
            }
        });
        return NextResponse.json(hook);
    } catch (error) {
        return NextResponse.json({ error: "Failed to create hook" }, { status: 500 });
    }
}
