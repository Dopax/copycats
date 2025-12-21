
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const comments = await prisma.creativeComment.findMany({
            where: { batchItemId: params.id },
            orderBy: { timestamp: 'asc' }
        });
        return NextResponse.json(comments);
    } catch (error) {
        console.error("Failed to fetch comments", error);
        return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
    }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
    try {
        const body = await req.json();
        const { text, timestamp, userName } = body;

        if (!text || typeof timestamp !== 'number') {
            return NextResponse.json({ error: "Invalid data" }, { status: 400 });
        }

        const comment = await prisma.creativeComment.create({
            data: {
                batchItemId: params.id,
                text,
                timestamp,
                userName: userName || "Anonymous"
            }
        });

        return NextResponse.json(comment);
    } catch (error) {
        console.error("Failed to create comment", error);
        return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
    }
}
