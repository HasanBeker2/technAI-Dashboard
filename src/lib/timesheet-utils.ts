import {
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    format,
    eachDayOfInterval,
    isSameDay,
    addDays,
    getWeek,
    getYear,
} from 'date-fns'

export interface TimesheetEntry {
    id: string
    date: Date | string
    hours: number | string
    description?: string | null
    projectId: string
    project?: {
        name: string
        hourlyRate: number | string
    }
}

export interface DailyHours {
    date: string
    dayName: string
    hours: number
}

export interface WeeklyHoursSummary {
    weekNumber: number
    year: number
    startDate: string
    endDate: string
    totalHours: number
    dailyBreakdown: DailyHours[]
}

export interface MonthlyHoursSummary {
    month: number
    year: number
    totalHours: number
    weeklyBreakdown: WeeklyHoursSummary[]
}

/**
 * Group timesheet entries by week
 */
export function groupHoursByWeek(
    entries: TimesheetEntry[],
    referenceDate: Date = new Date()
): WeeklyHoursSummary {
    const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 }) // Monday
    const weekEnd = endOfWeek(referenceDate, { weekStartsOn: 1 })

    const daysInWeek = eachDayOfInterval({ start: weekStart, end: weekEnd })

    const dailyBreakdown: DailyHours[] = daysInWeek.map(day => {
        const dayEntries = entries.filter(entry => {
            const entryDate = typeof entry.date === 'string' ? new Date(entry.date) : entry.date
            return isSameDay(entryDate, day)
        })

        const totalHours = dayEntries.reduce((sum, entry) => {
            const hours = typeof entry.hours === 'string' ? parseFloat(entry.hours) : entry.hours
            return sum + hours
        }, 0)

        return {
            date: format(day, 'yyyy-MM-dd'),
            dayName: format(day, 'EEE'),
            hours: Math.round(totalHours * 10) / 10,
        }
    })

    const totalHours = dailyBreakdown.reduce((sum, day) => sum + day.hours, 0)

    return {
        weekNumber: getWeek(referenceDate, { weekStartsOn: 1 }),
        year: getYear(referenceDate),
        startDate: format(weekStart, 'yyyy-MM-dd'),
        endDate: format(weekEnd, 'yyyy-MM-dd'),
        totalHours: Math.round(totalHours * 10) / 10,
        dailyBreakdown,
    }
}

/**
 * Group timesheet entries by month
 */
export function groupHoursByMonth(
    entries: TimesheetEntry[],
    year: number,
    month: number
): MonthlyHoursSummary {
    const monthDate = new Date(year, month - 1, 1)
    const monthStart = startOfMonth(monthDate)
    const monthEnd = endOfMonth(monthDate)

    // Generate all weeks in the month
    const weeks: WeeklyHoursSummary[] = []
    let currentWeekStart = startOfWeek(monthStart, { weekStartsOn: 1 })

    while (currentWeekStart <= monthEnd) {
        const weekEntries = entries.filter(entry => {
            const entryDate = typeof entry.date === 'string' ? new Date(entry.date) : entry.date
            const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })
            return entryDate >= currentWeekStart && entryDate <= weekEnd
        })

        weeks.push(groupHoursByWeek(weekEntries, currentWeekStart))
        currentWeekStart = addDays(currentWeekStart, 7)
    }

    const totalHours = weeks.reduce((sum, week) => sum + week.totalHours, 0)

    return {
        month,
        year,
        totalHours: Math.round(totalHours * 10) / 10,
        weeklyBreakdown: weeks,
    }
}

/**
 * Calculate earnings from timesheet entries
 */
export function calculateTimesheetEarnings(entries: TimesheetEntry[]): number {
    return entries.reduce((total, entry) => {
        const hours = typeof entry.hours === 'string' ? parseFloat(entry.hours) : entry.hours
        const rate = entry.project?.hourlyRate
            ? typeof entry.project.hourlyRate === 'string'
                ? parseFloat(entry.project.hourlyRate)
                : entry.project.hourlyRate
            : 0
        return total + hours * rate
    }, 0)
}

/**
 * Get weekly hours chart data for the dashboard
 */
export function getWeeklyChartData(weekSummary: WeeklyHoursSummary): {
    name: string
    hours: number
}[] {
    return weekSummary.dailyBreakdown.map(day => ({
        name: day.dayName,
        hours: day.hours,
    }))
}
