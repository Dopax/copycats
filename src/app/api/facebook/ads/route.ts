
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url); // Use standard URL interface
    
    // Simulating getting logged in user's active brand or pass via query
    // In strict RBAC, we should get session. 
    // For now, let's assume `brandId` is passed, or we look it up from User (TODO).
    // The previous mocked page didn't pass brandId but `useBrand` context has it.
    // Client should pass ?brandId
    
    // Cookie-based session access for brand is not standard here without middleware injection.
    // For simplicity, we accept `?brandId=...` and rely on middleware protection for the route if needed.
    // NOTE: Middleware protects generic /api, but we need to ensure the user has access to this brand.
    
    // TEMPORARY: Just use the brandId from query
    const brandId = searchParams.get("brandId");

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

        // Fetch Ads from Facebook Graph API
        // Fields: name, status, spend, insights data
        // We probably need to fetch 'ads' edge, then 'insights' edge for each, or robustly:
        // Fetch ads with insights fields.
        
        // 'roas' is not a direct field. 'purchase_roas' is returned as a list of action types.
        // For simplicity/stability, we fetch base metrics + purchase_roas.
        const fields = "id,name,status,creative{id,name},insights.date_preset(maximum){spend,cpm,ctr,impressions,clicks,purchase_roas}";
        const url = `https://graph.facebook.com/v18.0/${accountId}/ads?fields=${fields}&limit=50&access_token=${accessToken}`;
        
        console.log("Fetching FB Ads URL:", url.replace(accessToken, "REDACTED"));

        const fbRes = await fetch(url);
        const fbData = await fbRes.json();
        
        console.log("FB Ads Response:", JSON.stringify(fbData).substring(0, 500)); 

        if (fbData.error) {
            console.error("FB API Error", fbData.error);
            // If token expired, we might want to return specific error code
            return NextResponse.json({ error: fbData.error.message }, { status: 500 });
        }

        const ads = fbData.data.map((ad: any) => {
            const insights = ad.insights?.data?.[0] || {};
            
            // Extract ROAS safely
            let roas = 0;
            if (insights.purchase_roas) {
                const roasObj = insights.purchase_roas.find((x: any) => x.action_type === 'omni_purchase' || x.action_type === 'purchase');
                if (roasObj) roas = parseFloat(roasObj.value);
            }

            return {
                id: ad.id,
                name: ad.name,
                status: ad.status,
                spend: parseFloat(insights.spend || "0"),
                roas: roas,
                cpm: parseFloat(insights.cpm || "0"),
                ctr: parseFloat(insights.ctr || "0"),
                clicks: parseInt(insights.clicks || "0"),
                impressions: parseInt(insights.impressions || "0"),
                // Check if already linked from DB
                // We'll calculate this in a second query or join
            };
        });
        
        // Get existing links to overlay batch info
        const linkedAds = await prisma.facebookAd.findMany({
            where: { id: { in: ads.map((a:any) => a.id) } },
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
        console.error(error);
        return NextResponse.json({ error: "Failed to fetch ads" }, { status: 500 });
    }
}
