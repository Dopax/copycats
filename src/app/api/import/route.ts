import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as cheerio from "cheerio";

function parseNumber(text: string | undefined): number {
    if (!text) return 0;
    return parseInt(text.replace(/[^0-9]/g, ""), 10) || 0;
}

function extractPostId(facebookUrl: string | undefined): string | null {
    if (!facebookUrl) return null;
    // User instruction: "post ID is the last string of numbers in the facebook link"
    // Example: https://www.facebook.com/100076847117969/posts/332531482651753
    const matches = facebookUrl.match(/(\d+)\/?$/);
    if (matches && matches[1]) {
        return matches[1];
    }
    // Fallback: try to find the last segment that is a number
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
    // Format: "Created on: Jan 3, 2024" or "Last seen on: Feb 4, 2024"
    const dateStr = text.replace(/Created on:|Last seen on:/i, "").trim();
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
}

async function processAd(element: any, $: any) {
    const el = $(element);

    // 1. Facebook Link & Post ID
    const facebookLink = el.find('a[href*="facebook.com"]').attr('href');
    const postId = extractPostId(facebookLink);

    if (!postId) {
        // console.log("Skipping ad: No Post ID found");
        return null;
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
    // Priority: AdSpy Content URL -> Video Tag -> Image Tag

    // Check for AdSpy specific video URL
    let videoUrl = el.find('video source[src*="content.adspy.com"]').attr('src') ||
        el.find('video[src*="content.adspy.com"]').attr('src');

    // Fallback to standard video extraction
    if (!videoUrl) {
        videoUrl = el.find('video source').attr('src') || el.find('video').attr('src');
    }

    // Convert local video file paths to AdSpy CDN URLs
    if (videoUrl && (videoUrl.includes('AdSpy') || videoUrl.includes('_files'))) {
        // Extract just the filename from the relative path
        // e.g., "AdSpy%2025.11.25_files/bzwxOVppazh2dP1n.mp4" -> "bzwxOVppazh2dP1n.mp4"
        const filename = videoUrl.split('/').pop();
        if (uParam) {
            adLink = decodeURIComponent(uParam);
        }
    } catch (e) {
        // Keep original if parsing fails
    }
}

// 7. Metrics
const likesText = el.find('img[src*="like.png"]').parent().next('.line').text();
const likes = parseNumber(likesText);

const commentsText = el.find('span:contains("Comments")').text();
const comments = parseNumber(commentsText);

const sharesText = el.find('span:contains("Shares")').text();
const shares = parseNumber(sharesText);

return {
    postId,
    brand,
    headline,
    description,
    adLink,
    videoUrl,
    thumbnailUrl,
    publishDate,
    lastSeen: lastSeenDate,
    likes,
    shares,
    comments,
    facebookLink
};
}

export async function GET(req: Request) {
    console.log("Import API GET called");
    return NextResponse.json({ success: true, message: "GET working" });
}

export async function POST(req: Request) {
    console.log("Import API POST called");
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const importName = formData.get("importName") as string || `Import ${new Date().toISOString()}`;

        if (!file) {
            console.error("No file provided");
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        console.log(`File received: ${file.name}, size: ${file.size}`);

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        console.log(`Buffer created, size: ${buffer.length}`);

        const $ = cheerio.load(buffer);
        const adElements = $('.ad-outer-box');
        console.log(`Found ${adElements.length} ads to process`);

        // Create Import Batch
        const importBatch = await prisma.importBatch.create({
            data: {
                name: importName,
            }
        });
        console.log(`Created Import Batch: ${importBatch.name} (${importBatch.id})`);

        const results = [];
        let processedCount = 0;

        for (let i = 0; i < adElements.length; i++) {
            // console.log(`Processing ad ${i + 1}/${adElements.length}`);
            const adData = await processAd(adElements[i], $);

            if (adData) {
                // console.log(`Ad Data found for ${adData.postId}`);
                try {
                    // Database operations
                    let ad = await prisma.ad.findUnique({
                        where: { postId: adData.postId },
                    });

                    if (!ad) {
                        // console.log(`Creating new ad ${adData.postId}`);
                        ad = await prisma.ad.create({
                            data: {
                                success: true,
                                processed: processedCount,
                                totalFound: adElements.length,
                                message: `Successfully processed ${processedCount} ads`,
                                batchId: importBatch.id
                            });

                    } catch (error) {
                        console.error("Parsing error:", error);
                        return NextResponse.json({ error: "Parsing failed" }, { status: 500 });
                    }
                }
