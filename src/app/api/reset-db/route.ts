import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
    try {
        // Delete in order of dependencies to avoid foreign key constraints
        await prisma.adSnapshot.deleteMany({});
        await prisma.ad.deleteMany({});
        await prisma.importBatch.deleteMany({});
        await prisma.tag.deleteMany({});

        return NextResponse.json({ message: 'Database reset successfully' });
    } catch (error) {
        console.error('Error resetting database:', error);
        return NextResponse.json(
            { error: 'Failed to reset database' },
            { status: 500 }
        );
    }
}
