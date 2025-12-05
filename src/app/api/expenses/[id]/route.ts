import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { updateExpenseSchema } from '@/lib/validations'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/expenses/[id] - Get a single expense
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const expense = await prisma.expense.findUnique({
            where: { id },
        })

        if (!expense) {
            return NextResponse.json(
                { error: 'Expense not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(expense)
    } catch (error) {
        console.error('Error fetching expense:', error)
        return NextResponse.json(
            { error: 'Failed to fetch expense' },
            { status: 500 }
        )
    }
}

// PUT /api/expenses/[id] - Update an expense
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const body = await request.json()
        const validatedData = updateExpenseSchema.parse(body)

        const expense = await prisma.expense.update({
            where: { id },
            data: validatedData,
        })

        return NextResponse.json(expense)
    } catch (error) {
        console.error('Error updating expense:', error)
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Validation failed', details: error },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to update expense' },
            { status: 500 }
        )
    }
}

// DELETE /api/expenses/[id] - Delete an expense
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        await prisma.expense.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting expense:', error)
        return NextResponse.json(
            { error: 'Failed to delete expense' },
            { status: 500 }
        )
    }
}
