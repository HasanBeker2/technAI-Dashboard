import OpenAI from 'openai'
import { PDFDocument } from 'pdf-lib'

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
})

export interface ExtractedInvoiceData {
    vendorName: string
    vendorAddress?: string
    invoiceNumber?: string
    invoiceDate?: string
    description: string
    amount?: number
    currency?: string
    vatRate?: number
    vatAmount?: number
    category?: string
    paymentMethod?: string
}

/**
 * Convert PDF to base64 encoded images
 */
export async function convertPdfToImages(pdfBuffer: Buffer): Promise<string[]> {
    try {
        const pdfDoc = await PDFDocument.load(pdfBuffer)
        const pageCount = pdfDoc.getPageCount()

        // For now, we'll just return the first page
        // Full implementation would convert each page to an image
        // This requires additional libraries like pdf-to-img or similar

        // Placeholder: return base64 of the PDF itself for Vision API
        const base64 = pdfBuffer.toString('base64')
        return [base64]
    } catch (error) {
        console.error('Error converting PDF to images:', error)
        throw new Error('Failed to process PDF file')
    }
}

/**
 * Analyze invoice image using OpenAI Vision API
 */
export async function analyzeInvoice(
    imageBase64: string,
    mimeType: string
): Promise<ExtractedInvoiceData> {
    try {
        // Check if API key is configured
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === '') {
            throw new Error('OpenAI API key is not configured. Please add OPENAI_API_KEY to your .env file.')
        }

        console.log('🔍 DEBUG: Starting OpenAI Vision API call')
        console.log('🔍 Model:', 'gpt-4o-mini')
        console.log('🔍 Image size (bytes):', imageBase64.length)
        console.log('🔍 MIME type:', mimeType)

        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini', // Cheaper vision-capable model
                messages: [
                    {
                        role: 'user',
                        content: [
                            {
                                type: 'text',
                                text: `Analyze this invoice/receipt image and extract the following information in JSON format:
{
  "vendorName": "Company name that issued the invoice",
  "vendorAddress": "Full address of the vendor (if visible)",
  "invoiceNumber": "Invoice or receipt number",
  "invoiceDate": "Invoice date in YYYY-MM-DD format",
  "description": "Brief description of the purchase/service",
  "amount": "Total amount as a number",
  "currency": "Currency code (e.g., EUR, USD)",
  "vatRate": "VAT/Tax rate as a percentage number (e.g., 19 for 19%)",
  "vatAmount": "VAT/Tax amount as a number",
  "category": "Best matching category: SOFTWARE, HARDWARE, OFFICE, TRAVEL, MARKETING, UTILITIES, PROFESSIONAL_SERVICES, or OTHER",
  "paymentMethod": "Payment method if mentioned: BANK_TRANSFER, CREDIT_CARD, DEBIT_CARD, CASH, PAYPAL, or OTHER"
}

If any field is not visible or unclear, omit it from the response. Return ONLY valid JSON, no additional text.`,
                            },
                            {
                                type: 'image_url',
                                image_url: {
                                    url: `data:${mimeType};base64,${imageBase64}`,
                                },
                            },
                        ],
                    },
                ],
                max_tokens: 1000,
            })

            console.log('✅ DEBUG: OpenAI API call successful')
            console.log('✅ Response:', JSON.stringify(response, null, 2))

            const content = response.choices[0]?.message?.content
            if (!content) {
                throw new Error('No response from OpenAI')
            }

            console.log('✅ Raw content from OpenAI:', content)

            // Parse the JSON response - handle markdown code blocks
            let jsonString = content.trim()

            // Remove markdown code blocks if present
            if (jsonString.startsWith('```json')) {
                jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '')
            } else if (jsonString.startsWith('```')) {
                jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '')
            }

            console.log('✅ Cleaned JSON string:', jsonString)

            const data = JSON.parse(jsonString) as ExtractedInvoiceData
            console.log('✅ Parsed data:', data)

            return data
        } catch (apiError: any) {
            console.error('❌ DEBUG: OpenAI API call failed')
            console.error('❌ Error type:', typeof apiError)
            console.error('❌ Error name:', apiError?.name)
            console.error('❌ Error message:', apiError?.message)
            console.error('❌ Error status:', apiError?.status)
            console.error('❌ Error code:', apiError?.code)
            console.error('❌ Error type field:', apiError?.type)
            console.error('❌ Full error object:', JSON.stringify(apiError, null, 2))
            throw apiError
        }
    } catch (error) {
        console.error('Error analyzing invoice with OpenAI:', error)

        // Log the full error for debugging
        if (error instanceof Error) {
            console.error('Error details:', {
                message: error.message,
                name: error.name,
                stack: error.stack
            })
        }

        // Check for specific OpenAI errors
        if (typeof error === 'object' && error !== null) {
            const apiError = error as any
            console.error('OpenAI API Error Details:', {
                status: apiError.status,
                type: apiError.type,
                code: apiError.code,
                message: apiError.message,
                error: apiError.error
            })

            // Provide more specific error messages
            if (apiError.status === 401) {
                throw new Error('OpenAI API authentication failed. Please check your API key.')
            }
            if (apiError.status === 429) {
                throw new Error('OpenAI API rate limit exceeded. Please try again later.')
            }
            if (apiError.status === 400) {
                throw new Error('Invalid request to OpenAI API. The image may be corrupted or too large.')
            }
        }

        throw new Error('Failed to analyze invoice. Please try manual entry.')
    }
}

/**
 * Extract invoice data from file buffer
 */
export async function extractInvoiceData(
    fileBuffer: Buffer,
    mimeType: string
): Promise<ExtractedInvoiceData> {
    try {
        let imageBase64: string

        // For now, only support direct images (not PDFs)
        // PDF to image conversion requires additional setup
        if (mimeType === 'application/pdf') {
            throw new Error('PDF support is currently disabled. Please upload an image (JPG, PNG, WEBP) of your invoice instead.')
        }

        // Direct image file
        imageBase64 = fileBuffer.toString('base64')

        // Analyze with OpenAI Vision
        const data = await analyzeInvoice(imageBase64, mimeType)

        return data
    } catch (error) {
        console.error('Error extracting invoice data:', error)

        // Provide more specific error messages
        if (error instanceof Error) {
            if (error.message.includes('API key')) {
                throw new Error('OpenAI API key is missing or invalid. Please check your .env file.')
            }
            if (error.message.includes('PDF')) {
                throw error // Re-throw PDF error as-is
            }
            if (error.message.includes('quota') || error.message.includes('rate limit')) {
                throw new Error('OpenAI API quota exceeded or rate limited. Please try again later.')
            }
        }

        throw error
    }
}

/**
 * Retry logic for API calls
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
): Promise<T> {
    let lastError: Error | null = null

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn()
        } catch (error) {
            lastError = error as Error
            if (i < maxRetries - 1) {
                await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)))
            }
        }
    }

    throw lastError
}
