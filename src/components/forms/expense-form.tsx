'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'

type ExpenseCategory =
    | 'SOFTWARE'
    | 'HARDWARE'
    | 'OFFICE'
    | 'TRAVEL'
    | 'MARKETING'
    | 'UTILITIES'
    | 'PROFESSIONAL_SERVICES'
    | 'OTHER'

const categoryLabels: Record<ExpenseCategory, string> = {
    SOFTWARE: 'Software',
    HARDWARE: 'Hardware',
    OFFICE: 'Office',
    TRAVEL: 'Travel',
    MARKETING: 'Marketing',
    UTILITIES: 'Utilities',
    PROFESSIONAL_SERVICES: 'Professional Services',
    OTHER: 'Other',
}

interface ExpenseFormProps {
    onSubmit: (data: {
        category: ExpenseCategory
        description: string
        amount: number
        vatAmount?: number
        date: string
    }) => void
    onCancel: () => void
    initialData?: {
        category: ExpenseCategory
        description: string
        amount: number
        vatAmount?: number
        date: string
    }
}

export function ExpenseForm({
    onSubmit,
    onCancel,
    initialData,
}: ExpenseFormProps) {
    const [formData, setFormData] = useState({
        category: initialData?.category || ('SOFTWARE' as ExpenseCategory),
        description: initialData?.description || '',
        amount: initialData?.amount?.toString() || '',
        vatAmount: initialData?.vatAmount?.toString() || '',
        date: initialData?.date || new Date().toISOString().split('T')[0],
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit({
            category: formData.category,
            description: formData.description,
            amount: parseFloat(formData.amount),
            vatAmount: formData.vatAmount ? parseFloat(formData.vatAmount) : undefined,
            date: formData.date,
        })
    }

    // Auto-calculate VAT (19%)
    const handleAmountChange = (value: string) => {
        setFormData({
            ...formData,
            amount: value,
            vatAmount: value ? (parseFloat(value) * 0.19).toFixed(2) : '',
        })
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-2xl animate-fade-in">
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

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium">Category</label>
                        <select
                            value={formData.category}
                            onChange={(e) =>
                                setFormData({ ...formData, category: e.target.value as ExpenseCategory })
                            }
                            className="flex h-10 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.5)]"
                            required
                        >
                            {Object.entries(categoryLabels).map(([value, label]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">Description</label>
                        <Input
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="GitHub Enterprise License"
                            required
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-medium">Date</label>
                        <Input
                            type="date"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium">Amount (€)</label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.amount}
                                onChange={(e) => handleAmountChange(e.target.value)}
                                placeholder="450.00"
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium">VAT Amount (€)</label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={formData.vatAmount}
                                onChange={(e) => setFormData({ ...formData, vatAmount: e.target.value })}
                                placeholder="85.50"
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1">
                            {initialData ? 'Update Expense' : 'Add Expense'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
