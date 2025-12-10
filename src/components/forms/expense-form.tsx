'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Copy, Check, Sparkles } from 'lucide-react'
import { categoryGermanLabels, paymentMethodLabels, generateGermanFilename, calculateVatFromGross } from '@/lib/expense-utils'
import type { ExpenseCategory, PaymentMethod } from '@/lib/validations'

interface ExpenseFormData {
    vendorName: string
    vendorAddress?: string
    invoiceNumber?: string
    invoiceDate: string
    description: string
    category: ExpenseCategory
    amount: string
    vatRate: string
    vatAmount: string
    currency: string
    paymentDate?: string
    paymentMethod?: PaymentMethod
    driveUrl?: string
    notes?: string
    date: string
}

interface ExpenseFormProps {
    onSubmit: (data: any) => void
    onCancel: () => void
    initialData?: Partial<ExpenseFormData>
}

export function ExpenseForm({
    onSubmit,
    onCancel,
    initialData,
}: ExpenseFormProps) {
    const [formData, setFormData] = useState<ExpenseFormData>({
        vendorName: initialData?.vendorName || '',
        vendorAddress: initialData?.vendorAddress || '',
        invoiceNumber: initialData?.invoiceNumber || '',
        invoiceDate: initialData?.invoiceDate || new Date().toISOString().split('T')[0],
        description: initialData?.description || '',
        category: (initialData?.category as ExpenseCategory) || 'SOFTWARE',
        amount: initialData?.amount || '',
        vatRate: initialData?.vatRate || '19',
        vatAmount: initialData?.vatAmount || '',
        currency: initialData?.currency || 'EUR',
        paymentDate: initialData?.paymentDate || '',
        paymentMethod: initialData?.paymentMethod,
        driveUrl: initialData?.driveUrl || '',
        notes: initialData?.notes || '',
        date: initialData?.date || new Date().toISOString().split('T')[0],
    })

    const [suggestedFilename, setSuggestedFilename] = useState('')
    const [copied, setCopied] = useState(false)
    const [generatingFilename, setGeneratingFilename] = useState(false)

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit({
            vendorName: formData.vendorName,
            vendorAddress: formData.vendorAddress || undefined,
            invoiceNumber: formData.invoiceNumber || undefined,
            invoiceDate: formData.invoiceDate,
            description: formData.description,
            category: formData.category,
            amount: parseFloat(formData.amount),
            vatRate: parseFloat(formData.vatRate),
            vatAmount: parseFloat(formData.vatAmount),
            currency: formData.currency,
            paymentDate: formData.paymentDate || undefined,
            paymentMethod: formData.paymentMethod || undefined,
            driveUrl: formData.driveUrl || undefined,
            notes: formData.notes || undefined,
            date: formData.date,
        })
    }

    const handleAmountChange = (value: string) => {
        const amount = parseFloat(value)
        const vatRate = parseFloat(formData.vatRate) || 19

        if (!isNaN(amount) && !isNaN(vatRate)) {
            const { vatAmount } = calculateVatFromGross(amount, vatRate)
            setFormData({
                ...formData,
                amount: value,
                vatAmount: vatAmount.toFixed(2),
            })
        } else {
            setFormData({
                ...formData,
                amount: value,
                vatAmount: '',
            })
        }
    }

    const handleGenerateFilename = async () => {
        if (!formData.invoiceDate || !formData.category || !formData.vendorName) {
            alert('Bitte füllen Sie Rechnungsdatum, Kategorie und Lieferantenname aus')
            return
        }

        setGeneratingFilename(true)
        try {
            const filename = generateGermanFilename(
                formData.invoiceDate,
                formData.category,
                formData.vendorName,
                'pdf'
            )
            setSuggestedFilename(filename)
        } catch (error) {
            console.error('Error generating filename:', error)
        } finally {
            setGeneratingFilename(false)
        }
    }

    const handleCopyFilename = () => {
        navigator.clipboard.writeText(suggestedFilename)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto p-4">
            <div className="w-full max-w-3xl rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-2xl animate-fade-in my-8">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                        {initialData ? 'Edit Expense' : 'Add New Expense'}
                    </h2>
                    <button
                        onClick={onCancel}
                        className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Vendor Information */}
                    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.3)] p-4">
                        <h3 className="mb-3 font-medium">Vendor Information</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Company Name *
                                </label>
                                <Input
                                    value={formData.vendorName}
                                    onChange={(e) =>
                                        setFormData({ ...formData, vendorName: e.target.value })
                                    }
                                    placeholder="MediaMarkt"
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Company Address
                                </label>
                                <Input
                                    value={formData.vendorAddress}
                                    onChange={(e) =>
                                        setFormData({ ...formData, vendorAddress: e.target.value })
                                    }
                                    placeholder="Musterstraße 1, 12345 Berlin"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Invoice Details */}
                    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.3)] p-4">
                        <h3 className="mb-3 font-medium">Invoice Details</h3>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Invoice Date *
                                </label>
                                <Input
                                    type="date"
                                    value={formData.invoiceDate}
                                    onChange={(e) =>
                                        setFormData({ ...formData, invoiceDate: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Invoice Number
                                </label>
                                <Input
                                    value={formData.invoiceNumber}
                                    onChange={(e) =>
                                        setFormData({ ...formData, invoiceNumber: e.target.value })
                                    }
                                    placeholder="INV-2025-001"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Category *
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            category: e.target.value as ExpenseCategory,
                                        })
                                    }
                                    className="flex h-10 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.5)]"
                                    required
                                >
                                    {Object.entries(categoryGermanLabels).map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="mb-2 block text-sm font-medium">Description *</label>
                            <Input
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                placeholder="Laptop für Büro"
                                required
                            />
                        </div>
                    </div>

                    {/* Financial Information */}
                    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.3)] p-4">
                        <h3 className="mb-3 font-medium">Financial Information</h3>
                        <div className="grid gap-4 md:grid-cols-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Total Amount *
                                </label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.amount}
                                    onChange={(e) => handleAmountChange(e.target.value)}
                                    placeholder="1190.00"
                                    required
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium">VAT Rate (%)</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={formData.vatRate}
                                    onChange={(e) =>
                                        setFormData({ ...formData, vatRate: e.target.value })
                                    }
                                    placeholder="19"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium">VAT Amount</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.vatAmount}
                                    onChange={(e) =>
                                        setFormData({ ...formData, vatAmount: e.target.value })
                                    }
                                    placeholder="190.00"
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium">Currency</label>
                                <Input
                                    value={formData.currency}
                                    onChange={(e) =>
                                        setFormData({ ...formData, currency: e.target.value })
                                    }
                                    placeholder="EUR"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Payment Information */}
                    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.3)] p-4">
                        <h3 className="mb-3 font-medium">Payment Information</h3>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Payment Date
                                </label>
                                <Input
                                    type="date"
                                    value={formData.paymentDate}
                                    onChange={(e) =>
                                        setFormData({ ...formData, paymentDate: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Payment Method
                                </label>
                                <select
                                    value={formData.paymentMethod || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            paymentMethod: e.target.value as PaymentMethod,
                                        })
                                    }
                                    className="flex h-10 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.5)]"
                                >
                                    <option value="">Select</option>
                                    {Object.entries(paymentMethodLabels).map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Filename Suggestion */}
                    <div className="rounded-lg border border-[hsl(var(--border))] bg-gradient-to-br from-[hsl(var(--primary)/0.05)] to-[hsl(var(--primary)/0.1)] p-4">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-[hsl(var(--primary))]" />
                                German Filename Suggestion
                            </h3>
                            <Button
                                type="button"
                                onClick={handleGenerateFilename}
                                disabled={generatingFilename}
                                size="sm"
                                variant="outline"
                            >
                                {generatingFilename ? 'Generating...' : 'Generate Filename'}
                            </Button>
                        </div>
                        {suggestedFilename && (
                            <div className="flex items-center gap-2 rounded-lg bg-[hsl(var(--card))] p-3">
                                <code className="flex-1 text-sm">{suggestedFilename}</code>
                                <Button
                                    type="button"
                                    onClick={handleCopyFilename}
                                    size="sm"
                                    variant="ghost"
                                >
                                    {copied ? (
                                        <Check className="h-4 w-4 text-green-500" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        )}
                        <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                            Copy this filename and use it when uploading the invoice to Google Drive
                        </p>
                    </div>

                    {/* Google Drive Link */}
                    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.3)] p-4">
                        <h3 className="mb-3 font-medium">Google Drive Link</h3>
                        <Input
                            type="url"
                            value={formData.driveUrl}
                            onChange={(e) =>
                                setFormData({ ...formData, driveUrl: e.target.value })
                            }
                            placeholder="https://drive.google.com/file/d/..."
                        />
                        <p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                            After uploading the invoice to Google Drive, paste the link here
                        </p>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">Additional Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) =>
                                setFormData({ ...formData, notes: e.target.value })
                            }
                            className="flex min-h-[80px] w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.5)]"
                            placeholder="Additional information..."
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1">
                            {initialData ? 'Update' : 'Save'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
