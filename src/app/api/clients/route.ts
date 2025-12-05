import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClientSchema } from '@/lib/validations'

// GET /api/clients - List all clients
export async function GET() {
    try {
        const clients = await prisma.client.findMany({
            include: {
                _count: {
                    select: {
                        projects: true,
                        invoices: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json(clients)
    } catch (error) {
        console.error('Error fetching clients:', error)
        return NextResponse.json(
            { error: 'Failed to fetch clients' },
            { status: 500 }
        )
    }
}

// POST /api/clients - Create a new client
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const validatedData = createClientSchema.parse(body)

        const client = await prisma.client.create({
            data: {
                name: validatedData.name,
                email: validatedData.email || null,
                phone: validatedData.phone || null,
                address: validatedData.address || null,
            },
        })

        return NextResponse.json(client, { status: 201 })
    } catch (error) {
        console.error('Error creating client:', error)
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Validation failed', details: error },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to create client' },
            { status: 500 }
        )
    }
}
