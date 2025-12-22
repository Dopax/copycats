import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: { id: string } }) {
    try {
        const brand = await prisma.brand.findUnique({
            where: { id: params.id },
            include: {
                assets: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

        return NextResponse.json(brand);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch brand" }, { status: 500 });
    }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const body = await request.json();
        console.log("UPDATE BRAND BODY:", body);
        const { name, logoUrl, color, color2, fontUrl, offerBrief, brandDescription, adAccountId, breakEvenRoas, personaPrompt, scenariosPrompt } = body;

        const brand = await prisma.brand.update({
            where: { id: params.id },
            data: {
                name,
                logoUrl,
                color,
                color2,
                fontUrl,
                offerBrief,
                brandDescription,
                adAccountId,
                personaPrompt,
                scenariosPrompt,
                // @ts-ignore
                breakEvenRoas: breakEvenRoas ? parseFloat(breakEvenRoas) : undefined
            }
        });

        return NextResponse.json(brand);
    } catch (error) {
        console.error("Error updating brand:", error);
        return NextResponse.json({ error: "Failed to update brand" }, { status: 500 });
    }
}
