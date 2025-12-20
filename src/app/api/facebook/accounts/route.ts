
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const brandId = searchParams.get("brandId");

    if (!brandId) {
        return NextResponse.json({ error: "Brand ID required" }, { status: 400 });
    }

    try {
        const brand = await prisma.brand.findUnique({
            where: { id: brandId }
        });

        if (!brand || !brand.facebookAccessToken) {
            return NextResponse.json({ error: "Brand not connected to Facebook" }, { status: 404 });
        }

        const accessToken = brand.facebookAccessToken;

        // Fetch Ad Accounts
        // fields=name,account_id,account_status,currency,timezone_name
        const url = `https://graph.facebook.com/v18.0/me/adaccounts?fields=name,account_id,account_status,currency&limit=100&access_token=${accessToken}`;
        
        const fbRes = await fetch(url);
        const fbData = await fbRes.json();

        if (fbData.error) {
            return NextResponse.json({ error: fbData.error.message }, { status: 500 });
        }
        
        // Format for frontend
        const accounts = fbData.data.map((acc: any) => ({
            id: acc.id, // e.g. "act_123456"
            name: acc.name,
            currency: acc.currency,
            status: acc.account_status
        }));

        return NextResponse.json(accounts);

    } catch (error: any) {
        console.error("Error fetching ad accounts:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
