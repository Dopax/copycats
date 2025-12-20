
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    
    let creator;

    if (token) {
        // Authenticate via Magic Token
        creator = await prisma.creator.findUnique({
            where: { magicLinkToken: token },
            include: { brand: true }
        });
    } else {
        // Fallback to Session
        const session = await auth();
        if (session && session.user && (session.user as any).role === "CREATOR") {
             const userId = session.user.id;
             creator = await prisma.creator.findUnique({
                where: { userId },
                include: { brand: true }
             });
        }
    }

    if (!creator) {
        // Return Public Application State
        const brands = await prisma.brand.findMany({
            select: { 
                id: true, 
                name: true, 
                logoUrl: true,
                assets: {
                    where: { name: 'Creator Terms' },
                    select: { url: true },
                    take: 1
                }
            },
            orderBy: { name: 'asc' }
        });
        
        return NextResponse.json({ 
            step: 'PUBLIC_APPLICATION',
            brands
        });
    }

    return NextResponse.json({ 
        step: creator.onboardingStep,
        offer: {
            type: creator.offerType,
            amount: creator.offerAmount,
            link: creator.productLink,
            coupon: creator.couponCode
        },
        brand: {
            name: creator.brand.name,
            logo: creator.brand.logoUrl
        },
        creatorName: creator.name,
        status: creator.status
    });
}
