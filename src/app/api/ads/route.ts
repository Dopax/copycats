import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const ads = await prisma.ad.findMany({
            include: {
                snapshots: {
                    orderBy: { capturedAt: "desc" },
                    take: 1,
                },
                format: true,
                hook: true,
                theme: true,
                angle: true,
            },
            orderBy: { lastSeen: "desc" },
        });

        return NextResponse.json(ads);
    } catch (error) {
        console.error("Error fetching ads:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
