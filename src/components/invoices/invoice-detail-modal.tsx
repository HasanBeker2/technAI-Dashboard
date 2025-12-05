'use client'

import { X, Download, Calendar, Building2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'

interface InvoiceItem {
    id: string
    description: string
    quantity: number
    rate: number
    amount: number
}

interface InvoiceDetail {
    id: string
    invoiceNumber: string
    status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED'
    issueDate: string
    dueDate: string
    subtotal: number
    vatAmount: number
    vatRate: number
    total: number
    notes?: string
    client: {
        id: string
        name: string
        email?: string
        address?: string
    }
    project?: {
        id: string
        name: string
    } | null
    items: InvoiceItem[]
}

interface InvoiceDetailModalProps {
    invoice: InvoiceDetail
    onClose: () => void
    onDownload: () => void
}

const statusVariants: Record<
    InvoiceDetail['status'],
    'default' | 'secondary' | 'success' | 'warning' | 'destructive'
> = {
    DRAFT: 'secondary',
    SENT: 'default',
    PAID: 'success',
    OVERDUE: 'destructive',
    CANCELLED: 'secondary',
}

const statusLabels: Record<InvoiceDetail['status'], string> = {
    DRAFT: 'Entwurf',
    SENT: 'Gesendet',
    PAID: 'Bezahlt',
    OVERDUE: 'Überfällig',
    CANCELLED: 'Storniert',
}

// Format address: street on first line, postal code and city on second line
const formatAddressLines = (address?: string) => {
    if (!address) return null
    const parts = address.split(',')
    if (parts.length >= 3) {
        const street = parts[0].trim()
        const postalCode = parts[1].trim()
        const city = parts[2].trim()
        return { line1: street, line2: `${postalCode} ${city}` }
    } else if (parts.length === 2) {
        return { line1: parts[0].trim(), line2: parts[1].trim() }
    }
    return { line1: address, line2: null }
}

export function InvoiceDetailModal({ invoice, onClose, onDownload }: InvoiceDetailModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-2xl mx-4">
                {/* Header */}
                <div className="sticky top-0 flex items-center justify-between border-b border-[hsl(var(--border))] bg-[hsl(var(--card))] px-6 py-4 z-10">
                    <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--primary)/0.1)]">
                            <FileText className="h-5 w-5 text-[hsl(var(--primary))]" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Rechnung Nr. {invoice.invoiceNumber}</h2>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={onDownload}>
                            <Download className="h-4 w-4" />
                            PDF herunterladen
                        </Button>
                        <button
                            onClick={onClose}
                            className="rounded-lg p-2 hover:bg-[hsl(var(--secondary))]"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Client & Dates */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Rechnungsempfänger</p>
                            <div className="flex items-start gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(var(--secondary))]">
                                    <Building2 className="h-5 w-5 text-[hsl(var(--muted-foreground))]" />
                                </div>
                                <div>
                                    <p className="font-semibold">{invoice.client.name}</p>
                                    {(() => {
                                        const addr = formatAddressLines(invoice.client.address)
                                        if (!addr) return null
                                        return (
                                            <>
                                                <p className="text-sm text-[hsl(var(--muted-foreground))]">{addr.line1}</p>
                                                {addr.line2 && <p className="text-sm text-[hsl(var(--muted-foreground))]">{addr.line2}</p>}
                                            </>
                                        )
                                    })()}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <Calendar className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                                <div>
                                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Rechnungsdatum</p>
                                    <p className="font-medium">{formatDate(invoice.issueDate)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Calendar className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                                <div>
                                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Fälligkeitsdatum</p>
                                    <p className="font-medium">{formatDate(invoice.dueDate)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="rounded-lg border border-[hsl(var(--border))] overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-[hsl(var(--secondary)/0.3)]">
                                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                                        Beschreibung
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                                        Stundensatz
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                                        Stunden
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                                        Betrag
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.items.map((item, index) => (
                                    <tr
                                        key={item.id}
                                        className={`border-b border-[hsl(var(--border))] ${index === invoice.items.length - 1 ? 'border-b-0' : ''}`}
                                    >
                                        <td className="px-4 py-3">{item.description}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(item.rate)}/Std.</td>
                                        <td className="px-4 py-3 text-center">{item.quantity}</td>
                                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(item.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="border-t border-[hsl(var(--border))]">
                                    <td></td>
                                    <td></td>
                                    <td className="px-4 py-3 text-right text-sm text-[hsl(var(--muted-foreground))]">Zwischensumme</td>
                                    <td className="px-4 py-3 text-right text-sm">{formatCurrency(invoice.subtotal)}</td>
                                </tr>
                                <tr>
                                    <td></td>
                                    <td></td>
                                    <td className="px-4 py-3 text-right text-sm text-[hsl(var(--muted-foreground))]">MwSt. ({invoice.vatRate}%)</td>
                                    <td className="px-4 py-3 text-right text-sm">{formatCurrency(invoice.vatAmount)}</td>
                                </tr>
                                <tr className="border-t-2 border-[hsl(var(--primary))]">
                                    <td></td>
                                    <td></td>
                                    <td className="px-4 py-3 text-right text-lg font-bold">Gesamtbetrag</td>
                                    <td className="px-4 py-3 text-right text-lg font-bold text-[hsl(var(--primary))]">{formatCurrency(invoice.total)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Notes */}
                    {invoice.notes && (
                        <div className="rounded-lg bg-[hsl(var(--secondary)/0.3)] p-4">
                            <p className="text-sm font-medium text-[hsl(var(--muted-foreground))] mb-2">Anmerkungen</p>
                            <p className="text-sm">{invoice.notes}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
