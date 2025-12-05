import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createProjectSchema } from '@/lib/validations'

// GET /api/projects - List all projects
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const clientId = searchParams.get('clientId')

        const projects = await prisma.project.findMany({
            where: {
                ...(status && { status: status as 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'ARCHIVED' }),
                ...(clientId && { clientId }),
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        timesheets: true,
                    },
                },
                timesheets: {
                    select: {
                        hours: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        // Calculate total hours and earnings for each project
        const projectsWithStats = projects.map((project) => {
            const totalHours = project.timesheets.reduce(
                (sum, ts) => sum + Number(ts.hours),
                0
            )
            const earnings = totalHours * Number(project.hourlyRate)

            return {
                ...project,
                totalHours: Math.round(totalHours * 10) / 10,
                earnings: Math.round(earnings * 100) / 100,
                timesheets: undefined, // Remove individual timesheet data
            }
        })

        return NextResponse.json(projectsWithStats)
    } catch (error) {
        console.error('Error fetching projects:', error)
        return NextResponse.json(
            { error: 'Failed to fetch projects' },
            { status: 500 }
        )
    }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const validatedData = createProjectSchema.parse(body)

        const project = await prisma.project.create({
            data: {
                name: validatedData.name,
                description: validatedData.description || null,
                hourlyRate: validatedData.hourlyRate,
                estimatedHours: validatedData.estimatedHours || null,
                status: validatedData.status,
                clientId: validatedData.clientId,
                userId: validatedData.userId,
            },
            include: {
                client: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        })

        return NextResponse.json(project, { status: 201 })
    } catch (error) {
        console.error('Error creating project:', error)
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Validation failed', details: error },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to create project' },
            { status: 500 }
        )
    }
}
