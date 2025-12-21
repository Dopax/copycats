
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);

    // Simulating getting logged in user's active brand or pass via query
    const brandId = searchParams.get("brandId");
    // Date Preset from query, default to 'maximum'
    // NOTE: 'maximum' is internal app code for 'lifetime' data
    const datePreset = searchParams.get("datePreset") || "maximum";

    if (!brandId) {
        return NextResponse.json({ error: "Brand ID required" }, { status: 400 });
    }

    try {
        const brand = await prisma.brand.findUnique({
            where: { id: brandId }
        });

        if (!brand || !brand.facebookAccessToken || !brand.adAccountId) {
            return NextResponse.json({ error: "Brand not connected to Facebook" }, { status: 404 });
        }

        const accessToken = brand.facebookAccessToken;
        const accountId = brand.adAccountId;

        // Recursive fetch for all ads
        let allAds: any[] = [];
        let afterCursor: string | null = null;
        let hasNext = true;

        // Prevent infinite loops / too many requests if account is massive
        const MAX_PAGES = 20; // Reduced from 50 to prevent immediate lockout
        let pageCount = 0;

        // Rate Limit Helper
        const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        while (hasNext && pageCount < MAX_PAGES) {
            // Add slight delay to respect rate limits
            if (pageCount > 0) await sleep(500);

            // Construct Insights Field Params
            let insightsParams = "";

            if (datePreset === "maximum") {
                // Use robust time_range for Maximum
                // FB Limit: cannot be beyond 37 months from current date.
                // We use 36 months (~3 years) to be safe.
                const today = new Date();
                const pastDate = new Date();
                pastDate.setMonth(today.getMonth() - 36);

                const todayStr = today.toISOString().split('T')[0];
                const pastStr = pastDate.toISOString().split('T')[0];

                const timeRange = JSON.stringify({ since: pastStr, until: todayStr });
                insightsParams = `insights.time_range(${timeRange}){spend,cpm,ctr,impressions,clicks,purchase_roas,actions,action_values}`;
            } else {
                // Use standard presets
                insightsParams = `insights.date_preset(${datePreset}){spend,cpm,ctr,impressions,clicks,purchase_roas,actions,action_values}`;
            }

            const fields = `id,name,status,creative{id,name},campaign{id,name},adset{id,name},${insightsParams}`;
            let url = `https://graph.facebook.com/v18.0/${accountId}/ads?fields=${fields}&limit=50&access_token=${accessToken}`;

            if (afterCursor) {
                url += `&after=${afterCursor}`;
            }

            console.log(`Fetching FB Ads Page ${pageCount + 1}...`);
            const fbRes = await fetch(url);
            const fbData = await fbRes.json();

            // Handle Per-Call Rate Limit Error specifically
            if (fbData.error && fbData.error.code === 17) {
                // Rate limit reached? Wait longer and retry once? 
                // For now, break and return what we have to avoid crashing
                console.warn("Rate limit hit, returning partial data.");
                break;
            }

            if (fbData.error) {
                console.error("FB API Error", fbData.error);
                throw new Error(fbData.error.message);
            }

            if (fbData.data) {
                allAds = [...allAds, ...fbData.data];
            }

            if (fbData.paging && fbData.paging.next && fbData.paging.cursors?.after) {
                afterCursor = fbData.paging.cursors.after;
                pageCount++;
            } else {
                hasNext = false;
            }
        }

        const ads = allAds.map((ad: any) => {
            const insights = ad.insights?.data?.[0] || {};
            const spend = parseFloat(insights.spend || "0");

            // Extract Revenue (Action Values) for ROAS robustness
            let revenue = 0;
            if (insights.action_values) {
                const valObj = insights.action_values.find((x: any) => x.action_type === 'omni_purchase' || x.action_type === 'purchase');
                if (valObj) revenue = parseFloat(valObj.value);
            }

            // Extract ROAS safely or Calculate
            let roas = 0;
            if (insights.purchase_roas) {
                const roasObj = insights.purchase_roas.find((x: any) => x.action_type === 'omni_purchase' || x.action_type === 'purchase');
                if (roasObj) roas = parseFloat(roasObj.value);
            }
            if (roas === 0 && spend > 0 && revenue > 0) {
                roas = revenue / spend;
            }

            // Calculate CPA (Cost per Purchase)
            let purchases = 0;
            if (insights.actions) {
                const purchaseAction = insights.actions.find((x: any) => x.action_type === 'omni_purchase' || x.action_type === 'purchase');
                if (purchaseAction) purchases = parseFloat(purchaseAction.value);
            }
            const cpa = purchases > 0 ? spend / purchases : 0;

            return {
                id: ad.id,
                name: ad.name,
                campaignName: ad.campaign?.name || "Unknown Campaign",
                adsetName: ad.adset?.name || "Unknown AdSet",
                status: ad.status,
                spend: spend,
                roas: roas,
                revenue: revenue,
                cpa: cpa,
                purchases: purchases,
                cpm: parseFloat(insights.cpm || "0"),
                ctr: parseFloat(insights.ctr || "0"),
                clicks: parseInt(insights.clicks || "0"),
                impressions: parseInt(insights.impressions || "0"),
            };
        });

        const linkedAds = await prisma.facebookAd.findMany({
            where: { id: { in: ads.map((a: any) => a.id) } },
            include: { batch: { select: { id: true, name: true } } }
        });

        const linkedMap = new Map(linkedAds.map(l => [l.id, l]));

        const finalAds = ads.map((ad: any) => {
            const linked = linkedMap.get(ad.id);
            return {
                ...ad,
                batchId: linked?.batch?.id,
                batchName: linked?.batch?.name
            };
        });

        return NextResponse.json(finalAds);

    } catch (error: any) {
        console.error("Critical FB API Error:", error);
        return NextResponse.json({ error: error.message || "Failed to fetch ads", details: JSON.stringify(error) }, { status: 500 });
    }
}
