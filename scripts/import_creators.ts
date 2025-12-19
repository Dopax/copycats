
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    const rawDataPath = path.join(process.cwd(), 'creators.txt');
    if (!fs.existsSync(rawDataPath)) {
        console.error("creators.txt not found");
        return;
    }

    const content = fs.readFileSync(rawDataPath, 'utf-8');
    const lines = content.split('\n');

    console.log(`Processing ${lines.length} lines...`);

    for (const line of lines) {
        if (!line.trim()) continue;

        // Split by Tab
        const cols = line.split('\t');

        // Heuristic Column Mapping based on visual inspection of Step 379
        // Name usually col 0
        // Email usually found by @ symbol
        // CID list usually clearly comma separated "CID-XXXX..."

        const name = cols[0]?.trim();
        let email = cols.find(c => c.includes('@') && !c.includes('drive.google'))?.trim();

        // Some emails might be missing or in different cols.
        // If no email, generate a dummy or skip?
        // We'll skip empty names.

        if (!name) continue;
        if (!email) {
            console.warn(`No email for ${name}, using fake.`);
            email = `${name.replace(/\s+/g, '.').toLowerCase()}@placeholder.com`;
        }

        // Upsert Creator
        let creator;
        try {
            creator = await prisma.creator.upsert({
                where: { email },
                create: {
                    name,
                    email,
                    platform: 'Upwork', // Default
                    status: 'Active'
                },
                update: {
                    name // Update name just in case
                }
            });
            console.log(`Upserted Creator: ${name} (${creator.id})`);
        } catch (e) {
            console.error(`Failed to upsert ${name}:`, e);
            continue;
        }

        // Extract CIDs
        // Look for column containing "CID-"
        const cidCol = cols.find(c => c.includes('CID-') && c.includes(',')); // Comma sep list
        // Fallback: search all cols for CID patterns
        const allText = line;
        // regex to find CID-XXXX
        const cidRegex = /CID-(\d{4})/g;
        const matches = [...allText.matchAll(cidRegex)];

        if (matches.length > 0) {
            const cids = [...new Set(matches.map(m => `CID-${m[1]}`))];
            console.log(`  Found CIDs: ${cids.join(', ')}`);

            for (const cid of cids) {
                // Link Logic:
                // Find all Creatives that have a Tag starting with "L1:" AND containing this CID.
                // Or just loop through all creatives? No, use Prisma query.

                // We desire: Creatives where tags some (name contains "L1:" AND name contains cid)
                // Prisma doesn't support "contains" inside "some" efficiently dependent on structure, but "contains" works.

                try {
                    const updateResult = await prisma.creative.updateMany({
                        where: {
                            tags: {
                                some: {
                                    name: {
                                        contains: cid
                                    }
                                }
                            }
                        },
                        data: {
                            creatorId: creator.id
                        }
                    });

                    if (updateResult.count > 0) console.log(`    Linked ${cid} -> ${updateResult.count} clips`);
                } catch (err) {
                    console.error(`    Error linking ${cid}`, err);
                }
            }
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
