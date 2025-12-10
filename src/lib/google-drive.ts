import { google } from 'googleapis'

const SCOPES = ['https://www.googleapis.com/auth/drive.file']

interface GoogleDriveConfig {
    clientId: string
    clientSecret: string
    redirectUri: string
}

/**
 * Get OAuth2 client instance
 */
function getOAuth2Client(config: GoogleDriveConfig) {
    return new google.auth.OAuth2(
        config.clientId,
        config.clientSecret,
        config.redirectUri
    )
}

/**
 * Generate OAuth authorization URL
 */
export function getAuthUrl(): string {
    const config: GoogleDriveConfig = {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
    }

    const oauth2Client = getOAuth2Client(config)

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
    })
}

/**
 * Exchange authorization code for access token
 */
export async function getAccessToken(code: string): Promise<{
    access_token: string
    refresh_token?: string
    expiry_date?: number
}> {
    const config: GoogleDriveConfig = {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
    }

    const oauth2Client = getOAuth2Client(config)
    const { tokens } = await oauth2Client.getToken(code)

    return {
        access_token: tokens.access_token!,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
    }
}

/**
 * Refresh expired access token
 */
export async function refreshAccessToken(refreshToken: string): Promise<string> {
    const config: GoogleDriveConfig = {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
    }

    const oauth2Client = getOAuth2Client(config)
    oauth2Client.setCredentials({ refresh_token: refreshToken })

    const { credentials } = await oauth2Client.refreshAccessToken()
    return credentials.access_token!
}

/**
 * Upload file to Google Drive
 */
export async function uploadFile(
    accessToken: string,
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    folderId?: string
): Promise<{
    fileId: string
    webViewLink: string
    webContentLink: string
}> {
    const config: GoogleDriveConfig = {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
    }

    const oauth2Client = getOAuth2Client(config)
    oauth2Client.setCredentials({ access_token: accessToken })

    const drive = google.drive({ version: 'v3', auth: oauth2Client })

    const fileMetadata: any = {
        name: fileName,
    }

    if (folderId) {
        fileMetadata.parents = [folderId]
    }

    const media = {
        mimeType: mimeType,
        body: require('stream').Readable.from(fileBuffer),
    }

    const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, webViewLink, webContentLink',
    })

    // Make file accessible via link
    await drive.permissions.create({
        fileId: response.data.id!,
        requestBody: {
            role: 'reader',
            type: 'anyone',
        },
    })

    return {
        fileId: response.data.id!,
        webViewLink: response.data.webViewLink!,
        webContentLink: response.data.webContentLink!,
    }
}

/**
 * Create folder in Google Drive if it doesn't exist
 */
export async function createFolder(
    accessToken: string,
    folderName: string,
    parentFolderId?: string
): Promise<string> {
    const config: GoogleDriveConfig = {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
    }

    const oauth2Client = getOAuth2Client(config)
    oauth2Client.setCredentials({ access_token: accessToken })

    const drive = google.drive({ version: 'v3', auth: oauth2Client })

    const fileMetadata: any = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
    }

    if (parentFolderId) {
        fileMetadata.parents = [parentFolderId]
    }

    const response = await drive.files.create({
        requestBody: fileMetadata,
        fields: 'id',
    })

    return response.data.id!
}

/**
 * Get shareable link for a file
 */
export async function getFileUrl(
    accessToken: string,
    fileId: string
): Promise<string> {
    const config: GoogleDriveConfig = {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
    }

    const oauth2Client = getOAuth2Client(config)
    oauth2Client.setCredentials({ access_token: accessToken })

    const drive = google.drive({ version: 'v3', auth: oauth2Client })

    const response = await drive.files.get({
        fileId: fileId,
        fields: 'webViewLink',
    })

    return response.data.webViewLink!
}

/**
 * Delete file from Google Drive
 */
export async function deleteFile(
    accessToken: string,
    fileId: string
): Promise<void> {
    const config: GoogleDriveConfig = {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
    }

    const oauth2Client = getOAuth2Client(config)
    oauth2Client.setCredentials({ access_token: accessToken })

    const drive = google.drive({ version: 'v3', auth: oauth2Client })

    await drive.files.delete({
        fileId: fileId,
    })
}
