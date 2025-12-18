import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;

        if (!id) {
            return NextResponse.json({ error: "Ad ID is required" }, { status: 400 });
        }

        const ad = await prisma.ad.findUnique({
            where: { id },
            include: {
                snapshots: {
                    orderBy: {
                        capturedAt: "asc",
                    },
                },
                format: true,
                hook: true,
                theme: true,
                angle: true,
                awarenessLevel: true,
            },
        });

        if (!ad) {
            return NextResponse.json({ error: "Ad not found" }, { status: 404 });
        }

        return NextResponse.json(ad);
    } catch (error) {
        console.error("Error fetching ad:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
