'use client'

import { formatCurrency, formatHours } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface ProjectOverview {
    id: string
    name: string
    clientName: string
    hourlyRate: number
    totalHours: number
    estimatedHours: number | null
    earnings: number
    progress: number | null
}

interface ProjectsOverviewProps {
    projects: ProjectOverview[]
}

export function ProjectsOverview({ projects }: ProjectsOverviewProps) {
    return (
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-lg">
            <div className="mb-4">
                <h3 className="text-lg font-semibold">Projects Overview</h3>
            </div>

            {projects.length === 0 ? (
                <div className="py-8 text-center text-[hsl(var(--muted-foreground))]">
                    <p>No active projects</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                        <div
                            key={project.id}
                            className="group rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.3)] p-4 transition-all duration-200 hover:border-[hsl(var(--primary)/0.3)] hover:bg-[hsl(var(--secondary)/0.5)]"
                        >
                            <div className="mb-3">
                                <h4 className="font-semibold truncate group-hover:text-[hsl(var(--primary))] transition-colors">
                                    {project.name}
                                </h4>
                                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                                    Client: {project.clientName}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <p className="text-[hsl(var(--muted-foreground))]">Hours Worked</p>
                                    <p className="font-medium">
                                        {formatHours(project.totalHours)}
                                        {project.estimatedHours && (
                                            <span className="text-[hsl(var(--muted-foreground))]">
                                                {' '}
                                                / {formatHours(project.estimatedHours)}
                                            </span>
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[hsl(var(--muted-foreground))]">Hourly Rate</p>
                                    <p className="font-medium">{formatCurrency(project.hourlyRate)}</p>
                                </div>
                            </div>

                            {/* Progress bar */}
                            {project.progress !== null && (
                                <div className="mt-3">
                                    <div className="progress-bar h-2">
                                        <div
                                            className="progress-bar-fill"
                                            style={{ width: `${project.progress}%` }}
                                        />
                                    </div>
                                    <p className="mt-1 text-right text-xs text-[hsl(var(--muted-foreground))]">
                                        {project.progress}% complete
                                    </p>
                                </div>
                            )}

                            {/* Earnings */}
                            <div className="mt-3 pt-3 border-t border-[hsl(var(--border))]">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-[hsl(var(--muted-foreground))]">
                                        Earnings
                                    </span>
                                    <span className="font-semibold gradient-text">
                                        {formatCurrency(project.earnings)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
