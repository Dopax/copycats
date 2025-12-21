import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json();
        const { name, role, ratePerBatch, password } = body;

        const data: any = {
            name,
            role,
            ratePerBatch: ratePerBatch !== undefined ? parseFloat(ratePerBatch) : undefined,
        };

        if (password) {
            data.password = await bcrypt.hash(password, 10);
        }

        // Filter out undefined
        Object.keys(data).forEach(key => data[key] === undefined && delete data[key]);

        const user = await prisma.user.update({
            where: { id: params.id },
            data,
        });

        const { password: _, ...userWithoutPassword } = user;
        return NextResponse.json(userWithoutPassword);
    } catch (error) {
        console.error("Error updating user:", error);
        return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.user.delete({
            where: { id: params.id },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting user:", error);
        return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
    }
}
