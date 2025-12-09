'use client'

import { useState, useEffect, useCallback } from 'react'
import { StatCard } from '@/components/dashboard/stat-card'
import { WeeklyHoursChart } from '@/components/dashboard/weekly-hours-chart'
import { PendingInvoicesList } from '@/components/dashboard/pending-invoices'
import { ProjectsOverview } from '@/components/dashboard/projects-overview'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  DollarSign,
  CreditCard,
  TrendingUp,
  FileText,
  Clock,
  Receipt,
  Plus,
} from 'lucide-react'

interface DashboardData {
  summary: {
    monthlyRevenue: number
    monthlyExpenses: number
    monthlyProfit: number
    profitMargin: number
  }
  pendingInvoices: {
    id: string
    invoiceNumber: string
    clientName: string
    total: number
    dueDate: string
    status: 'DRAFT' | 'SENT' | 'OVERDUE'
  }[]
  projectsOverview: {
    id: string
    name: string
    clientName: string
    hourlyRate: number
    totalHours: number
    estimatedHours: number
    earnings: number
    progress: number
  }[]
  weeklyHours: {
    totalHours: number
    dailyBreakdown: { date: string; name: string; hours: number }[]
  }
}

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = useCallback(async () => {
    try {
      // Fetch all data in parallel
      const [projectsRes, invoicesRes, expensesRes, timesheetsRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/invoices'),
        fetch('/api/expenses'),
        fetch(`/api/timesheets?view=week&date=${new Date().toISOString().split('T')[0]}`),
      ])

      const projects = projectsRes.ok ? await projectsRes.json() : []
      const invoices = invoicesRes.ok ? await invoicesRes.json() : []
      const expenses = expensesRes.ok ? await expensesRes.json() : []
      const timesheetsData = timesheetsRes.ok ? await timesheetsRes.json() : { entries: [] }
      const timesheets = timesheetsData.entries || []

      // Calculate monthly revenue from paid invoices
      const monthlyRevenue = invoices
        .filter((inv: { status: string }) => inv.status === 'PAID')
        .reduce((sum: number, inv: { total: number }) => sum + Number(inv.total), 0)

      // Calculate monthly expenses
      const monthlyExpenses = expenses.reduce(
        (sum: number, exp: { amount: number }) => sum + Number(exp.amount),
        0
      )

      // Pending invoices
      const pendingInvoices = invoices
        .filter((inv: { status: string }) => ['DRAFT', 'SENT', 'OVERDUE'].includes(inv.status))
        .map((inv: { id: string; invoiceNumber: string; client: { name: string }; total: number; dueDate: string; status: 'DRAFT' | 'SENT' | 'OVERDUE' }) => ({
          id: inv.id,
          invoiceNumber: inv.invoiceNumber,
          clientName: inv.client.name,
          total: Number(inv.total),
          dueDate: inv.dueDate,
          status: inv.status,
        }))
        .slice(0, 5)

      // Projects overview (active projects)
      const projectsOverview = projects
        .filter((p: { status: string }) => p.status === 'ACTIVE')
        .map((p: { id: string; name: string; client: { name: string }; hourlyRate: number; totalHours: number; estimatedHours: number | null; earnings: number }) => ({
          id: p.id,
          name: p.name,
          clientName: p.client.name,
          hourlyRate: Number(p.hourlyRate),
          totalHours: p.totalHours,
          estimatedHours: p.estimatedHours || 100,
          earnings: p.earnings,
          progress: p.estimatedHours ? Math.round((p.totalHours / Number(p.estimatedHours)) * 100) : 0,
        }))
        .slice(0, 3)

      // Weekly hours breakdown
      const now = new Date()
      const dayOfWeek = now.getDay()
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() + diff)

      const dailyBreakdown = weekDays.map((dayName, index) => {
        const date = new Date(weekStart)
        date.setDate(weekStart.getDate() + index)
        const dateStr = date.toISOString().split('T')[0]
        const dayHours = timesheets
          .filter((ts: { date: string }) => ts.date.split('T')[0] === dateStr)
          .reduce((sum: number, ts: { hours: number }) => sum + Number(ts.hours), 0)
        return { date: dateStr, name: dayName, hours: dayHours }
      })

      const totalWeekHours = dailyBreakdown.reduce((sum, d) => sum + d.hours, 0)

      setData({
        summary: {
          monthlyRevenue,
          monthlyExpenses,
          monthlyProfit: monthlyRevenue - monthlyExpenses,
          profitMargin: monthlyRevenue > 0 ? Math.round(((monthlyRevenue - monthlyExpenses) / monthlyRevenue) * 100 * 10) / 10 : 0,
        },
        pendingInvoices,
        projectsOverview,
        weeklyHours: {
          totalHours: totalWeekHours,
          dailyBreakdown,
        },
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-[hsl(var(--muted-foreground))]">Failed to load dashboard data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="mt-1 text-[hsl(var(--muted-foreground))]">
            Welcome back! Here&apos;s your business overview.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <Link href="/invoices">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4" />
              Create Invoice
            </Button>
          </Link>
          <Link href="/timesheets">
            <Button variant="outline" size="sm">
              <Clock className="h-4 w-4" />
              Add Hours
            </Button>
          </Link>
          <Link href="/expenses">
            <Button variant="outline" size="sm">
              <Receipt className="h-4 w-4" />
              Add Expense
            </Button>
          </Link>
          <Link href="/projects">
            <Button size="sm">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard
          title="Monthly Revenue"
          value={data.summary.monthlyRevenue}
          subtitle="This month"
          icon={DollarSign}
          variant="primary"
        />
        <StatCard
          title="Monthly Expenses"
          value={data.summary.monthlyExpenses}
          subtitle="This month"
          icon={CreditCard}
          variant="warning"
        />
        <StatCard
          title="Profit Calculation"
          value={data.summary.monthlyProfit}
          subtitle={`Net Profit • Margin: ${data.summary.profitMargin}%`}
          icon={TrendingUp}
          variant="success"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <WeeklyHoursChart
          data={data.weeklyHours.dailyBreakdown}
          totalHours={data.weeklyHours.totalHours}
        />
        <PendingInvoicesList invoices={data.pendingInvoices} />
      </div>

      {/* Projects Overview */}
      <ProjectsOverview projects={data.projectsOverview} />
    </div>
  )
}
