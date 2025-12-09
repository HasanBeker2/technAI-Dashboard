import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

interface RouteParams {
    params: Promise<{ id: string }>
}

// PATCH /api/invoices/[id]/status - Progress invoice status
export async function PATCH(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params

        // Get current invoice
        const invoice = await prisma.invoice.findUnique({
            where: { id },
            select: { status: true },
        })

        if (!invoice) {
            return NextResponse.json(
                { error: 'Invoice not found' },
                { status: 404 }
            )
        }

        // Determine next status based on current status
        let nextStatus: 'PENDING' | 'SENT' | 'PAID'

        switch (invoice.status) {
            case 'PENDING':
                nextStatus = 'SENT'
                break
            case 'SENT':
                nextStatus = 'PAID'
                break
            case 'PAID':
                // Already paid, no further progression
                return NextResponse.json(
                    { error: 'Invoice is already paid' },
                    { status: 400 }
                )
            default:
                // DRAFT, OVERDUE, CANCELLED cannot be progressed
                return NextResponse.json(
                    { error: 'Cannot progress invoice from current status' },
                    { status: 400 }
                )
        }

        // Update the invoice status
        const updatedInvoice = await prisma.invoice.update({
            where: { id },
            data: { status: nextStatus },
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

        return NextResponse.json(updatedInvoice)
    } catch (error) {
        console.error('Error updating invoice status:', error)
        return NextResponse.json(
            { error: 'Failed to update invoice status' },
            { status: 500 }
        )
    }
}
