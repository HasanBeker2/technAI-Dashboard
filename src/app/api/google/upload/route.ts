import { NextRequest, NextResponse } from 'next/server'
import { uploadFile, refreshAccessToken } from '@/lib/google-drive'

export async function POST(request: NextRequest) {
    try {
        console.log('=== Google Drive Upload Request Started ===')

        const formData = await request.formData()
        const file = formData.get('file') as File
        const fileName = formData.get('fileName') as string
        const folderId = formData.get('folderId') as string | null

        console.log('File info:', {
            fileName: fileName || file?.name,
            fileSize: file?.size,
            fileType: file?.type
        })

        if (!file) {
            console.error('No file provided in request')
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            )
        }

        // Get access token from cookie
        let accessToken = request.cookies.get('google_access_token')?.value
        console.log('Access token from cookie:', accessToken ? 'EXISTS' : 'MISSING')

        if (!accessToken) {
            // Try to refresh token
            const refreshToken = request.cookies.get('google_refresh_token')?.value
            console.log('Refresh token from cookie:', refreshToken ? 'EXISTS' : 'MISSING')

            if (refreshToken) {
                try {
                    console.log('Attempting to refresh access token...')
                    accessToken = await refreshAccessToken(refreshToken)
                    console.log('Access token refreshed successfully')
                } catch (error) {
                    console.error('Failed to refresh access token:', error)
                    return NextResponse.json(
                        { error: 'Authentication required. Please reconnect your Google Drive.' },
                        { status: 401 }
                    )
                }
            } else {
                console.error('No refresh token available')
                return NextResponse.json(
                    { error: 'Authentication required. Please connect your Google Drive.' },
                    { status: 401 }
                )
            }
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        console.log('File converted to buffer, size:', buffer.length)

        // Determine folder ID
        const targetFolderId = folderId || process.env.GOOGLE_DRIVE_EXPENSES_FOLDER_ID
        console.log('Target folder ID:', targetFolderId || 'ROOT (no folder ID specified)')

        // Upload to Google Drive
        console.log('Starting upload to Google Drive...')
        const result = await uploadFile(
            accessToken,
            buffer,
            fileName || file.name,
            file.type,
            targetFolderId
        )

        console.log('Upload successful!', {
            fileId: result.fileId,
            webViewLink: result.webViewLink
        })

        return NextResponse.json({
            success: true,
            fileId: result.fileId,
            webViewLink: result.webViewLink,
            webContentLink: result.webContentLink,
        })
    } catch (error: any) {
        console.error('=== Google Drive Upload Error ===')
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
        console.error('Full error:', error)

        return NextResponse.json(
            {
                error: 'Failed to upload file to Google Drive',
                details: error.message
            },
            { status: 500 }
        )
    }
}
