
import { PrismaClient } from '@prisma/client'
import * as cheerio from 'cheerio'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

function parseNumber(text: string | undefined): number {
    if (!text) return 0;
    return parseInt(text.replace(/[^0-9]/g, ""), 10) || 0;
}

function extractPostId(facebookUrl: string | undefined): string | null {
    if (!facebookUrl) return null;
    const matches = facebookUrl.match(/(\d+)\/?$/);
    if (matches && matches[1]) {
        return matches[1];
    }
    const parts = facebookUrl.split('/').filter(p => p.length > 0);
    for (let i = parts.length - 1; i >= 0; i--) {
        if (/^\d+$/.test(parts[i])) {
            return parts[i];
        }
    }
    return null;
}

function parseDate(text: string | undefined): Date | null {
    if (!text) return null;
    const dateStr = text.replace(/Created on:|Last seen on:/i, "").trim();
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
}

async function main() {
    const filePath = path.join(process.cwd(), 'AdSpy 25.11.25.htm');
    console.log(`Reading file: ${filePath}`);

    try {
        const fileContent = fs.readFileSync(filePath);
        const $ = cheerio.load(fileContent);
        const adElements = $('.ad-outer-box');

        console.log(`Found ${adElements.length} ads.`);

        let processed = 0;

        for (let i = 0; i < adElements.length; i++) {
            const el = $(adElements[i]);

            // 1. Facebook Link & Post ID
            const facebookLink = el.find('a[href*="facebook.com"]').attr('href');
            const postId = extractPostId(facebookLink);

            if (!postId) {
                // console.log("Skipping ad: No Post ID");
                continue;
            }

            // 2. Brand
            const brand = el.find('a.default-anchor').first().text().trim();

            // 3. Dates
            const createdOnText = el.find('span:contains("Created on:")').text();
            const lastSeenText = el.find('span:contains("Last seen on:")').text();
            const publishDate = parseDate(createdOnText) || new Date();
            const lastSeenDate = parseDate(lastSeenText) || new Date();

            // 4. Content
            const headline = el.find('.actionLinkLinkTitle').text().trim();
            const description = el.find('div[style*="overflow-wrap: break-word"]').text().trim();

            // 5. Media
            let videoUrl = el.find('video source[src*="content.adspy.com"]').attr('src') ||
                el.find('video[src*="content.adspy.com"]').attr('src');

            if (!videoUrl) {
                videoUrl = el.find('video source').attr('src') || el.find('video').attr('src');
            }

            // Clean filename if local
            if (videoUrl && (videoUrl.includes('AdSpy') || videoUrl.includes('_files'))) {
                videoUrl = videoUrl.split('/').pop();
            }

            const thumbnailUrl = el.find('video').attr('poster') || el.find('img').attr('src');

            // 6. Metrics
            const likesText = el.find('img[src*="like.png"]').parent().next('.line').text();
            const likes = parseNumber(likesText);

            const commentsText = el.find('span:contains("Comments")').text();
            const comments = parseNumber(commentsText);

            const sharesText = el.find('span:contains("Shares")').text();
            const shares = parseNumber(sharesText);

            // 7. Upsert Ad
            await prisma.ad.upsert({
                where: { postId },
                update: {
                    lastSeen: lastSeenDate,
                    // Optionally update metrics via snapshots
                },
                create: {
                    postId,
                    brand,
                    headline,
                    description,
                    facebookLink,
                    videoUrl,
                    thumbnailUrl,
                    publishDate,
                    lastSeen: lastSeenDate,
                    firstSeen: publishDate,
                    snapshots: {
                        create: {
                            likes,
                            shares,
                            comments
                        }
                    }
                }
            });

            processed++;
            if (processed % 50 === 0) console.log(`Processed ${processed} ads...`);
        }

        console.log(`Successfully restored ${processed} ads.`);
    } catch (e) {
        console.error("Error reading or parsing file:", e);
    }
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
