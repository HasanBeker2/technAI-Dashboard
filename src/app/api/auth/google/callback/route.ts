import { NextRequest, NextResponse } from 'next/server'
import { getAccessToken } from '@/lib/google-drive'

export async function GET(request: NextRequest) {
    try {
        console.log('=== OAuth Callback Started ===')

        const searchParams = request.nextUrl.searchParams
        const code = searchParams.get('code')

        console.log('Authorization code received:', code ? 'YES' : 'NO')

        if (!code) {
            console.error('No authorization code in callback')
            return NextResponse.redirect(new URL('/?error=no_code', request.url))
        }

        console.log('Exchanging code for tokens...')
        const tokens = await getAccessToken(code)
        console.log('Tokens received:', {
            hasAccessToken: !!tokens.access_token,
            hasRefreshToken: !!tokens.refresh_token,
            expiryDate: tokens.expiry_date
        })

        // Store tokens in session/cookie (simplified version)
        // In production, you'd want to encrypt these and store securely
        const response = NextResponse.redirect(new URL('/expenses?auth=success', request.url))

        console.log('Setting access token cookie...')
        response.cookies.set('google_access_token', tokens.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 3600, // 1 hour
        })

        if (tokens.refresh_token) {
            console.log('Setting refresh token cookie...')
            response.cookies.set('google_refresh_token', tokens.refresh_token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 30, // 30 days
            })
        } else {
            console.warn('No refresh token received from Google')
        }

        console.log('OAuth callback successful, redirecting to /expenses')
        return response
    } catch (error: any) {
        console.error('=== OAuth Callback Error ===')
        console.error('Error message:', error.message)
        console.error('Error stack:', error.stack)
        console.error('Full error:', error)

        return NextResponse.redirect(new URL('/expenses?error=auth_failed', request.url))
    }
}
