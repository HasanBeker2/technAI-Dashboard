import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { updateClientSchema } from '@/lib/validations'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/clients/[id] - Get a single client
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const client = await prisma.client.findUnique({
            where: { id },
            include: {
                projects: {
                    orderBy: { createdAt: 'desc' },
                },
                invoices: {
                    orderBy: { issueDate: 'desc' },
                    take: 5,
                },
            },
        })

        if (!client) {
            return NextResponse.json(
                { error: 'Client not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(client)
    } catch (error) {
        console.error('Error fetching client:', error)
        return NextResponse.json(
            { error: 'Failed to fetch client' },
            { status: 500 }
        )
    }
}

// PUT /api/clients/[id] - Update a client
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const body = await request.json()
        const validatedData = updateClientSchema.parse(body)

        const client = await prisma.client.update({
            where: { id },
            data: validatedData,
        })

        return NextResponse.json(client)
    } catch (error) {
        console.error('Error updating client:', error)
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Validation failed', details: error },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to update client' },
            { status: 500 }
        )
    }
}

// DELETE /api/clients/[id] - Delete a client
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        await prisma.client.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting client:', error)
        return NextResponse.json(
            { error: 'Failed to delete client' },
            { status: 500 }
        )
    }
}
