'use client'

import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, Edit, Trash2, Download, MoreHorizontal } from 'lucide-react'

interface Invoice {
    id: string
    invoiceNumber: string
    status: 'DRAFT' | 'PENDING' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
    issueDate: string | Date
    dueDate: string | Date
    subtotal: number
    vatAmount: number
    total: number
    client: {
        id: string
        name: string
    }
    project?: {
        id: string
        name: string
    } | null
}

interface InvoiceTableProps {
    invoices: Invoice[]
    onView?: (id: string) => void
    onEdit?: (id: string) => void
    onDelete?: (id: string) => void
    onDownload?: (id: string) => void
    onStatusChange?: (id: string, currentStatus: Invoice['status']) => void
}

const statusVariants: Record<
    Invoice['status'],
    'default' | 'secondary' | 'success' | 'warning' | 'destructive'
> = {
    DRAFT: 'secondary',
    PENDING: 'warning',
    SENT: 'default',
    PAID: 'success',
    OVERDUE: 'destructive',
    CANCELLED: 'secondary',
}

const statusLabels: Record<Invoice['status'], string> = {
    DRAFT: 'Draft',
    PENDING: 'Pending',
    SENT: 'Sent',
    PAID: 'Paid',
    OVERDUE: 'Overdue',
    CANCELLED: 'Cancelled',
}

export function InvoiceTable({
    invoices,
    onView,
    onEdit,
    onDelete,
    onDownload,
    onStatusChange,
}: InvoiceTableProps) {
    const handleStatusClick = (invoice: Invoice) => {
        if (!onStatusChange) return
        // Only allow progression for PENDING and SENT
        if (invoice.status === 'PENDING' || invoice.status === 'SENT') {
            onStatusChange(invoice.id, invoice.status)
        }
    }

    const isStatusClickable = (status: Invoice['status']) => {
        return status === 'PENDING' || status === 'SENT'
    }
    if (invoices.length === 0) {
        return (
            <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-12 text-center">
                <p className="text-[hsl(var(--muted-foreground))]">No invoices found</p>
            </div>
        )
    }

    return (
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
            <table className="w-full">
                <thead>
                    <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.3)]">
                        <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                            Invoice
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                            Client
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                            Amount
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                            Due Date
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                            Status
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {invoices.map((invoice, index) => (
                        <tr
                            key={invoice.id}
                            className={`group border-b border-[hsl(var(--border))] transition-colors hover:bg-[hsl(var(--secondary)/0.3)] ${index === invoices.length - 1 ? 'border-b-0' : ''
                                }`}
                        >
                            <td className="px-6 py-4">
                                <div>
                                    <p className="font-mono text-sm font-medium text-[hsl(var(--primary))]">
                                        #{invoice.invoiceNumber}
                                    </p>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                        Issued {formatDate(invoice.issueDate)}
                                    </p>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div>
                                    <p className="font-medium">{invoice.client.name}</p>
                                    {invoice.project && (
                                        <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                            {invoice.project.name}
                                        </p>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div>
                                    <p className="font-semibold">{formatCurrency(invoice.total)}</p>
                                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                        incl. {formatCurrency(invoice.vatAmount)} VAT
                                    </p>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <p className="text-sm">{formatDate(invoice.dueDate)}</p>
                            </td>
                            <td className="px-6 py-4">
                                <Badge
                                    variant={statusVariants[invoice.status]}
                                    className={isStatusClickable(invoice.status) && onStatusChange ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}
                                    onClick={() => handleStatusClick(invoice)}
                                >
                                    {statusLabels[invoice.status]}
                                </Badge>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center justify-end gap-1">
                                    {onView && (
                                        <button
                                            onClick={() => onView(invoice.id)}
                                            className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]"
                                            title="View"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </button>
                                    )}
                                    {onDownload && (
                                        <button
                                            onClick={() => onDownload(invoice.id)}
                                            className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]"
                                            title="Download PDF"
                                        >
                                            <Download className="h-4 w-4" />
                                        </button>
                                    )}
                                    {onEdit && (
                                        <button
                                            onClick={() => onEdit(invoice.id)}
                                            className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]"
                                            title="Edit"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                    )}
                                    {onDelete && (
                                        <button
                                            onClick={() => onDelete(invoice.id)}
                                            className="rounded-lg p-2 text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.1)]"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
