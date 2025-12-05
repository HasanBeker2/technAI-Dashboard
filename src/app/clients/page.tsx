'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Plus, Search, Edit, Trash2, Building2, Mail, Phone, MapPin } from 'lucide-react'

interface Client {
    id: string
    name: string
    email: string | null
    phone: string | null
    address: string | null
    _count: {
        projects: number
        invoices: number
    }
}

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    // Modal states
    const [showClientForm, setShowClientForm] = useState(false)
    const [editingClient, setEditingClient] = useState<Client | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
    })

    const fetchClients = useCallback(async () => {
        try {
            const res = await fetch('/api/clients')
            if (res.ok) {
                const data = await res.json()
                setClients(data)
            }
        } catch (error) {
            console.error('Error fetching clients:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchClients()
    }, [fetchClients])

    const filteredClients = clients.filter((client) =>
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleOpenForm = (client?: Client) => {
        if (client) {
            setEditingClient(client)
            setFormData({
                name: client.name,
                email: client.email || '',
                phone: client.phone || '',
                address: client.address || '',
            })
        } else {
            setEditingClient(null)
            setFormData({ name: '', email: '', phone: '', address: '' })
        }
        setShowClientForm(true)
    }

    const handleCloseForm = () => {
        setShowClientForm(false)
        setEditingClient(null)
        setFormData({ name: '', email: '', phone: '', address: '' })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients'
            const method = editingClient ? 'PUT' : 'POST'

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email || undefined,
                    phone: formData.phone || undefined,
                    address: formData.address || undefined,
                }),
            })

            if (res.ok) {
                handleCloseForm()
                fetchClients()
            } else {
                const error = await res.json()
                alert(`Error: ${error.error || 'Operation failed'}`)
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Operation failed')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        setIsDeleting(true)

        try {
            const res = await fetch(`/api/clients/${deleteTarget.id}`, {
                method: 'DELETE',
            })

            if (res.ok) {
                setDeleteTarget(null)
                fetchClients()
            } else {
                const error = await res.json()
                alert(`Error: ${error.error || 'Failed to delete client'}`)
            }
        } catch (error) {
            console.error('Error:', error)
            alert('Failed to delete client')
        } finally {
            setIsDeleting(false)
        }
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
                    <h1 className="text-3xl font-bold">Clients</h1>
                    <p className="mt-1 text-[hsl(var(--muted-foreground))]">
                        Manage your clients and their contact information.
                    </p>
                </div>
                <Button onClick={() => handleOpenForm()}>
                    <Plus className="h-4 w-4" />
                    Add Client
                </Button>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                <Input
                    placeholder="Search clients..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Total Clients</p>
                    <p className="text-2xl font-bold">{clients.length}</p>
                </div>
                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Active Projects</p>
                    <p className="text-2xl font-bold text-[hsl(var(--primary))]">
                        {clients.reduce((sum, c) => sum + c._count.projects, 0)}
                    </p>
                </div>
                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Total Invoices</p>
                    <p className="text-2xl font-bold">
                        {clients.reduce((sum, c) => sum + c._count.invoices, 0)}
                    </p>
                </div>
            </div>

            {/* Client List or Empty State */}
            {clients.length === 0 ? (
                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-12 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-[hsl(var(--primary)/0.1)] flex items-center justify-center mb-4">
                        <Building2 className="h-8 w-8 text-[hsl(var(--primary))]" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No clients yet</h3>
                    <p className="text-[hsl(var(--muted-foreground))] mb-4">
                        Add your first client to start creating projects and invoices.
                    </p>
                    <Button onClick={() => handleOpenForm()}>
                        <Plus className="h-4 w-4" />
                        Add Client
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredClients.map((client) => (
                        <div
                            key={client.id}
                            className="group rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 transition-all hover:border-[hsl(var(--primary)/0.5)] hover:shadow-lg"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] flex items-center justify-center text-white font-semibold">
                                        {client.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">{client.name}</h3>
                                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                            {client._count.projects} projects • {client._count.invoices} invoices
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleOpenForm(client)}
                                        className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => setDeleteTarget(client)}
                                        className="rounded-lg p-2 text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.1)]"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm text-[hsl(var(--muted-foreground))]">
                                {client.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        <span>{client.email}</span>
                                    </div>
                                )}
                                {client.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        <span>{client.phone}</span>
                                    </div>
                                )}
                                {client.address && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        <span className="truncate">{client.address}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Client Form Modal */}
            {showClientForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-2xl animate-fade-in">
                        <h2 className="text-xl font-semibold mb-6">
                            {editingClient ? 'Edit Client' : 'Add New Client'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium">Company/Client Name *</label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Acme Corporation"
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium">Email</label>
                                <Input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="contact@acme.com"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium">Phone</label>
                                <Input
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+49 30 123456"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium">Address</label>
                                <Input
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    placeholder="123 Main St, Berlin, Germany"
                                />
                            </div>
                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCloseForm}
                                    className="flex-1"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                                    {isSubmitting ? 'Saving...' : editingClient ? 'Update Client' : 'Add Client'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deleteTarget && (
                <ConfirmDialog
                    title="Delete Client"
                    message={`Are you sure you want to delete "${deleteTarget.name}"? This will also delete all associated projects and invoices.`}
                    confirmText="Delete"
                    cancelText="Cancel"
                    variant="danger"
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteTarget(null)}
                    isLoading={isDeleting}
                />
            )}
        </div>
    )
}
