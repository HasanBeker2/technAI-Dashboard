'use client'

import { useState, useEffect, useCallback } from 'react'
import { InvoiceTable } from '@/components/invoices/invoice-table'
import { InvoiceForm } from '@/components/forms/invoice-form'
import { InvoiceDetailModal } from '@/components/invoices/invoice-detail-modal'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Download, FileText } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { generateInvoicePDF } from '@/lib/invoice-pdf'

interface Invoice {
    id: string
    invoiceNumber: string
    status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
    issueDate: string
    dueDate: string
    subtotal: number
    vatAmount: number
    total: number
    items?: any
    notes?: string | null
    client: { id: string; name: string }
    project: { id: string; name: string } | null
}

interface Client {
    id: string
    name: string
}

interface Project {
    id: string
    name: string
    clientId: string
    hourlyRate: number
}

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [clients, setClients] = useState<Client[]>([])
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<string>('all')

    // Modal states
    const [showInvoiceForm, setShowInvoiceForm] = useState(false)
    const [editTarget, setEditTarget] = useState<Invoice | null>(null)
    const [viewTarget, setViewTarget] = useState<any>(null)
    const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const fetchInvoices = useCallback(async () => {
        try {
            const res = await fetch('/api/invoices')
            if (res.ok) {
                const data = await res.json()
                setInvoices(data)
            }
        } catch (error) {
            console.error('Error fetching invoices:', error)
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

    const fetchProjects = useCallback(async () => {
        try {
            const res = await fetch('/api/projects')
            if (res.ok) {
                const data = await res.json()
                setProjects(data.map((p: { id: string; name: string; hourlyRate: number; client: { id: string } }) => ({
                    id: p.id,
                    name: p.name,
                    clientId: p.client.id,
                    hourlyRate: Number(p.hourlyRate),
                })))
            }
        } catch (error) {
            console.error('Error fetching projects:', error)
        }
    }, [])

    useEffect(() => {
        fetchInvoices()
        fetchClients()
        fetchProjects()
    }, [fetchInvoices, fetchClients, fetchProjects])

    const filteredInvoices = invoices.filter((invoice) => {
        const matchesSearch =
            invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            invoice.client.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus =
            statusFilter === 'all' || invoice.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const handleCreateInvoice = async (data: {
        clientId: string
        projectId?: string
        issueDate: string
        dueDate: string
        items: { description: string; quantity: number; rate: number; amount: number }[]
        vatRate: number
        notes?: string
        status: 'DRAFT' | 'SENT'
        servicePeriodStart?: string
        servicePeriodEnd?: string
    }) => {
        try {
            const res = await fetch('/api/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (res.ok) {
                setShowInvoiceForm(false)
                fetchInvoices()
            } else {
                const error = await res.json()
                alert(`Error: ${error.error || 'Failed to create invoice'}`)
            }
        } catch (error) {
            console.error('Error creating invoice:', error)
            alert('Failed to create invoice')
        }
    }

    const handleDeleteInvoice = async () => {
        if (!deleteTarget) return
        setIsDeleting(true)
        try {
            const res = await fetch(`/api/invoices/${deleteTarget.id}`, {
                method: 'DELETE',
            })
            if (res.ok) {
                setDeleteTarget(null)
                fetchInvoices()
            } else {
                const error = await res.json()
                alert(`Error: ${error.error || 'Failed to delete invoice'}`)
            }
        } catch (error) {
            console.error('Error deleting invoice:', error)
            alert('Failed to delete invoice')
        } finally {
            setIsDeleting(false)
        }
    }

    const handleUpdateStatus = async (id: string, status: string) => {
        try {
            const res = await fetch(`/api/invoices/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            })
            if (res.ok) {
                fetchInvoices()
            } else {
                const error = await res.json()
                alert(`Error: ${error.error || 'Failed to update invoice'}`)
            }
        } catch (error) {
            console.error('Error updating invoice:', error)
            alert('Failed to update invoice')
        }
    }

    const handleViewInvoice = async (id: string) => {
        try {
            const res = await fetch(`/api/invoices/${id}`)
            if (res.ok) {
                const data = await res.json()
                setViewTarget(data)
            } else {
                alert('Failed to load invoice details')
            }
        } catch (error) {
            console.error('Error fetching invoice:', error)
            alert('Failed to load invoice details')
        }
    }

    const handleDownloadInvoice = async (id: string) => {
        try {
            const res = await fetch(`/api/invoices/${id}?includeTimesheets=true`)
            if (res.ok) {
                const data = await res.json()
                generateInvoicePDF(data)
            } else {
                alert('Failed to generate PDF')
            }
        } catch (error) {
            console.error('Error generating PDF:', error)
            alert('Failed to generate PDF')
        }
    }

    const handleEditInvoice = async (id: string) => {
        try {
            const res = await fetch(`/api/invoices/${id}`)
            if (res.ok) {
                const invoice = await res.json()
                setEditTarget(invoice)
                setShowInvoiceForm(true)
            } else {
                alert('Failed to load invoice details')
            }
        } catch (error) {
            console.error('Error fetching invoice:', error)
            alert('Failed to load invoice details')
        }
    }

    const totalPending = invoices
        .filter((inv) => inv.status === 'SENT' || inv.status === 'OVERDUE')
        .reduce((sum, inv) => sum + Number(inv.total), 0)

    const totalPaid = invoices
        .filter((inv) => inv.status === 'PAID')
        .reduce((sum, inv) => sum + Number(inv.total), 0)

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
                    <h1 className="text-3xl font-bold">Invoices</h1>
                    <p className="mt-1 text-[hsl(var(--muted-foreground))]">
                        Create and manage invoices for your clients.
                    </p>
                </div>
                <div className="flex gap-3">
                    <Button onClick={() => {
                        setEditTarget(null)
                        setShowInvoiceForm(true)
                    }}>
                        <Plus className="h-4 w-4" />
                        New Invoice
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                    <Input
                        placeholder="Search invoices..."
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
                    <option value="DRAFT">Draft</option>
                    <option value="SENT">Sent</option>
                    <option value="PAID">Paid</option>
                    <option value="OVERDUE">Overdue</option>
                    <option value="CANCELLED">Cancelled</option>
                </select>
            </div>

            {/* Stats Summary */}
            <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Total Invoices</p>
                    <p className="text-2xl font-bold">{invoices.length}</p>
                </div>
                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Pending Payment</p>
                    <p className="text-2xl font-bold text-[hsl(var(--warning))]">
                        {formatCurrency(totalPending)}
                    </p>
                </div>
                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Paid</p>
                    <p className="text-2xl font-bold text-[hsl(var(--success))]">
                        {formatCurrency(totalPaid)}
                    </p>
                </div>
                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Overdue</p>
                    <p className="text-2xl font-bold text-[hsl(var(--destructive))]">
                        {invoices.filter((inv) => inv.status === 'OVERDUE').length}
                    </p>
                </div>
            </div>

            {/* Invoice List or Empty State */}
            {invoices.length === 0 ? (
                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-12 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-[hsl(var(--primary)/0.1)] flex items-center justify-center mb-4">
                        <FileText className="h-8 w-8 text-[hsl(var(--primary))]" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No invoices yet</h3>
                    <p className="text-[hsl(var(--muted-foreground))] mb-4">
                        Create your first invoice to start billing clients.
                    </p>
                    <Button onClick={() => {
                        setEditTarget(null)
                        setShowInvoiceForm(true)
                    }}>
                        <Plus className="h-4 w-4" />
                        Create Invoice
                    </Button>
                </div>
            ) : (
                <InvoiceTable
                    invoices={filteredInvoices.map(inv => ({
                        ...inv,
                        subtotal: Number(inv.subtotal),
                        vatAmount: Number(inv.vatAmount),
                        total: Number(inv.total),
                    }))}
                    onView={handleViewInvoice}
                    onEdit={handleEditInvoice}
                    onDelete={(id) => {
                        const invoice = invoices.find(i => i.id === id)
                        if (invoice) {
                            setDeleteTarget(invoice)
                        }
                    }}
                    onDownload={handleDownloadInvoice}
                />
            )}

            {/* Invoice Form Modal */}
            {showInvoiceForm && (
                <InvoiceForm
                    clients={clients}
                    projects={projects}
                    onSubmit={handleCreateInvoice}
                    onCancel={() => {
                        setShowInvoiceForm(false)
                        setEditTarget(null)
                    }}
                    initialData={editTarget ? {
                        clientId: editTarget.client.id,
                        projectId: editTarget.project?.id,
                        issueDate: editTarget.issueDate.split('T')[0],
                        dueDate: editTarget.dueDate.split('T')[0],
                        items: editTarget.items as any,
                        vatRate: Number(editTarget.vatAmount) / Number(editTarget.subtotal) * 100,
                        notes: editTarget.notes || undefined,
                    } : undefined}
                />
            )}

            {/* Invoice Detail Modal */}
            {viewTarget && (
                <InvoiceDetailModal
                    invoice={viewTarget}
                    onClose={() => setViewTarget(null)}
                    onDownload={() => {
                        handleDownloadInvoice(viewTarget.id)
                    }}
                />
            )}

            {/* Delete Confirmation Dialog */}
            {deleteTarget && (
                <ConfirmDialog
                    title="Delete Invoice"
                    message={`Are you sure you want to delete invoice "${deleteTarget.invoiceNumber}"? This action cannot be undone.`}
                    confirmText="Delete"
                    cancelText="Cancel"
                    variant="danger"
                    onConfirm={handleDeleteInvoice}
                    onCancel={() => setDeleteTarget(null)}
                    isLoading={isDeleting}
                />
            )}
        </div>
    )
}
