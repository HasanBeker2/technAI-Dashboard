'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'

interface ProjectFormProps {
    clients: { id: string; name: string }[]
    onSubmit: (data: {
        name: string
        description: string
        hourlyRate: number
        estimatedHours?: number
        clientId: string
    }) => void
    onCancel: () => void
    initialData?: {
        name: string
        description?: string
        hourlyRate: number
        estimatedHours?: number
        clientId: string
    }
}

export function ProjectForm({
    clients,
    onSubmit,
    onCancel,
    initialData,
}: ProjectFormProps) {
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        description: initialData?.description || '',
        hourlyRate: initialData?.hourlyRate?.toString() || '',
        estimatedHours: initialData?.estimatedHours?.toString() || '',
        clientId: initialData?.clientId || '',
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit({
            name: formData.name,
            description: formData.description,
            hourlyRate: parseFloat(formData.hourlyRate),
            estimatedHours: formData.estimatedHours
                ? parseFloat(formData.estimatedHours)
                : undefined,
            clientId: formData.clientId,
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-2xl animate-fade-in">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                        {initialData ? 'Edit Project' : 'Create New Project'}
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
                        <label className="mb-2 block text-sm font-medium">Project Name</label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="AI Recommendation Engine"
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">Client</label>
                        <select
                            value={formData.clientId}
                            onChange={(e) =>
                                setFormData({ ...formData, clientId: e.target.value })
                            }
                            className="flex h-10 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.5)]"
                            required
                        >
                            <option value="">Select a client</option>
                            {clients.map((client) => (
                                <option key={client.id} value={client.id}>
                                    {client.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            placeholder="Project description..."
                            rows={3}
                            className="flex w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.5)]"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Hourly Rate (€)
                            </label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.hourlyRate}
                                onChange={(e) =>
                                    setFormData({ ...formData, hourlyRate: e.target.value })
                                }
                                placeholder="150.00"
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Estimated Hours
                            </label>
                            <Input
                                type="number"
                                step="0.5"
                                min="0"
                                value={formData.estimatedHours}
                                onChange={(e) =>
                                    setFormData({ ...formData, estimatedHours: e.target.value })
                                }
                                placeholder="200"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1">
                            {initialData ? 'Update Project' : 'Create Project'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
