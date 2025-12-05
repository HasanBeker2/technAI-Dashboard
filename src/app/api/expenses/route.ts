import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createExpenseSchema } from '@/lib/validations'
import { startOfMonth, endOfMonth } from 'date-fns'

// GET /api/expenses - List all expenses
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const category = searchParams.get('category')
        const monthParam = searchParams.get('month') // Format: YYYY-MM
        const summary = searchParams.get('summary') === 'true'

        let dateFilter = {}
        if (monthParam) {
            const [year, month] = monthParam.split('-').map(Number)
            const monthStart = startOfMonth(new Date(year, month - 1))
            const monthEnd = endOfMonth(new Date(year, month - 1))
            dateFilter = {
                date: {
                    gte: monthStart,
                    lte: monthEnd,
                },
            }
        }

        const expenses = await prisma.expense.findMany({
            where: {
                ...(category && { category: category as 'SOFTWARE' | 'HARDWARE' | 'OFFICE' | 'TRAVEL' | 'MARKETING' | 'UTILITIES' | 'PROFESSIONAL_SERVICES' | 'OTHER' }),
                ...dateFilter,
            },
            orderBy: { date: 'desc' },
        })

        // Return monthly summary if requested
        if (summary) {
            const totalAmount = expenses.reduce(
                (sum, exp) => sum + Number(exp.amount),
                0
            )
            const totalVat = expenses.reduce(
                (sum, exp) => sum + (exp.vatAmount ? Number(exp.vatAmount) : 0),
                0
            )

            // Group by category
            const byCategory = expenses.reduce<Record<string, number>>((acc, exp) => {
                const cat = exp.category
                acc[cat] = (acc[cat] || 0) + Number(exp.amount)
                return acc
            }, {})

            return NextResponse.json({
                expenses,
                summary: {
                    totalAmount: Math.round(totalAmount * 100) / 100,
                    totalVat: Math.round(totalVat * 100) / 100,
                    count: expenses.length,
                    byCategory,
                },
            })
        }

        return NextResponse.json(expenses)
    } catch (error) {
        console.error('Error fetching expenses:', error)
        return NextResponse.json(
            { error: 'Failed to fetch expenses' },
            { status: 500 }
        )
    }
}

// POST /api/expenses - Create a new expense
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const validatedData = createExpenseSchema.parse(body)

        const expense = await prisma.expense.create({
            data: {
                category: validatedData.category,
                description: validatedData.description,
                amount: validatedData.amount,
                vatAmount: validatedData.vatAmount || null,
                date: validatedData.date,
                receiptUrl: validatedData.receiptUrl || null,
            },
        })

        return NextResponse.json(expense, { status: 201 })
    } catch (error) {
        console.error('Error creating expense:', error)
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Validation failed', details: error },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to create expense' },
            { status: 500 }
        )
    }
}
