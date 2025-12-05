import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { updateInvoiceSchema } from '@/lib/validations'
import { calculateInvoiceTotals, prepareInvoiceForPDF } from '@/lib/invoice-utils'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/invoices/[id] - Get a single invoice
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const { searchParams } = new URL(request.url)
        const includeTimesheets = searchParams.get('includeTimesheets') === 'true'

        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                client: true,
                project: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                ...(includeTimesheets && {
                    timesheets: {
                        select: {
                            id: true,
                            date: true,
                            hours: true,
                            description: true,
                        },
                        orderBy: { date: 'asc' },
                    },
                }),
            },
        })

        if (!invoice) {
            return NextResponse.json(
                { error: 'Invoice not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(invoice)
    } catch (error) {
        console.error('Error fetching invoice:', error)
        return NextResponse.json(
            { error: 'Failed to fetch invoice' },
            { status: 500 }
        )
    }
}

// PUT /api/invoices/[id] - Update an invoice
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const body = await request.json()
        const validatedData = updateInvoiceSchema.parse(body)

        // Recalculate totals if items are updated
        let totalsUpdate = {}
        if (validatedData.items) {
            const totals = calculateInvoiceTotals(
                validatedData.items,
                validatedData.vatRate ?? 19
            )
            totalsUpdate = {
                subtotal: totals.subtotal,
                vatRate: totals.vatRate,
                vatAmount: totals.vatAmount,
                total: totals.total,
            }
        }

        const invoice = await prisma.invoice.update({
            where: { id },
            data: {
                ...validatedData,
                ...totalsUpdate,
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                project: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        })

        return NextResponse.json(invoice)
    } catch (error) {
        console.error('Error updating invoice:', error)
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Validation failed', details: error },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to update invoice' },
            { status: 500 }
        )
    }
}

// DELETE /api/invoices/[id] - Delete an invoice
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        await prisma.invoice.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting invoice:', error)
        return NextResponse.json(
            { error: 'Failed to delete invoice' },
            { status: 500 }
        )
    }
}
