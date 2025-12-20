
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { adId, batchId, name, spend, roas, status, cpm, ctr, clicks, impressions } = body;

        if (!adId || !batchId) {
            return NextResponse.json({ error: "Missing adId or batchId" }, { status: 400 });
        }

        // Upsert FacebookAd record
        const fbAd = await prisma.facebookAd.upsert({
            where: { id: adId },
            update: {
                batchId: parseInt(batchId),
                // Update cached metrics if provided (optional, usually refreshed via cron)
                name, status, spend, roas, cpm, ctr, clicks, impressions
            },
            create: {
                id: adId,
                batchId: parseInt(batchId),
                name: name || "Unknown Ad",
                status: status || "UNKNOWN",
                spend: spend || 0,
                roas: roas || 0,
                cpm: cpm || 0,
                ctr: ctr || 0,
                clicks: clicks || 0,
                impressions: impressions || 0
            }
        });

        return NextResponse.json(fbAd);

    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: "Failed to link ad" }, { status: 500 });
    }
}
