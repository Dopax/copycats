
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { groupName, tags, action = 'add' } = body; // groupName corresponds to the L1 name

        if (!groupName || !tags || !Array.isArray(tags)) {
            return NextResponse.json({ error: "Missing groupName or tags" }, { status: 400 });
        }

        // 1. Identify Target Creatives (All having L1:groupName)
        const l1Tag = `L1:${groupName}`;

        // Find creatives IDs
        const creatives = await prisma.creative.findMany({
            where: {
                tags: {
                    some: {
                        name: l1Tag
                    }
                }
            },
            select: { id: true }
        });

        const creativeIds = creatives.map(c => c.id);

        if (creativeIds.length === 0) {
            return NextResponse.json({ message: "No creatives found in this bunch", count: 0 });
        }

        // 2. Process Tags (Ensure BUNCH: prefix if intended for bunch, though frontend should send full string)
        // We assume frontend sends "BUNCH:MyTag"

        if (action === 'add') {
            // Upsert Tags
            const tagConnects = tags.map((t: string) => ({
                where: { name: t },
                create: { name: t }
            }));

            // We can't do a single batch update for "connectOrCreate" easily on many-to-many in Prisma without loop or raw query
            // But we can do: use 'updateMany' NO, updateMany doesn't support relation updates.
            // We must loop or use nested write with loop.

            // Optimization: Create tags first
            await Promise.all(tags.map((t: string) =>
                prisma.tag.upsert({
                    where: { name: t },
                    create: { name: t },
                    update: {}
                })
            ));

            // Bulk connect? 
            // Prisma doesn't support "Update Many Relations".
            // Implementation: Loop (fine for batch tagging < 1000 items usually). 
            // Or raw query for speed. 
            // Let's use loop for safety/simplicity first.

            // Actually, we can just do parallel updates
            // Chunking to avoid connection pool exhaustion?
            // 500 items is fine.

            await Promise.all(creativeIds.map(id =>
                prisma.creative.update({
                    where: { id },
                    data: {
                        tags: {
                            connect: tags.map((t: string) => ({ name: t }))
                        }
                    }
                })
            ));

        } else if (action === 'remove') {
            await Promise.all(creativeIds.map(id =>
                prisma.creative.update({
                    where: { id },
                    data: {
                        tags: {
                            disconnect: tags.map((t: string) => ({ name: t }))
                        }
                    }
                })
            ));
        }

        return NextResponse.json({ success: true, count: creativeIds.length });

    } catch (error: any) {
        console.error("Batch Tag Error", error);
        return NextResponse.json({ error: "Batch Tag Failed", details: error.message }, { status: 500 });
    }
}
