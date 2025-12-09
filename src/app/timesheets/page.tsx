'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TimesheetForm } from '@/components/forms/timesheet-form'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Plus, ChevronLeft, ChevronRight, Calendar, Clock, Trash2, Edit } from 'lucide-react'
import { formatHours, formatDate, formatCurrency } from '@/lib/utils'

interface Project {
    id: string
    name: string
    hourlyRate: number
    client: { id: string; name: string }
}

interface TimesheetEntry {
    id: string
    date: string
    hours: number
    description: string | null
    projectId: string
    project: {
        id: string
        name: string
        hourlyRate: number
        client: { id: string; name: string }
    }
}

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function TimesheetsPage() {
    const [timesheets, setTimesheets] = useState<TimesheetEntry[]>([])
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [currentWeekStart, setCurrentWeekStart] = useState(() => {
        const now = new Date()
        const dayOfWeek = now.getDay()
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
        return new Date(now.setDate(now.getDate() + diff))
    })

    // Modal states
    const [showTimesheetForm, setShowTimesheetForm] = useState(false)
    const [editingTimesheet, setEditingTimesheet] = useState<TimesheetEntry | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<TimesheetEntry | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const fetchTimesheets = useCallback(async () => {
        try {
            const dateStr = currentWeekStart.toISOString().split('T')[0]
            const res = await fetch(`/api/timesheets?view=week&date=${dateStr}`)
            if (res.ok) {
                const data = await res.json()
                setTimesheets(data.entries || [])
            }
        } catch (error) {
            console.error('Error fetching timesheets:', error)
        } finally {
            setLoading(false)
        }
    }, [currentWeekStart])

    const fetchProjects = useCallback(async () => {
        try {
            const res = await fetch('/api/projects?status=ACTIVE')
            if (res.ok) {
                const data = await res.json()
                setProjects(data)
            }
        } catch (error) {
            console.error('Error fetching projects:', error)
        }
    }, [])

    useEffect(() => {
        fetchTimesheets()
        fetchProjects()
    }, [fetchTimesheets, fetchProjects])

    const getWeekDates = () => {
        return weekDays.map((day, index) => {
            const date = new Date(currentWeekStart)
            date.setDate(date.getDate() + index)
            return {
                day,
                date: date.toISOString().split('T')[0],
                dayNum: date.getDate(),
                isToday: new Date().toDateString() === date.toDateString(),
            }
        })
    }

    const weekDates = getWeekDates()

    const getHoursForDay = (date: string) => {
        return timesheets
            .filter((ts) => ts.date.split('T')[0] === date)
            .reduce((sum, ts) => sum + Number(ts.hours), 0)
    }

    const totalWeekHours = weekDates.reduce(
        (sum, d) => sum + getHoursForDay(d.date),
        0
    )

    const totalEarnings = weekDates.reduce(
        (sum, d) => {
            const dayEarnings = timesheets
                .filter((ts) => ts.date.split('T')[0] === d.date)
                .reduce((daySum, ts) => daySum + Number(ts.hours) * Number(ts.project.hourlyRate), 0)
            return sum + dayEarnings
        },
        0
    )

    // Filter timesheets to only show entries from current week
    const weekDatesSet = new Set(weekDates.map(d => d.date))
    const weekTimesheets = timesheets.filter(ts => weekDatesSet.has(ts.date.split('T')[0]))


    const navigateWeek = (direction: 'prev' | 'next') => {
        const newDate = new Date(currentWeekStart)
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
        setCurrentWeekStart(newDate)
    }

    const handleCreateTimesheet = async (data: {
        projectId: string
        date: string
        hours: number
        description?: string
    }) => {
        try {
            const res = await fetch('/api/timesheets', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (res.ok) {
                setShowTimesheetForm(false)
                fetchTimesheets()
            } else {
                const error = await res.json()
                alert(`Error: ${error.error || 'Failed to create timesheet'}`)
            }
        } catch (error) {
            console.error('Error creating timesheet:', error)
            alert('Failed to create timesheet')
        }
    }

    const handleUpdateTimesheet = async (data: {
        projectId: string
        date: string
        hours: number
        description?: string
    }) => {
        if (!editingTimesheet) return
        try {
            const res = await fetch(`/api/timesheets/${editingTimesheet.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (res.ok) {
                setEditingTimesheet(null)
                fetchTimesheets()
            } else {
                const error = await res.json()
                alert(`Error: ${error.error || 'Failed to update timesheet'}`)
            }
        } catch (error) {
            console.error('Error updating timesheet:', error)
            alert('Failed to update timesheet')
        }
    }

    const handleDeleteTimesheet = async () => {
        if (!deleteTarget) return
        setIsDeleting(true)
        try {
            const res = await fetch(`/api/timesheets/${deleteTarget.id}`, {
                method: 'DELETE',
            })
            if (res.ok) {
                setDeleteTarget(null)
                fetchTimesheets()
            } else {
                const error = await res.json()
                alert(`Error: ${error.error || 'Failed to delete timesheet'}`)
            }
        } catch (error) {
            console.error('Error deleting timesheet:', error)
            alert('Failed to delete timesheet')
        } finally {
            setIsDeleting(false)
        }
    }

    const projectsForForm = projects.map((p) => ({
        id: p.id,
        name: p.name,
        clientName: p.client.name,
    }))

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[hsl(var(--primary))]"></div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Timesheets</h1>
                    <p className="mt-1 text-[hsl(var(--muted-foreground))]">
                        Track your working hours and project time.
                    </p>
                </div>
                <Button onClick={() => setShowTimesheetForm(true)}>
                    <Plus className="h-4 w-4" />
                    Add Hours
                </Button>
            </div>

            {/* Week Navigation */}
            <div className="flex items-center justify-between rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                <button
                    onClick={() => navigateWeek('prev')}
                    className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]"
                >
                    <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-[hsl(var(--primary))]" />
                    <span className="font-medium">
                        Week of {formatDate(currentWeekStart)}
                    </span>
                </div>

                <button
                    onClick={() => navigateWeek('next')}
                    className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]"
                >
                    <ChevronRight className="h-5 w-5" />
                </button>
            </div>

            {/* Week Overview Grid */}
            <div className="grid grid-cols-7 gap-2">
                {weekDates.map((d) => {
                    const dayHours = getHoursForDay(d.date)
                    return (
                        <div
                            key={d.date}
                            className={`rounded-xl border p-4 text-center transition-all ${d.isToday
                                ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)]'
                                : 'border-[hsl(var(--border))] bg-[hsl(var(--card))]'
                                }`}
                        >
                            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                                {d.day}
                            </p>
                            <p className={`text-lg font-bold ${d.isToday ? 'text-[hsl(var(--primary))]' : ''}`}>
                                {d.dayNum}
                            </p>
                            <p className="mt-2 text-2xl font-bold">
                                {dayHours > 0 ? `${dayHours}h` : '-'}
                            </p>
                        </div>
                    )
                })}
            </div>

            {/* Stats Summary */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">This Week</p>
                    <p className="text-2xl font-bold gradient-text">{totalWeekHours}h</p>
                </div>
                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Entries</p>
                    <p className="text-2xl font-bold">{weekTimesheets.length}</p>
                </div>
                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Earnings</p>
                    <p className="text-2xl font-bold text-[hsl(var(--success))]">
                        {formatCurrency(totalEarnings)}
                    </p>
                </div>
            </div>

            {/* Recent Entries or Empty State */}
            {weekTimesheets.length === 0 ? (
                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-12 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-[hsl(var(--primary)/0.1)] flex items-center justify-center mb-4">
                        <Clock className="h-8 w-8 text-[hsl(var(--primary))]" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No time entries this week</h3>
                    <p className="text-[hsl(var(--muted-foreground))] mb-4">
                        Start tracking your hours to see earnings.
                    </p>
                    <Button onClick={() => setShowTimesheetForm(true)}>
                        <Plus className="h-4 w-4" />
                        Add Hours
                    </Button>
                </div>
            ) : (
                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
                    <div className="border-b border-[hsl(var(--border))] p-4">
                        <h3 className="font-semibold">Recent Entries</h3>
                    </div>
                    <div className="divide-y divide-[hsl(var(--border))]">
                        {weekTimesheets.map((entry) => (
                            <div
                                key={entry.id}
                                className="group flex items-center justify-between p-4 hover:bg-[hsl(var(--secondary)/0.3)] transition-colors"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <Badge variant="secondary">{formatDate(entry.date)}</Badge>
                                        <span className="font-medium">{entry.project.name}</span>
                                    </div>
                                    <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                                        {entry.description || 'No description'}
                                    </p>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                        {entry.project.client.name}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <p className="text-lg font-semibold">{formatHours(Number(entry.hours))}</p>
                                        <p className="text-sm text-[hsl(var(--muted-foreground))]">
                                            {formatCurrency(Number(entry.hours) * Number(entry.project.hourlyRate))}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setEditingTimesheet(entry)}
                                            className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]"
                                            title="Edit"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => setDeleteTarget(entry)}
                                            className="rounded-lg p-2 text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.1)]"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Timesheet Form Modal */}
            {(showTimesheetForm || editingTimesheet) && (
                <TimesheetForm
                    projects={projectsForForm}
                    onSubmit={editingTimesheet ? handleUpdateTimesheet : handleCreateTimesheet}
                    onCancel={() => {
                        setShowTimesheetForm(false)
                        setEditingTimesheet(null)
                    }}
                    initialData={
                        editingTimesheet
                            ? {
                                projectId: editingTimesheet.projectId,
                                date: editingTimesheet.date.split('T')[0],
                                hours: Number(editingTimesheet.hours),
                                description: editingTimesheet.description || undefined,
                            }
                            : undefined
                    }
                />
            )}

            {/* Delete Confirmation Dialog */}
            {deleteTarget && (
                <ConfirmDialog
                    title="Delete Time Entry"
                    message={`Are you sure you want to delete this ${deleteTarget.hours}h entry for "${deleteTarget.project.name}"? This action cannot be undone.`}
                    confirmText="Delete"
                    cancelText="Cancel"
                    variant="danger"
                    onConfirm={handleDeleteTimesheet}
                    onCancel={() => setDeleteTarget(null)}
                    isLoading={isDeleting}
                />
            )}
        </div>
    )
}
