
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const body = await req.json();
    const { action, data, token } = body; 

    let creator;

    if (token) {
         creator = await prisma.creator.findUnique({ where: { magicLinkToken: token } });
    } else {
        const session = await auth();
        if (session && session.user && (session.user as any).role === "CREATOR") {
             const userId = session.user.id;
             creator = await prisma.creator.findUnique({ where: { userId } });
        }
    }

    if (!creator) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        if (action === 'SAVE_DETAILS') {
            await prisma.creator.update({
                where: { id: creator.id },
                data: {
                    name: data.name,
                    phone: data.phone,
                    paypalEmail: data.paymentMethod === 'Paypal' ? data.paypalEmail : undefined, // Assuming extra field or just update existing
                    paymentMethod: data.paymentMethod,
                    onboardingStep: 'DETAILS' // Stays in Details until Admin approves.
                    // Actually, plan says: "Status: Pending Approval after submission."
                    // We don't have a "Pending" status in step, but we can infer or Add one.
                    // Simpler: Keep step as DETAILS. Admin moves it to INSTRUCTIONS by setting offer.
                    // But UI needs to show "Waiting for Approval".
                    // Let's rely on checking if offer is set?
                }
            });
            return NextResponse.json({ success: true, message: "Details saved. Waiting for admin approval." });
        }

        if (action === 'ACCEPT_INSTRUCTIONS' || action === 'ACCEPT_OFFER') {
             await prisma.creator.update({
                where: { id: creator.id },
                data: { onboardingStep: 'ORDER' }
            });
            return NextResponse.json({ success: true, nextStep: 'ORDER' });
        }

        if (action === 'SUBMIT_ORDER') {
            await prisma.creator.update({
                where: { id: creator.id },
                data: { 
                    orderNumber: data.orderNumber,
                    onboardingStep: 'UPLOAD' // Move to upload immediately? "then will move to screen 4... probably 2 months afterwards"
                    // Yes, move to upload. They can come back later.
                }
            });
            return NextResponse.json({ success: true, nextStep: 'UPLOAD' });
        }

        if (action === 'FINISH_UPLOAD') {
            await prisma.creator.update({
                where: { id: creator.id },
                data: { 
                    onboardingStep: 'COMPLETED',
                    activeDeliveryCid: null // Clear session
                }
            });
            return NextResponse.json({ success: true, nextStep: 'COMPLETED' });
        }
        
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
