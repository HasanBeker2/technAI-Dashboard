'use client'

import { formatCurrency, formatDate } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

interface PendingInvoice {
    id: string
    invoiceNumber: string
    clientName: string
    total: number
    dueDate: string | Date
    status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
}

interface PendingInvoicesListProps {
    invoices: PendingInvoice[]
}

const statusVariants: Record<
    PendingInvoice['status'],
    'default' | 'secondary' | 'success' | 'warning' | 'destructive'
> = {
    DRAFT: 'secondary',
    SENT: 'default',
    PAID: 'success',
    OVERDUE: 'destructive',
    CANCELLED: 'secondary',
}

const statusLabels: Record<PendingInvoice['status'], string> = {
    DRAFT: 'Draft',
    SENT: 'Sent',
    PAID: 'Paid',
    OVERDUE: 'Overdue',
    CANCELLED: 'Cancelled',
}

export function PendingInvoicesList({ invoices }: PendingInvoicesListProps) {
    return (
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-lg">
            <div className="mb-4">
                <h3 className="text-lg font-semibold">Pending Invoices</h3>
            </div>

            {invoices.length === 0 ? (
                <div className="py-8 text-center text-[hsl(var(--muted-foreground))]">
                    <p>No pending invoices</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {invoices.map((invoice) => (
                        <div
                            key={invoice.id}
                            className="group flex items-center justify-between rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.3)] p-4 transition-all duration-200 hover:border-[hsl(var(--primary)/0.3)] hover:bg-[hsl(var(--secondary)/0.5)]"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="font-mono text-sm text-[hsl(var(--primary))]">
                                        #{invoice.invoiceNumber}
                                    </span>
                                    <span className="text-sm font-medium truncate">
                                        {invoice.clientName}
                                    </span>
                                </div>
                                <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                                    Due {formatDate(invoice.dueDate)}
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <span className="font-semibold">
                                    {formatCurrency(invoice.total)}
                                </span>
                                <Badge variant={statusVariants[invoice.status]}>
                                    {statusLabels[invoice.status]}
                                </Badge>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <button className="mt-4 w-full rounded-lg border border-[hsl(var(--border))] bg-transparent py-2 text-sm font-medium text-[hsl(var(--primary))] transition-all duration-200 hover:bg-[hsl(var(--primary)/0.1)] hover:border-[hsl(var(--primary)/0.3)]">
                View All Invoices
            </button>
        </div>
    )
}
