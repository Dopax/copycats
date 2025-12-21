
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get("brandId");

    if (!brandId) {
        return NextResponse.json({ error: "Missing brandId" }, { status: 400 });
    }

    try {
        // Fetch all non-archived batches for this brand that have performance data
        const batches = await prisma.adBatch.findMany({
            where: {
                brandId,
                status: { not: "ARCHIVED" },
                facebookAds: { some: {} } // Only batches that have linked ads
            },
            include: {
                concept: {
                    include: {
                        angle: true,
                        // theme: true,
                    }
                },
                format: true,
                facebookAds: true
            }
        });

        // Matrix Structure: Map<FormatName, Map<AngleName, Stats>>
        // We want X-Axis = Format, Y-Axis = Angle
        const matrix = new Map<string, Map<string, { spend: number, revenue: number, roas: number, count: number }>>();

        // Helper to init/get stats
        const getStats = (format: string, angle: string) => {
            if (!matrix.has(format)) matrix.set(format, new Map());
            const col = matrix.get(format)!;
            if (!col.has(angle)) col.set(angle, { spend: 0, revenue: 0, roas: 0, count: 0 });
            return col.get(angle)!;
        };

        batches.forEach(batch => {
            // Dimensions
            const formatName = batch.format?.name || "Unknown Format";
            const angleName = batch.concept?.angle?.name || "Unknown Angle";

            // Aggregated Stats from linked Facebook Ads
            let batchSpend = 0;
            let batchRevenue = 0;

            batch.facebookAds.forEach(ad => {
                batchSpend += ad.spend || 0;
                batchRevenue += (ad.spend * ad.roas) || 0; // Back-calculate revenue approx if not stored directly, or use ROAS weighted
            });

            if (batchSpend > 0) {
                const stats = getStats(formatName, angleName);
                stats.spend += batchSpend;
                stats.revenue += batchRevenue;
                stats.count += 1;
            }
        });

        // Convert to Array format for Frontend
        // { x: Format, y: Angle, spend, roas }
        const result: any[] = [];

        matrix.forEach((angles, format) => {
            angles.forEach((stats, angle) => {
                result.push({
                    x: format,
                    y: angle,
                    spend: stats.spend,
                    roas: stats.spend > 0 ? stats.revenue / stats.spend : 0,
                    count: stats.count
                });
            });
        });

        return NextResponse.json(result);

    } catch (error) {
        console.error("Heatmap Error:", error);
        return NextResponse.json({ error: "Failed to fetch heatmap data" }, { status: 500 });
    }
}
