import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { updateTimesheetSchema } from '@/lib/validations'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/timesheets/[id] - Get a single timesheet entry
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const timesheet = await prisma.timesheet.findUnique({
            where: { id },
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        hourlyRate: true,
                        client: {
                            select: {
                                id: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        })

        if (!timesheet) {
            return NextResponse.json(
                { error: 'Timesheet entry not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(timesheet)
    } catch (error) {
        console.error('Error fetching timesheet:', error)
        return NextResponse.json(
            { error: 'Failed to fetch timesheet' },
            { status: 500 }
        )
    }
}

// PUT /api/timesheets/[id] - Update a timesheet entry
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const body = await request.json()
        const validatedData = updateTimesheetSchema.parse(body)

        const timesheet = await prisma.timesheet.update({
            where: { id },
            data: validatedData,
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        hourlyRate: true,
                    },
                },
            },
        })

        return NextResponse.json(timesheet)
    } catch (error) {
        console.error('Error updating timesheet:', error)
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Validation failed', details: error },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to update timesheet' },
            { status: 500 }
        )
    }
}

// DELETE /api/timesheets/[id] - Delete a timesheet entry
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        await prisma.timesheet.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting timesheet:', error)
        return NextResponse.json(
            { error: 'Failed to delete timesheet' },
            { status: 500 }
        )
    }
}
