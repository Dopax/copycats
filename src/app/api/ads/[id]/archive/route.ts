import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const { archived } = await req.json();

        if (!id) {
            return NextResponse.json({ error: "Ad ID is required" }, { status: 400 });
        }

        const ad = await prisma.ad.update({
            where: { id },
            data: { archived },
        });

        return NextResponse.json(ad);
    } catch (error) {
        console.error("Error updating ad:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
