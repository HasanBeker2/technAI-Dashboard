import { NextRequest, NextResponse } from 'next/server'
import { generateGermanFilename } from '@/lib/expense-utils'
import type { ExpenseCategory } from '@/lib/validations'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { date, category, vendorName, extension = 'pdf' } = body

        if (!date || !category || !vendorName) {
            return NextResponse.json(
                { error: 'Missing required fields: date, category, vendorName' },
                { status: 400 }
            )
        }

        const filename = generateGermanFilename(
            new Date(date),
            category as ExpenseCategory,
            vendorName,
            extension
        )

        return NextResponse.json({
            success: true,
            filename,
        })
    } catch (error) {
        console.error('Error generating filename:', error)
        return NextResponse.json(
            { error: 'Failed to generate filename' },
            { status: 500 }
        )
    }
}
