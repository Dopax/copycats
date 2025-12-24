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

        // Check if params.id is a UUID or a Post ID
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

        let ad = null;

        if (isUuid) {
            ad = await prisma.ad.findUnique({
                where: { id },
                include: {
                    snapshots: { orderBy: { capturedAt: "asc" } },
                    format: true,
                    hook: true,
                    theme: true,
                    desire: true,
                    awarenessLevel: true,
                    demographic: true,
                },
            });
        }

        // If not found by ID (or not a UUID), try finding by Post ID
        if (!ad) {
            ad = await prisma.ad.findUnique({
                where: { postId: id },
                include: {
                    snapshots: { orderBy: { capturedAt: "asc" } },
                    format: true,
                    hook: true,
                    theme: true,
                    desire: true,
                    awarenessLevel: true,
                    demographic: true,
                },
            });
        }

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
