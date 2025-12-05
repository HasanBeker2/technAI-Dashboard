import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { updateProjectSchema } from '@/lib/validations'

interface RouteParams {
    params: Promise<{ id: string }>
}

// GET /api/projects/[id] - Get a single project with details
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                client: true,
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                timesheets: {
                    orderBy: { date: 'desc' },
                    take: 10,
                },
                invoices: {
                    orderBy: { issueDate: 'desc' },
                    take: 5,
                },
            },
        })

        if (!project) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            )
        }

        // Calculate stats
        const allTimesheets = await prisma.timesheet.findMany({
            where: { projectId: id },
            select: { hours: true },
        })

        const totalHours = allTimesheets.reduce(
            (sum, ts) => sum + Number(ts.hours),
            0
        )
        const earnings = totalHours * Number(project.hourlyRate)
        const progress = project.estimatedHours
            ? Math.min((totalHours / Number(project.estimatedHours)) * 100, 100)
            : null

        return NextResponse.json({
            ...project,
            stats: {
                totalHours: Math.round(totalHours * 10) / 10,
                earnings: Math.round(earnings * 100) / 100,
                progress: progress ? Math.round(progress) : null,
            },
        })
    } catch (error) {
        console.error('Error fetching project:', error)
        return NextResponse.json(
            { error: 'Failed to fetch project' },
            { status: 500 }
        )
    }
}

// PUT /api/projects/[id] - Update a project
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        const body = await request.json()
        const validatedData = updateProjectSchema.parse(body)

        const project = await prisma.project.update({
            where: { id },
            data: validatedData,
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        })

        return NextResponse.json(project)
    } catch (error) {
        console.error('Error updating project:', error)
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Validation failed', details: error },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to update project' },
            { status: 500 }
        )
    }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params
        await prisma.project.delete({
            where: { id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting project:', error)
        return NextResponse.json(
            { error: 'Failed to delete project' },
            { status: 500 }
        )
    }
}
