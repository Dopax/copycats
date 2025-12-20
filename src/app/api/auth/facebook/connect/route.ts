
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get("brandId");

    if (!brandId || brandId === "undefined") {
        return NextResponse.json({ error: "Brand ID required. Please select a brand." }, { status: 400 });
    }

    const appId = process.env.FACEBOOK_APP_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback`;
    // 'read_insights' is for Pages. 'ads_read' is for Marketing API.
    // 'email' also seeming to cause issues for this specific app setup.
    const scope = "ads_read"; 
    const state = brandId; // Pass brandId as state to recover it in callback

    const url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}`;

    return NextResponse.redirect(url);
}
