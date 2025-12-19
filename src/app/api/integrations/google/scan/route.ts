
import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';
import { getOAuthClient } from '@/lib/google-oauth';

// Helper to delay if we hit rate limits (exponential backoff could be better but simple for now)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// In-memory job store (Global scope in module)
// Note: In serverless, this might be wiped, but works for local 'next dev' / node server.
const activeScans = new Map<string, { status: 'scanning' | 'completed' | 'error', count: number, total?: number, error?: string }>();

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { folderId, brandId } = body;

        if (!folderId || !brandId) {
            return NextResponse.json({ error: "Missing folderId or brandId" }, { status: 400 });
        }

        // 1. Get Brand Creds
        const brand = await prisma.brand.findUnique({
            where: { id: brandId }
        });

        if (!brand || !brand.googleRefreshToken) {
            return NextResponse.json({ error: "Brand not connected to Google Drive" }, { status: 403 });
        }

        // 2. Generate Job ID
        const jobId = Math.random().toString(36).substring(7);
        activeScans.set(jobId, { status: 'scanning', count: 0 });

        // 3. Start Background Scan
        (async () => {
            try {
                const oauth2Client = getOAuthClient();
                oauth2Client.setCredentials({ refresh_token: brand.googleRefreshToken! });
                const drive = google.drive({ version: 'v3', auth: oauth2Client });

                // 3. Recursive Scan Function
                const scanFolder = async (currentFolderId: string, parentTags: string[] = [], parentPath: string[] = []) => {
                    // Update heartbeat?

                    // Get folder metadata to use as tag
                    let currentTagName = '';
                    // Don't fetch name for root folder? Or do we? usually root folder name is irrelevant if it's "Creatives"
                    // But if user selected "Campaign A", we want "Campaign A" in the path.
                    // Let's always fetch name.
                    try {
                        const f = await drive.files.get({ fileId: currentFolderId, fields: 'name' });
                        if (f.data.name) currentTagName = f.data.name;
                    } catch (e) {
                        console.log('Error fetching folder name', e);
                    }

                    // Current Path including this folder (if not root? or including root?)
                    // If currentFolderId == folderId, we are at Root.
                    // If we are at root, do we add it to path?
                    // User wants "Level 1" to be the subfolder OF the root scan?
                    // If I scan "My Brand", subfolders are "Social", "Ads".
                    // I want "Social" to be Level 1?
                    // Yes.

                    const isRoot = currentFolderId === folderId;
                    const newPath = isRoot ? [] : [...parentPath, currentTagName];
                    const newTags = isRoot ? [] : [...parentTags, currentTagName];

                    // Query: Files in this folder, not trashed
                    let pageToken: string | undefined = undefined;

                    do {
                        console.log(`Scanning folder ${currentFolderId}...`);
                        const res: any = await drive.files.list({
                            q: `'${currentFolderId}' in parents and trashed = false`,
                            fields: 'nextPageToken, files(id, name, mimeType, webViewLink, thumbnailLink, videoMediaMetadata, createdTime)',
                            pageSize: 100,
                            pageToken: pageToken,
                            supportsAllDrives: true,
                            includeItemsFromAllDrives: true
                        });

                        const files = res.data.files;
                        console.log(`Found ${files?.length || 0} items in ${currentFolderId}`);
                        if (!files) break;

                        for (const file of files) {
                            if (file.mimeType === 'application/vnd.google-apps.folder') {
                                // RECURSE
                                // Pass new tags and path
                                await scanFolder(file.id, newTags, newPath);
                            } else if (file.mimeType?.startsWith('video/') || file.mimeType?.startsWith('image/')) {
                                // PROCESS FILE

                                // 1. Create Tags (All folders in path become tags)
                                // Heuristic: Add a special L1 tag for grouping
                                const tagsToApply = [...newTags];

                                // Identify Level 1 Folder (Index 0 of path)
                                // Paths: [L1, L2, L3]
                                if (newPath.length > 0) {
                                    const level1Name = newPath[0];
                                    // Add a special marker tag for grouping
                                    tagsToApply.push(`L1:${level1Name}`);
                                }

                                // Create Tags in DB
                                const createdTags = await Promise.all(tagsToApply.map(tagName =>
                                    prisma.tag.upsert({
                                        where: { name: tagName },
                                        update: {},
                                        create: { name: tagName }
                                    })
                                ));

                                // 2. Create Creative
                                // Reverted folderPath due to Prisma Client sync issues

                                await prisma.creative.upsert({
                                    where: { driveFileId: file.id },
                                    update: {
                                        name: file.name!,
                                        thumbnailUrl: file.thumbnailLink,
                                        driveViewLink: file.webViewLink,
                                        // Ensure tags are updated (e.g. L1 tags)
                                        tags: {
                                            connect: createdTags.map(t => ({ id: t.id }))
                                        }
                                    },
                                    create: {
                                        brandId: brand.id,
                                        driveFileId: file.id!,
                                        driveViewLink: file.webViewLink,
                                        name: file.name!,
                                        type: file.mimeType?.startsWith('video/') ? 'VIDEO' : 'IMAGE',
                                        thumbnailUrl: file.thumbnailLink,
                                        width: file.videoMediaMetadata?.width || undefined,
                                        height: file.videoMediaMetadata?.height || undefined,
                                        duration: file.videoMediaMetadata?.durationMillis ? file.videoMediaMetadata.durationMillis / 1000 : undefined,

                                        // folderPath: fullFolderPath (Removed)

                                        tags: {
                                            connect: createdTags.map(t => ({ id: t.id }))
                                        }
                                    }
                                });
                                // Update Progress
                                const job = activeScans.get(jobId);
                                if (job) {
                                    job.count++;
                                    activeScans.set(jobId, job);
                                }
                            }
                        }

                        pageToken = res.data.nextPageToken || undefined;
                    } while (pageToken);
                };

                // SAFETY CHECK: This scanner ONLY reads from Drive. It never writes, updates, or deletes files on Google Drive.
                // START SCAN
                await scanFolder(folderId);

                // Complete
                const job = activeScans.get(jobId);
                if (job) activeScans.set(jobId, { ...job, status: 'completed' });

            } catch (error: any) {
                console.error("Background Scan Error", error);
                activeScans.set(jobId, { status: 'error', count: 0, error: error.message });
            }
        })();

        return NextResponse.json({ success: true, jobId, message: "Scan started in background" });

    } catch (error: any) {
        console.error("Scan Start Error", error); // Changed log message for clarity
        return NextResponse.json({ error: "Start Failed", details: error.message }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) return NextResponse.json({ error: "Missing jobId" }, { status: 400 });

    const job = activeScans.get(jobId);
    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    return NextResponse.json(job);
}
