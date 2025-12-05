'use client'

import { cn, formatCurrency } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
    title: string
    value: string | number
    subtitle?: string
    icon?: LucideIcon
    trend?: {
        value: number
        isPositive: boolean
    }
    variant?: 'default' | 'primary' | 'success' | 'warning'
    className?: string
}

export function StatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    variant = 'default',
    className,
}: StatCardProps) {
    const formattedValue =
        typeof value === 'number' ? formatCurrency(value) : value

    const variantStyles = {
        default: 'border-[hsl(var(--border))]',
        primary: 'border-[hsl(var(--primary)/0.3)] glow-sm',
        success: 'border-[hsl(var(--success)/0.3)]',
        warning: 'border-[hsl(var(--warning)/0.3)]',
    }

    const iconBgStyles = {
        default: 'bg-[hsl(var(--secondary))]',
        primary: 'bg-[hsl(var(--primary)/0.1)]',
        success: 'bg-[hsl(var(--success)/0.1)]',
        warning: 'bg-[hsl(var(--warning)/0.1)]',
    }

    const iconColorStyles = {
        default: 'text-[hsl(var(--muted-foreground))]',
        primary: 'text-[hsl(var(--primary))]',
        success: 'text-[hsl(var(--success))]',
        warning: 'text-[hsl(var(--warning))]',
    }

    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-xl border bg-[hsl(var(--card))] p-6 shadow-lg transition-all duration-300 hover:shadow-xl',
                variantStyles[variant],
                className
            )}
        >
            {/* Background gradient effect */}
            {variant === 'primary' && (
                <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--primary)/0.05)] to-transparent" />
            )}

            <div className="relative flex items-start justify-between">
                <div className="space-y-2">
                    <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">
                        {title}
                    </p>
                    <p
                        className={cn(
                            'text-3xl font-bold tracking-tight',
                            variant === 'primary' && 'gradient-text'
                        )}
                    >
                        {formattedValue}
                    </p>
                    {subtitle && (
                        <p className="text-sm text-[hsl(var(--muted-foreground))]">
                            {subtitle}
                        </p>
                    )}
                    {trend && (
                        <div className="flex items-center gap-1 pt-1">
                            <span
                                className={cn(
                                    'text-sm font-medium',
                                    trend.isPositive
                                        ? 'text-[hsl(var(--success))]'
                                        : 'text-[hsl(var(--destructive))]'
                                )}
                            >
                                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value).toFixed(1)}%
                            </span>
                            <span className="text-xs text-[hsl(var(--muted-foreground))]">
                                from last month
                            </span>
                        </div>
                    )}
                </div>

                {Icon && (
                    <div
                        className={cn(
                            'rounded-lg p-3',
                            iconBgStyles[variant]
                        )}
                    >
                        <Icon className={cn('h-6 w-6', iconColorStyles[variant])} />
                    </div>
                )}
            </div>

            {/* Decorative line */}
            <div
                className={cn(
                    'absolute bottom-0 left-0 right-0 h-1',
                    variant === 'primary' &&
                    'bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--chart-4))]',
                    variant === 'success' && 'bg-[hsl(var(--success))]',
                    variant === 'warning' && 'bg-[hsl(var(--warning))]'
                )}
            />
        </div>
    )
}
