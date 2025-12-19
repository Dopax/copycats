
import { NextResponse } from 'next/server';
import { getOAuthClient } from '@/lib/google-oauth';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get('brandId');

    if (!brandId) {
        return NextResponse.json({ error: "Missing brandId" }, { status: 400 });
    }

    const oauth2Client = getOAuthClient();

    // Generate auth URL
    const scopes = [
        'https://www.googleapis.com/auth/drive.readonly', // Read existing files
        'https://www.googleapis.com/auth/drive.file', // Create/Edit files created by this app
        'https://www.googleapis.com/auth/userinfo.email' // Get user email
    ];

    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Crucial: gets us a Refresh Token
        scope: scopes,
        state: brandId, // Pass brandId as state so callback knows which brand to update
        prompt: 'consent' // Force consent to ensure we get refresh token
    });

    return NextResponse.redirect(url);
}
