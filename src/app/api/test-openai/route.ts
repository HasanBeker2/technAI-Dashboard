import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    try {
        // Check if OpenAI API key is configured
        const apiKey = process.env.OPENAI_API_KEY

        if (!apiKey || apiKey === '') {
            return NextResponse.json({
                configured: false,
                error: 'OPENAI_API_KEY is not set in .env file'
            })
        }

        if (!apiKey.startsWith('sk-')) {
            return NextResponse.json({
                configured: false,
                error: 'OPENAI_API_KEY format is invalid (should start with sk-)'
            })
        }

        // Test the API key with a simple request
        const OpenAI = require('openai').default
        const openai = new OpenAI({ apiKey })

        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o',
                messages: [{ role: 'user', content: 'Say "OK"' }],
                max_tokens: 5,
            })

            return NextResponse.json({
                configured: true,
                valid: true,
                keyPrefix: apiKey.substring(0, 10) + '...',
                message: 'OpenAI API key is working correctly!',
                testResponse: response.choices[0]?.message?.content
            })
        } catch (apiError: any) {
            return NextResponse.json({
                configured: true,
                valid: false,
                keyPrefix: apiKey.substring(0, 10) + '...',
                error: apiError.message || 'API key test failed',
                errorType: apiError.type || 'unknown',
                statusCode: apiError.status || 'unknown'
            })
        }
    } catch (error) {
        console.error('Error testing OpenAI config:', error)
        return NextResponse.json({
            configured: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        })
    }
}
