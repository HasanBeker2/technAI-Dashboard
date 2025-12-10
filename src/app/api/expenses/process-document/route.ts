import { NextRequest, NextResponse } from 'next/server'
import { extractInvoiceData, withRetry } from '@/lib/openai'
import { suggestCategory } from '@/lib/expense-utils'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            )
        }

        // Validate file type - images only
        const allowedTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/webp',
        ]

        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Please upload an image file (JPG, PNG, WEBP).' },
                { status: 400 }
            )
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024 // 10MB
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 10MB.' },
                { status: 400 }
            )
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        // Extract invoice data with retry logic
        const extractedData = await withRetry(
            () => extractInvoiceData(buffer, file.type),
            3,
            2000
        )

        // Suggest category if not provided by AI
        if (!extractedData.category && extractedData.description) {
            extractedData.category = suggestCategory(extractedData.description)
        }

        return NextResponse.json({
            success: true,
            data: extractedData,
        })
    } catch (error) {
        console.error('Error processing document:', error)

        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        // Capture detailed error info
        let errorDetails: any = {
            message: errorMessage,
            type: 'unknown'
        }

        if (typeof error === 'object' && error !== null) {
            const apiError = error as any
            errorDetails = {
                message: apiError.message || errorMessage,
                status: apiError.status,
                code: apiError.code,
                type: apiError.type,
                name: apiError.name
            }
        }

        return NextResponse.json(
            {
                error: 'Failed to process document',
                details: errorMessage,
                debugInfo: errorDetails, // Add this for debugging
                suggestion: 'Please try manual entry or check if the document is clear and readable.'
            },
            { status: 500 }
        )
    }
}
