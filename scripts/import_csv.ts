
import XLSX from 'xlsx';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

const CREATORS_FILE = 'Creators_1766130456 - creators.csv';
const CREATIVES_FILE = 'Creatives_1766130388 - creatives.csv';

// Handle interop handling for XLSX
const read = XLSX.readFile || (XLSX as any).default?.readFile;
const utils = XLSX.utils || (XLSX as any).default?.utils;

async function main() {
    if (!read || !utils) {
        console.error('XLSX library not loaded correctly.');
        return;
    }

    // Get Default Brand
    const brand = await prisma.brand.findFirst();
    if (!brand) {
        console.error("No Brand found in DB. Please create a brand first.");
        return;
    }
    const brandId = brand.id;
    console.log(`Using Brand: ${brand.name} (${brandId})`);

    console.log("Starting CSV Import...");

    // 1. Process Master Creators List
    await processCreatorsFile(brandId);

    // 2. Process Creatives File for Links and missing creators
    await processCreativesFile(brandId);

    console.log("\nImport Complete.");
}

async function processCreatorsFile(brandId: string) {
    const filePath = path.join(process.cwd(), CREATORS_FILE);
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return;
    }
    console.log(`\n--- Processing ${CREATORS_FILE} ---`);

    try {
        const workbook = read(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = utils.sheet_to_json(sheet); // Auto-headers

        let count = 0;
        for (const row of data as any[]) {
            const name = row['Name'];
            let email = row['Email'];

            if (!name) continue;
            if (email) email = email.trim();

            if (!email) {
                email = `${name.replace(/\s+/g, '.').toLowerCase()}@placeholder.copycatz.com`;
            }

            // Find existing creator by email
            let creator = await prisma.creator.findFirst({
                where: { email }
            });

            const creatorData = {
                name,
                email,
                messagingPlatform: row['Platform'] || 'Upwork',
                country: row['Country'],
                language: row['Native Language'],
                // Map 'Creator Stage' to type or ignore
                // type: row['Creator Stage'] ...
                brandId: brandId
            };

            if (creator) {
                // Update
                creator = await prisma.creator.update({
                    where: { id: creator.id },
                    data: {
                        name: creatorData.name, // Update name
                        messagingPlatform: creatorData.messagingPlatform,
                        country: creatorData.country,
                        language: creatorData.language
                    }
                });
            } else {
                // Create
                creator = await prisma.creator.create({
                    data: creatorData
                });
            }
            count++;

            // Link CIDs
            const creativesList = row['Creatives'];
            if (creativesList && typeof creativesList === 'string') {
                const cidRegex = /CID-(\d{4})/g;
                const matches = Array.from(creativesList.matchAll(cidRegex));
                const cids = Array.from(new Set(matches.map(m => `CID-${m[1]}`)));

                if (cids.length > 0) {
                    process.stdout.write(` [${name}: ${cids.length}]`);
                    for (const cid of cids) {
                        await linkCreative(cid, creator.id);
                    }
                }
            }
        }
        console.log(`\nProcessed ${count} creators from master list.`);

    } catch (e) {
        console.error("Error reading Creators file:", e);
    }
}

async function processCreativesFile(brandId: string) {
    const filePath = path.join(process.cwd(), CREATIVES_FILE);
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return;
    }
    console.log(`\n--- Processing ${CREATIVES_FILE} ---`);

    try {
        const workbook = read(filePath);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = utils.sheet_to_json(sheet);

        let count = 0;

        for (const row of data as any[]) {
            const cidFull = row['Creative ID'];
            const name = row['UGC creator'];
            let email = row['Creator Email'];
            if (!email) email = row['Email'];

            if (!cidFull) continue;

            const cidMatch = cidFull.match(/CID-(\d{4})/);
            if (!cidMatch) continue;
            const cid = `CID-${cidMatch[1]}`;

            let creatorId = null;

            if (email) {
                email = email.trim();
                let creator = await prisma.creator.findFirst({ where: { email } });

                if (!creator) {
                    // Create
                    try {
                        creator = await prisma.creator.create({
                            data: {
                                name: name || `Creator ${email}`,
                                email,
                                messagingPlatform: 'Upwork',
                                brandId: brandId
                            }
                        });
                    } catch (e) {
                        console.error(`  Error creating creator ${email}:`, e);
                    }
                }
                if (creator) creatorId = creator.id;

            } else if (name) {
                // Placeholder email logic
                const placeholderEmail = `${name.replace(/\s+/g, '.').toLowerCase()}@placeholder.copycatz.com`;
                let creator = await prisma.creator.findFirst({ where: { email: placeholderEmail } });
                if (!creator) {
                    try {
                        creator = await prisma.creator.create({
                            data: {
                                name,
                                email: placeholderEmail,
                                messagingPlatform: 'Upwork',
                                brandId: brandId
                            }
                        });
                    } catch (e) { }
                }
                if (creator) creatorId = creator.id;
            }

            if (creatorId) {
                await linkCreative(cid, creatorId);
                count++;
            }

            // Import Bunch Tags (Creative Tags)
            const tagsRaw = row['Creative Tags'];
            if (tagsRaw && typeof tagsRaw === 'string') {
                const tags = tagsRaw.split(',').map(t => t.trim()).filter(t => t);
                if (tags.length > 0) {
                    await addTagsToCreative(cid, tags);
                }
            }
        }
        console.log(`\nProcessed ${count} rows from Creatives file.`);

    } catch (e) {
        console.error("Error reading Creatives file:", e);
    }
}

async function linkCreative(cidFragment: string, creatorId: string) {
    try {
        // Tag search: 'BUNCH:CID-0192' or 'L1:CID-0192' or just containing CID-0192
        await prisma.creative.updateMany({
            where: {
                tags: {
                    some: {
                        name: {
                            contains: cidFragment
                        }
                    }
                }
            },
            data: {
                creatorId: creatorId
            }
        });
        // Feedback only if successful link
        // if (updateResult.count > 0) process.stdout.write('+');
    } catch (e) {
        console.error(`Failed to link ${cidFragment}`, e);
    }
}

async function addTagsToCreative(cidFragment: string, tags: string[]) {
    try {
        // Find creatives first to connect tags
        const creatives = await prisma.creative.findMany({
            where: {
                tags: {
                    some: {
                        name: {
                            contains: cidFragment
                        }
                    }
                }
            },
            select: { id: true }
        });

        if (creatives.length === 0) return;

        for (const tag of tags) {
            // Upsert tag
            // We can't easily upsert and connect in one go for multiple creatives efficiently without improved prisma logic or loop
            // But let's simple loop
            const tagRecord = await prisma.tag.upsert({
                where: { name: tag },
                create: { name: tag },
                update: {}
            });

            // Connect to all matched creatives
            for (const creative of creatives) {
                await prisma.creative.update({
                    where: { id: creative.id },
                    data: {
                        tags: {
                            connect: { id: tagRecord.id }
                        }
                    }
                });
            }
        }
    } catch (e) {
        console.error(`Failed to add tags for ${cidFragment}`, e);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
