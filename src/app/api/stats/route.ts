import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const brandId = searchParams.get('brandId');

        const where = brandId ? { brandId } : {};

        // 1. Total Batches
        const totalBatches = await prisma.adBatch.count({ where });

        // 2. Velocity (Average time to LAUNCHED)
        const launchedBatches = await prisma.adBatch.findMany({
            where: {
                ...where,
                status: 'LAUNCHED'
            },
            select: {
                createdAt: true,
                updatedAt: true
            }
        });

        let avgVelocityDays = 0;
        if (launchedBatches.length > 0) {
            const totalDuration = launchedBatches.reduce((acc, batch) => {
                return acc + (new Date(batch.updatedAt).getTime() - new Date(batch.createdAt).getTime());
            }, 0);
            const avgDurationMs = totalDuration / launchedBatches.length;
            avgVelocityDays = Math.round(avgDurationMs / (1000 * 60 * 60 * 24));
        }

        // 3. Distribution Stats (Desires, Themes, Demographics, Awareness)
        // We need to join with AdAngle to get these IDs
        const angles = await prisma.adAngle.findMany({
            where: brandId ? { brandId } : undefined,
            include: {
                desire: true,
                theme: true,
                demographic: true,
                awarenessLevel: true,
                batches: true // We need to count batches per concept
            }
        });

        // Helper to aggregate stats
        const aggregate = (key: 'desire' | 'theme' | 'demographic' | 'awarenessLevel') => {
            const map = new Map<string, number>();
            angles.forEach(c => {
                if (!c[key]) return;
                const name = c[key]!.name;
                const count = c.batches.length; // Count Batches using this element
                if (count > 0) {
                    map.set(name, (map.get(name) || 0) + count);
                }
            });
            return Array.from(map.entries())
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5); // Top 5
        };

        const topDesires = aggregate('desire');
        const topThemes = aggregate('theme');
        const topDemographics = aggregate('demographic');
        const topAwareness = aggregate('awarenessLevel');

        return NextResponse.json({
            kpis: {
                totalBatches,
                avgVelocityDays
            },
            distributions: {
                topDesires,
                topThemes,
                topDemographics,
                topAwareness
            }
        });

    } catch (error) {
        console.error("Failed to fetch stats:", error);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
