
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { adId, batchId, batchItemId, name, spend, roas, status, cpm, ctr, clicks, impressions } = body;

        if (!adId || (!batchId && !batchItemId)) {
            return NextResponse.json({ error: "Missing adId or link target (batchId/batchItemId)" }, { status: 400 });
        }

        // Prepare update data
        const updateData: any = {
            // Update cached metrics if provided
            name, status, spend, roas, cpm, ctr, clicks, impressions
        };
        if (batchId !== undefined) updateData.batchId = batchId ? parseInt(batchId) : null;
        if (batchItemId !== undefined) updateData.batchItemId = batchItemId;

        // Upsert FacebookAd record
        const fbAd = await prisma.facebookAd.upsert({
            where: { id: adId },
            update: updateData,
            create: {
                id: adId,
                batchId: batchId ? parseInt(batchId) : null,
                batchItemId: batchItemId || null,
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
