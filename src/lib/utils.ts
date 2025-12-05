import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Format a number as currency (EUR)
 */
export function formatCurrency(amount: number | string): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
    }).format(numAmount)
}

/**
 * Format a date for display
 */
export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return new Intl.DateTimeFormat('de-DE', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(d)
}

/**
 * Format hours with decimal
 */
export function formatHours(hours: number | string): string {
    const numHours = typeof hours === 'string' ? parseFloat(hours) : hours
    return `${numHours.toFixed(1)}h`
}
