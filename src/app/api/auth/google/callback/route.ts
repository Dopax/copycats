
import { NextResponse } from 'next/server';
import { getOAuthClient } from '@/lib/google-oauth';
import { prisma } from '@/lib/prisma';
import { google } from 'googleapis';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // This is brandId
    const error = searchParams.get('error');

    if (error) {
        return NextResponse.json({ error: "Google Auth Error", details: error }, { status: 400 });
    }

    if (!code || !state) {
        return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
    }

    try {
        const oauth2Client = getOAuthClient();
        const { tokens } = await oauth2Client.getToken(code);

        if (!tokens.refresh_token) {
            // If user previously permitted app, Google might not send refresh token again unless prompt='consent' was used.
            // Our signin route uses prompt='consent', so we should get it.
            console.warn("No refresh token received!");
        }

        oauth2Client.setCredentials(tokens);

        // Get User Email
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();
        const email = userInfo.data.email;

        // Create a root folder for this Brand if it doesn't exist?
        // Or we just save the creds and creating folder happens on first upload.
        // Let's create the folder now to confirm it works and save ID.
        const drive = google.drive({ version: 'v3', auth: oauth2Client });

        // Check if we already have a folder for this app? 
        // We'll just create one "AdSpy Assets" folder.
        const folderName = `Brand OS Assets - ${email}`; // Or Brand Name if we fetched it

        const folderMeta = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
        };

        const folderRes = await drive.files.create({
            requestBody: folderMeta,
            fields: 'id'
        });

        const folderId = folderRes.data.id;

        // Update Brand
        await prisma.brand.update({
            where: { id: state },
            data: {
                googleRefreshToken: tokens.refresh_token,
                googleEmail: email,
                googleDriveFolderId: folderId
            }
        });

        // Redirect back to Brand Page
        return NextResponse.redirect(new URL('/brand-assets', request.url));

    } catch (error: any) {
        console.error("Auth Callback Error", error);
        return NextResponse.json({ error: "Authentication Failed", details: error.message }, { status: 500 });
    }
}
