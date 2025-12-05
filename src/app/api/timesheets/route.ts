import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createTimesheetSchema } from '@/lib/validations'
import { groupHoursByWeek, groupHoursByMonth } from '@/lib/timesheet-utils'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

// GET /api/timesheets - List timesheets with optional filtering
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const projectId = searchParams.get('projectId')
        const view = searchParams.get('view') // 'week' | 'month' | 'all'
        const dateParam = searchParams.get('date') // Reference date for week/month view
        const isBilledParam = searchParams.get('isBilled') // 'true' | 'false'
        const startDateParam = searchParams.get('startDate') // YYYY-MM-DD
        const endDateParam = searchParams.get('endDate') // YYYY-MM-DD

        const referenceDate = dateParam ? new Date(dateParam) : new Date()

        let dateFilter = {}

        // Custom date range filter (takes precedence over view-based filters)
        if (startDateParam || endDateParam) {
            dateFilter = {
                date: {
                    ...(startDateParam && { gte: new Date(startDateParam) }),
                    ...(endDateParam && { lte: new Date(endDateParam) }),
                },
            }
        } else if (view === 'week') {
            const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 })
            const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 })
            dateFilter = {
                date: {
                    gte: weekStart,
                    lte: weekEnd,
                },
            }
        } else if (view === 'month') {
            const monthStart = startOfMonth(referenceDate)
            const monthEnd = endOfMonth(referenceDate)
            dateFilter = {
                date: {
                    gte: monthStart,
                    lte: monthEnd,
                },
            }
        }

        const timesheets = await prisma.timesheet.findMany({
            where: {
                ...(projectId && { projectId }),
                ...(isBilledParam && { isBilled: isBilledParam === 'true' }),
                ...dateFilter,
            },
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
            orderBy: { date: 'desc' },
        })

        // If view is specified, return aggregated data
        if (view === 'week') {
            const entries = timesheets.map((ts) => ({
                id: ts.id,
                date: ts.date,
                hours: Number(ts.hours),
                description: ts.description,
                projectId: ts.projectId,
                project: ts.project
                    ? {
                        name: ts.project.name,
                        hourlyRate: Number(ts.project.hourlyRate),
                    }
                    : undefined,
            }))
            const weekSummary = groupHoursByWeek(entries, referenceDate)
            return NextResponse.json({
                entries: timesheets,
                summary: weekSummary,
            })
        }

        if (view === 'month') {
            const entries = timesheets.map((ts) => ({
                id: ts.id,
                date: ts.date,
                hours: Number(ts.hours),
                description: ts.description,
                projectId: ts.projectId,
                project: ts.project
                    ? {
                        name: ts.project.name,
                        hourlyRate: Number(ts.project.hourlyRate),
                    }
                    : undefined,
            }))
            const monthSummary = groupHoursByMonth(
                entries,
                referenceDate.getFullYear(),
                referenceDate.getMonth() + 1
            )
            return NextResponse.json({
                entries: timesheets,
                summary: monthSummary,
            })
        }

        return NextResponse.json(timesheets)
    } catch (error) {
        console.error('Error fetching timesheets:', error)
        return NextResponse.json(
            { error: 'Failed to fetch timesheets' },
            { status: 500 }
        )
    }
}

// POST /api/timesheets - Create a new timesheet entry
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const validatedData = createTimesheetSchema.parse(body)

        const timesheet = await prisma.timesheet.create({
            data: {
                projectId: validatedData.projectId,
                date: validatedData.date,
                hours: validatedData.hours,
                description: validatedData.description || null,
            },
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

        return NextResponse.json(timesheet, { status: 201 })
    } catch (error) {
        console.error('Error creating timesheet:', error)
        if (error instanceof Error && error.name === 'ZodError') {
            return NextResponse.json(
                { error: 'Validation failed', details: error },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to create timesheet' },
            { status: 500 }
        )
    }
}
