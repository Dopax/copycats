
import { google } from 'googleapis';
import { Readable } from 'stream';

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

export async function authorize() {
    // Check for credentials
    if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        throw new Error("Missing Google Drive Credentials");
    }

    const jwtClient = new google.auth.JWT(
        process.env.GOOGLE_CLIENT_EMAIL,
        undefined,
        process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        SCOPES
    );

    await jwtClient.authorize();
    return jwtClient;
}

export async function uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    folderId?: string,
    authClient?: any
) {
    const auth = authClient || await authorize();
    const drive = google.drive({ version: 'v3', auth });

    // Stream for upload
    const stream = new Readable();
    stream.push(fileBuffer);
    stream.push(null);

    // Logic: If folderId passed, use it. Else if Service Account, use ENV. If OAuth, use root (or whatever Google defaults to, but usually we pass folderId).
    const targetFolderId = folderId ? [folderId] : (authClient ? [] : (process.env.GOOGLE_DRIVE_FOLDER_ID ? [process.env.GOOGLE_DRIVE_FOLDER_ID] : []));

    const fileMetadata: any = {
        name: fileName,
        parents: targetFolderId,
    };

    const media = {
        mimeType: mimeType,
        body: stream,
    };

    try {
        const response = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, webViewLink, webContentLink',
        });

        return response.data;
    } catch (error) {
        console.error("Drive Upload Error:", error);
        throw error;
    }
}

export async function ensureFolder(drive: any, parentId: string, folderName: string) {
    try {
        const res = await drive.files.list({
            q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and '${parentId}' in parents and trashed=false`,
            fields: 'files(id, name)',
            spaces: 'drive',
        });

        if (res.data.files && res.data.files.length > 0) {
            return res.data.files[0].id;
        }

        const folderMeta = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentId]
        };
        const createRes = await drive.files.create({
            requestBody: folderMeta,
            fields: 'id'
        });

        return createRes.data.id;
    } catch (error) {
        console.error("Ensure Folder Error:", error);
        throw error;
    }
}
