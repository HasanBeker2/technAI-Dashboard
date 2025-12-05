import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createInvoiceSchema } from '@/lib/validations'
import { calculateInvoiceTotals, getNextInvoiceNumber } from '@/lib/invoice-utils'

// GET /api/invoices - List all invoices
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const clientId = searchParams.get('clientId')
        const includeTimesheets = searchParams.get('includeTimesheets') === 'true'

        const invoices = await prisma.invoice.findMany({
            where: {
                ...(status && { status: status as 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED' }),
                ...(clientId && { clientId }),
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
            orderBy: { issueDate: 'desc' },
        })

        return NextResponse.json(invoices)
    } catch (error) {
        console.error('Error fetching invoices:', error)
        return NextResponse.json(
            { error: 'Failed to fetch invoices' },
            { status: 500 }
        )
    }
}

// POST /api/invoices - Create a new invoice
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const validatedData = createInvoiceSchema.parse(body)

        // Calculate totals
        const totals = calculateInvoiceTotals(validatedData.items, validatedData.vatRate)

        // Generate invoice number
        const existingInvoices = await prisma.invoice.findMany({
            select: { invoiceNumber: true },
        })
        const invoiceNumber = getNextInvoiceNumber(
            existingInvoices.map((i) => i.invoiceNumber)
        )

        // If service period is provided, fetch timesheets for reference
        let timesheetIds: string[] = []
        if (validatedData.servicePeriodStart && validatedData.servicePeriodEnd && validatedData.projectId) {
            const timesheetsInRange = await prisma.timesheet.findMany({
                where: {
                    projectId: validatedData.projectId,
                    date: {
                        gte: new Date(validatedData.servicePeriodStart),
                        lte: new Date(validatedData.servicePeriodEnd),
                    },
                },
                select: { id: true },
            })
            timesheetIds = timesheetsInRange.map(ts => ts.id)
        }

        const invoice = await prisma.invoice.create({
            data: {
                invoiceNumber,
                clientId: validatedData.clientId,
                projectId: validatedData.projectId || null,
                issueDate: validatedData.issueDate,
                dueDate: validatedData.dueDate,
                items: validatedData.items,
                subtotal: totals.subtotal,
                vatRate: totals.vatRate,
                vatAmount: totals.vatAmount,
                total: totals.total,
                notes: validatedData.notes || null,
                status: validatedData.status,
                servicePeriodStart: validatedData.servicePeriodStart || null,
                servicePeriodEnd: validatedData.servicePeriodEnd || null,
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

        return NextResponse.json(invoice, { status: 201 })
    } catch (error) {
        console.error('Error creating invoice:', error)
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Validation failed', details: error },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to create invoice' },
            { status: 500 }
        )
    }
}
