'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'

interface TimesheetFormProps {
    projects: { id: string; name: string; clientName: string }[]
    onSubmit: (data: {
        projectId: string
        date: string
        hours: number
        description?: string
    }) => void
    onCancel: () => void
    initialData?: {
        projectId: string
        date: string
        hours: number
        description?: string
    }
}

export function TimesheetForm({
    projects,
    onSubmit,
    onCancel,
    initialData,
}: TimesheetFormProps) {
    const today = new Date().toISOString().split('T')[0]

    const [formData, setFormData] = useState({
        projectId: initialData?.projectId || '',
        date: initialData?.date || today,
        hours: initialData?.hours?.toString() || '',
        description: initialData?.description || '',
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit({
            projectId: formData.projectId,
            date: formData.date,
            hours: parseFloat(formData.hours),
            description: formData.description || undefined,
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-2xl animate-fade-in">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                        {initialData ? 'Edit Time Entry' : 'Add Hours'}
                    </h2>
                    <button
                        onClick={onCancel}
                        className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium">Project</label>
                        <select
                            value={formData.projectId}
                            onChange={(e) =>
                                setFormData({ ...formData, projectId: e.target.value })
                            }
                            className="flex h-10 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.5)]"
                            required
                        >
                            <option value="">Select a project</option>
                            {projects.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.name} - {project.clientName}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium">Date</label>
                            <Input
                                type="date"
                                value={formData.date}
                                onChange={(e) =>
                                    setFormData({ ...formData, date: e.target.value })
                                }
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium">Hours</label>
                            <Input
                                type="number"
                                step="0.25"
                                min="0.25"
                                max="24"
                                value={formData.hours}
                                onChange={(e) =>
                                    setFormData({ ...formData, hours: e.target.value })
                                }
                                placeholder="8"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">
                            Description (optional)
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            placeholder="What did you work on?"
                            rows={3}
                            className="flex w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.5)]"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1">
                            {initialData ? 'Update Entry' : 'Add Hours'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
