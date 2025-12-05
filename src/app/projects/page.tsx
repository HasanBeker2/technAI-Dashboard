'use client'

import { useState, useEffect, useCallback } from 'react'
import { ProjectList } from '@/components/projects/project-list'
import { ProjectForm } from '@/components/forms/project-form'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search } from 'lucide-react'

interface Project {
    id: string
    name: string
    description: string | null
    hourlyRate: number
    estimatedHours: number | null
    status: 'ACTIVE' | 'COMPLETED' | 'ON_HOLD' | 'ARCHIVED'
    client: { id: string; name: string }
    totalHours: number
    earnings: number
}

interface Client {
    id: string
    name: string
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')

    // Modal states
    const [showProjectForm, setShowProjectForm] = useState(false)
    const [editingProject, setEditingProject] = useState<Project | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Project | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const fetchProjects = useCallback(async () => {
        try {
            const res = await fetch('/api/projects')
            if (res.ok) {
                const data = await res.json()
                setProjects(data)
            }
        } catch (error) {
            console.error('Error fetching projects:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchClients = useCallback(async () => {
        try {
            const res = await fetch('/api/clients')
            if (res.ok) {
                const data = await res.json()
                setClients(data)
            }
        } catch (error) {
            console.error('Error fetching clients:', error)
        }
    }, [])

    useEffect(() => {
        fetchProjects()
        fetchClients()
    }, [fetchProjects, fetchClients])

    const filteredProjects = projects.filter((project) => {
        const matchesSearch = project.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase())
        const matchesStatus =
            statusFilter === 'all' || project.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const handleCreateProject = async (data: {
        name: string
        description: string
        hourlyRate: number
        estimatedHours?: number
        clientId: string
    }) => {
        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    status: 'ACTIVE',
                    userId: 'default-user', // In a real app, this would come from auth
                }),
            })
            if (res.ok) {
                setShowProjectForm(false)
                fetchProjects()
            } else {
                const error = await res.json()
                alert(`Error: ${error.error || 'Failed to create project'}`)
            }
        } catch (error) {
            console.error('Error creating project:', error)
            alert('Failed to create project')
        }
    }

    const handleUpdateProject = async (data: {
        name: string
        description: string
        hourlyRate: number
        estimatedHours?: number
        clientId: string
    }) => {
        if (!editingProject) return
        try {
            const res = await fetch(`/api/projects/${editingProject.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (res.ok) {
                setEditingProject(null)
                fetchProjects()
            } else {
                const error = await res.json()
                alert(`Error: ${error.error || 'Failed to update project'}`)
            }
        } catch (error) {
            console.error('Error updating project:', error)
            alert('Failed to update project')
        }
    }

    const handleDeleteProject = async () => {
        if (!deleteTarget) return
        setIsDeleting(true)
        try {
            const res = await fetch(`/api/projects/${deleteTarget.id}`, {
                method: 'DELETE',
            })
            if (res.ok) {
                setDeleteTarget(null)
                fetchProjects()
            } else {
                const error = await res.json()
                alert(`Error: ${error.error || 'Failed to delete project'}`)
            }
        } catch (error) {
            console.error('Error deleting project:', error)
            alert('Failed to delete project')
        } finally {
            setIsDeleting(false)
        }
    }



    const stats = {
        total: projects.length,
        active: projects.filter((p) => p.status === 'ACTIVE').length,
        totalHours: projects.reduce((sum, p) => sum + p.totalHours, 0),
        totalEarnings: projects.reduce((sum, p) => sum + p.earnings, 0),
    }

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
                    <h1 className="text-3xl font-bold">Projects</h1>
                    <p className="mt-1 text-[hsl(var(--muted-foreground))]">
                        Manage your client projects and track progress.
                    </p>
                </div>
                <Button onClick={() => setShowProjectForm(true)}>
                    <Plus className="h-4 w-4" />
                    New Project
                </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                    <Input
                        placeholder="Search projects..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="h-10 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 text-sm focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.5)]"
                >
                    <option value="all">All Status</option>
                    <option value="ACTIVE">Active</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="ARCHIVED">Archived</option>
                </select>
            </div>

            {/* Stats Summary */}
            <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Total Projects</p>
                    <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Active</p>
                    <p className="text-2xl font-bold text-[hsl(var(--primary))]">
                        {stats.active}
                    </p>
                </div>
                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Total Hours</p>
                    <p className="text-2xl font-bold">{stats.totalHours}h</p>
                </div>
                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Total Earnings</p>
                    <p className="text-2xl font-bold gradient-text">
                        €{stats.totalEarnings.toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Project List or Empty State */}
            {projects.length === 0 ? (
                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-12 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-[hsl(var(--primary)/0.1)] flex items-center justify-center mb-4">
                        <Plus className="h-8 w-8 text-[hsl(var(--primary))]" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
                    <p className="text-[hsl(var(--muted-foreground))] mb-4">
                        Create your first project to start tracking time and earnings.
                    </p>
                    <Button onClick={() => setShowProjectForm(true)}>
                        <Plus className="h-4 w-4" />
                        Create Project
                    </Button>
                </div>
            ) : (
                <ProjectList
                    projects={filteredProjects.map(p => ({
                        ...p,
                        description: p.description || '',
                        estimatedHours: p.estimatedHours || 0,
                    }))}
                    onView={(id) => {
                        const project = projects.find(p => p.id === id)
                        if (project) {
                            setEditingProject(project)
                        }
                    }}
                    onEdit={(id) => {
                        const project = projects.find(p => p.id === id)
                        if (project) {
                            setEditingProject(project)
                        }
                    }}
                    onDelete={(id) => {
                        const project = projects.find(p => p.id === id)
                        if (project) {
                            setDeleteTarget(project)
                        }
                    }}
                />
            )}

            {/* Project Form Modal */}
            {(showProjectForm || editingProject) && (
                <ProjectForm
                    clients={clients}
                    onSubmit={editingProject ? handleUpdateProject : handleCreateProject}
                    onCancel={() => {
                        setShowProjectForm(false)
                        setEditingProject(null)
                    }}
                    initialData={
                        editingProject
                            ? {
                                name: editingProject.name,
                                description: editingProject.description || undefined,
                                hourlyRate: Number(editingProject.hourlyRate),
                                estimatedHours: editingProject.estimatedHours
                                    ? Number(editingProject.estimatedHours)
                                    : undefined,
                                clientId: editingProject.client.id,
                            }
                            : undefined
                    }
                />
            )}

            {/* Delete Confirmation Dialog */}
            {deleteTarget && (
                <ConfirmDialog
                    title="Delete Project"
                    message={`Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone and will also delete all associated timesheets.`}
                    confirmText="Delete"
                    cancelText="Cancel"
                    variant="danger"
                    onConfirm={handleDeleteProject}
                    onCancel={() => setDeleteTarget(null)}
                    isLoading={isDeleting}
                />
            )}


        </div>
    )
}
