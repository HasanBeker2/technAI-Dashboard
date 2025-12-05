'use client'

import { formatCurrency, formatHours, cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { MoreHorizontal, Edit, Trash2, Eye } from 'lucide-react'

interface Project {
    id: string
    name: string
    description?: string | null
    hourlyRate: number
    estimatedHours?: number | null
    status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'ARCHIVED'
    client: {
        id: string
        name: string
    }
    totalHours: number
    earnings: number
}

interface ProjectListProps {
    projects: Project[]
    onView?: (id: string) => void
    onEdit?: (id: string) => void
    onDelete?: (id: string) => void
}

const statusVariants: Record<
    Project['status'],
    'default' | 'secondary' | 'success' | 'warning'
> = {
    ACTIVE: 'default',
    COMPLETED: 'success',
    ON_HOLD: 'warning',
    ARCHIVED: 'secondary',
}

const statusLabels: Record<Project['status'], string> = {
    ACTIVE: 'Active',
    COMPLETED: 'Completed',
    ON_HOLD: 'On Hold',
    ARCHIVED: 'Archived',
}

export function ProjectList({
    projects,
    onView,
    onEdit,
    onDelete,
}: ProjectListProps) {
    if (projects.length === 0) {
        return (
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-12 text-center">
                <p className="text-[hsl(var(--muted-foreground))]">No projects found</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {projects.map((project) => {
                const progress = project.estimatedHours
                    ? Math.min((project.totalHours / project.estimatedHours) * 100, 100)
                    : null

                return (
                    <div
                        key={project.id}
                        className="group rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 transition-all duration-200 hover:border-[hsl(var(--primary)/0.3)] hover:shadow-lg"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3">
                                    <h3 className="font-semibold text-lg group-hover:text-[hsl(var(--primary))] transition-colors">
                                        {project.name}
                                    </h3>
                                    <Badge variant={statusVariants[project.status]}>
                                        {statusLabels[project.status]}
                                    </Badge>
                                </div>
                                <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                                    Client: {project.client.name}
                                </p>
                                {project.description && (
                                    <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))] line-clamp-2">
                                        {project.description}
                                    </p>
                                )}
                            </div>

                            {/* Actions dropdown */}
                            <div className="relative">
                                <button className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] opacity-0 group-hover:opacity-100 hover:bg-[hsl(var(--secondary))] transition-all">
                                    <MoreHorizontal className="h-5 w-5" />
                                </button>
                                {/* Dropdown menu would go here */}
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="mt-4 grid grid-cols-4 gap-4">
                            <div>
                                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                    Hours Worked
                                </p>
                                <p className="text-lg font-semibold">
                                    {formatHours(project.totalHours)}
                                    {project.estimatedHours && (
                                        <span className="text-sm text-[hsl(var(--muted-foreground))] font-normal">
                                            {' '}
                                            / {formatHours(project.estimatedHours)}
                                        </span>
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                    Hourly Rate
                                </p>
                                <p className="text-lg font-semibold">
                                    {formatCurrency(project.hourlyRate)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                    Earnings
                                </p>
                                <p className="text-lg font-semibold gradient-text">
                                    {formatCurrency(project.earnings)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                    Progress
                                </p>
                                {progress !== null ? (
                                    <div className="mt-1.5">
                                        <div className="progress-bar h-2">
                                            <div
                                                className="progress-bar-fill"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                                            {Math.round(progress)}%
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-lg font-semibold">-</p>
                                )}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {onView && (
                                <button
                                    onClick={() => onView(project.id)}
                                    className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]"
                                >
                                    <Eye className="h-3.5 w-3.5" />
                                    View
                                </button>
                            )}
                            {onEdit && (
                                <button
                                    onClick={() => onEdit(project.id)}
                                    className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]"
                                >
                                    <Edit className="h-3.5 w-3.5" />
                                    Edit
                                </button>
                            )}
                            {onDelete && (
                                <button
                                    onClick={() => onDelete(project.id)}
                                    className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.1)]"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Delete
                                </button>
                            )}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
