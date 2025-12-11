import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { priority } = await req.json();

        // Validate priority (1, 2, 3, or null)
        if (priority !== null && ![1, 2, 3].includes(priority)) {
            return NextResponse.json(
                { error: "Invalid priority value" },
                { status: 400 }
            );
        }

        const ad = await prisma.ad.update({
            where: { id: params.id },
            data: { priority },
        });

        return NextResponse.json(ad);
    } catch (error) {
        console.error("Failed to update priority:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
