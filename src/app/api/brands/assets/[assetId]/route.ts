import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: Request, { params }: { params: { assetId: string } }) {
    try {
        await prisma.brandAsset.delete({
            where: { id: params.assetId }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to delete asset:", error);
        return NextResponse.json({ error: "Failed to delete asset" }, { status: 500 });
    }
}
