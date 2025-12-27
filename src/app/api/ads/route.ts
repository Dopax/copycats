import { prisma } from "@/lib/prisma";
import { apiError, apiSuccess } from "@/lib/api-utils";

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
                desire: true,
                awarenessLevel: true,
                demographic: true,
                referencedInBatches: {
                    select: { id: true, name: true, status: true }
                }
            },
            orderBy: { lastSeen: "desc" },
        });

        return apiSuccess(ads);
    } catch (error) {
        console.error("Error fetching ads:", error);
        return apiError("Internal Server Error");
    }
}

