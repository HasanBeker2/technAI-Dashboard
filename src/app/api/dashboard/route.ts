import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths } from 'date-fns'
import { groupHoursByWeek } from '@/lib/timesheet-utils'

// GET /api/dashboard - Get dashboard summary data
export async function GET() {
    try {
        const now = new Date()
        const currentMonthStart = startOfMonth(now)
        const currentMonthEnd = endOfMonth(now)
        const lastMonthStart = startOfMonth(subMonths(now, 1))
        const lastMonthEnd = endOfMonth(subMonths(now, 1))
        const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 })
        const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 })

        // Get current month paid invoices (revenue)
        const currentMonthInvoices = await prisma.invoice.findMany({
            where: {
                status: 'PAID',
                issueDate: {
                    gte: currentMonthStart,
                    lte: currentMonthEnd,
                },
            },
            select: { total: true },
        })
        const monthlyRevenue = currentMonthInvoices.reduce(
            (sum, inv) => sum + Number(inv.total),
            0
        )

        // Get last month revenue for comparison
        const lastMonthInvoices = await prisma.invoice.findMany({
            where: {
                status: 'PAID',
                issueDate: {
                    gte: lastMonthStart,
                    lte: lastMonthEnd,
                },
            },
            select: { total: true },
        })
        const lastMonthRevenue = lastMonthInvoices.reduce(
            (sum, inv) => sum + Number(inv.total),
            0
        )

        // Get current month expenses
        const currentMonthExpenses = await prisma.expense.findMany({
            where: {
                date: {
                    gte: currentMonthStart,
                    lte: currentMonthEnd,
                },
            },
            select: { amount: true },
        })
        const monthlyExpenses = currentMonthExpenses.reduce(
            (sum, exp) => sum + Number(exp.amount),
            0
        )

        // Get last month expenses for comparison
        const lastMonthExpensesData = await prisma.expense.findMany({
            where: {
                date: {
                    gte: lastMonthStart,
                    lte: lastMonthEnd,
                },
            },
            select: { amount: true },
        })
        const lastMonthExpenses = lastMonthExpensesData.reduce(
            (sum, exp) => sum + Number(exp.amount),
            0
        )

        // Calculate profit
        const monthlyProfit = monthlyRevenue - monthlyExpenses
        const profitMargin = monthlyRevenue > 0 ? (monthlyProfit / monthlyRevenue) * 100 : 0

        // Calculate percentage changes
        const revenueChange = lastMonthRevenue > 0
            ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
            : 0
        const expenseChange = lastMonthExpenses > 0
            ? ((monthlyExpenses - lastMonthExpenses) / lastMonthExpenses) * 100
            : 0

        // Get pending invoices (SENT or OVERDUE)
        const pendingInvoices = await prisma.invoice.findMany({
            where: {
                status: {
                    in: ['SENT', 'OVERDUE', 'DRAFT'],
                },
            },
            include: {
                client: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: { dueDate: 'asc' },
            take: 5,
        })

        // Get project earnings overview
        const projects = await prisma.project.findMany({
            where: {
                status: 'ACTIVE',
            },
            include: {
                client: {
                    select: {
                        name: true,
                    },
                },
                timesheets: {
                    select: {
                        hours: true,
                    },
                },
            },
            take: 6,
        })

        const projectsOverview = projects.map((project) => {
            const totalHours = project.timesheets.reduce(
                (sum, ts) => sum + Number(ts.hours),
                0
            )
            const earnings = totalHours * Number(project.hourlyRate)
            const progress = project.estimatedHours
                ? Math.min((totalHours / Number(project.estimatedHours)) * 100, 100)
                : null

            return {
                id: project.id,
                name: project.name,
                clientName: project.client.name,
                hourlyRate: Number(project.hourlyRate),
                totalHours: Math.round(totalHours * 10) / 10,
                estimatedHours: project.estimatedHours ? Number(project.estimatedHours) : null,
                earnings: Math.round(earnings * 100) / 100,
                progress: progress ? Math.round(progress) : null,
            }
        })

        // Get weekly hours for chart
        const weeklyTimesheets = await prisma.timesheet.findMany({
            where: {
                date: {
                    gte: currentWeekStart,
                    lte: currentWeekEnd,
                },
            },
            include: {
                project: {
                    select: {
                        name: true,
                        hourlyRate: true,
                    },
                },
            },
        })

        const timesheetEntries = weeklyTimesheets.map((ts) => ({
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

        const weeklyHours = groupHoursByWeek(timesheetEntries, now)

        return NextResponse.json({
            summary: {
                monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
                monthlyExpenses: Math.round(monthlyExpenses * 100) / 100,
                monthlyProfit: Math.round(monthlyProfit * 100) / 100,
                profitMargin: Math.round(profitMargin * 10) / 10,
                revenueChange: Math.round(revenueChange * 10) / 10,
                expenseChange: Math.round(expenseChange * 10) / 10,
            },
            pendingInvoices: pendingInvoices.map((inv) => ({
                id: inv.id,
                invoiceNumber: inv.invoiceNumber,
                clientName: inv.client.name,
                total: Number(inv.total),
                dueDate: inv.dueDate,
                status: inv.status,
            })),
            projectsOverview,
            weeklyHours,
        })
    } catch (error) {
        console.error('Error fetching dashboard data:', error)
        return NextResponse.json(
            { error: 'Failed to fetch dashboard data' },
            { status: 500 }
        )
    }
}
