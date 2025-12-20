
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const brandId = searchParams.get("state");
    const error = searchParams.get("error");
    
    console.log("FB Callback Params:", { code: !!code, brandId, error });

    if (error) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/facebook-ads?error=${encodeURIComponent(error)}`);
    }

    if (!code || !brandId) {
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/facebook-ads?error=missing_params`);
    }

    try {
        const appId = process.env.FACEBOOK_APP_ID;
        const appSecret = process.env.FACEBOOK_APP_SECRET;
        const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback`;

        // Exchange code for text
        const tokenRes = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&redirect_uri=${redirectUri}&client_secret=${appSecret}&code=${code}`);
        const tokenData = await tokenRes.json();

        if (tokenData.error) {
            throw new Error(tokenData.error.message);
        }

        const accessToken = tokenData.access_token;

        // Save to Brand
        // We usually also want to get the Ad Account ID.
        // For now, save token, and let the UI fetch Ad Accounts to select one.
        // OR fetch the first Ad Account associated with this token and save it.
        
        // Let's fetch the user's ad accounts
        const accountsRes = await fetch(`https://graph.facebook.com/v18.0/me/adaccounts?access_token=${accessToken}&fields=name,account_id`);
        const accountsData = await accountsRes.json();
        
        let adAccountId = null;
        if (accountsData.data && accountsData.data.length > 0) {
            // Default to the first one for MVP, or we could redirect to a selection page.
            // Let's just pick the first one.
            adAccountId = accountsData.data[0].account_id; // Usually starts with act_ but API returns plain ID sometimes? 
            // The API usually returns 'act_<id>' in id field, and just <id> in account_id.
            // Schema has `adAccountId` string.
            adAccountId = accountsData.data[0].id; // id is usually act_123
        }

        await prisma.brand.update({
            where: { id: brandId },
            data: { 
                facebookAccessToken: accessToken,
                adAccountId: adAccountId // Auto-select first account
            }
        });

        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/facebook-ads?connected=true`);

    } catch (error: any) {
        console.error("Facebook Auth Error", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
