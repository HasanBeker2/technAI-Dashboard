'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ExpenseForm } from '@/components/forms/expense-form'
import { ExpenseAIUploadForm } from '@/components/forms/expense-ai-upload-form'
import { ExpenseEntryMethodDialog } from '@/components/forms/expense-entry-method-dialog'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Plus, Search, Trash2, Edit, Receipt, ExternalLink, FileText } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { categoryGermanLabels, paymentMethodLabels } from '@/lib/expense-utils'
import type { ExpenseCategory, PaymentMethod } from '@/lib/validations'

const categoryColors: Record<ExpenseCategory, string> = {
    SOFTWARE: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    HARDWARE: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    OFFICE: 'bg-green-500/20 text-green-400 border-green-500/30',
    TRAVEL: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    MARKETING: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    UTILITIES: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    PROFESSIONAL_SERVICES: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    OTHER: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
}

interface Expense {
    id: string
    vendorName: string
    vendorAddress?: string | null
    invoiceNumber?: string | null
    invoiceDate: string
    description: string
    category: ExpenseCategory
    amount: number
    vatRate?: number | null
    vatAmount?: number | null
    currency: string
    paymentDate?: string | null
    paymentMethod?: PaymentMethod | null
    driveFileId?: string | null
    driveUrl?: string | null
    driveFileName?: string | null
    notes?: string | null
    date: string
}

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [categoryFilter, setCategoryFilter] = useState<string>('all')

    // Modal states
    const [showMethodDialog, setShowMethodDialog] = useState(false)
    const [showManualForm, setShowManualForm] = useState(false)
    const [showAIForm, setShowAIForm] = useState(false)
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const fetchExpenses = useCallback(async () => {
        try {
            const res = await fetch('/api/expenses')
            if (res.ok) {
                const data = await res.json()
                setExpenses(data)
            }
        } catch (error) {
            console.error('Error fetching expenses:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchExpenses()
    }, [fetchExpenses])

    const filteredExpenses = expenses.filter((expense) => {
        const matchesSearch =
            expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            expense.vendorName.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesCategory =
            categoryFilter === 'all' || expense.category === categoryFilter
        return matchesSearch && matchesCategory
    })

    const handleCreateExpense = async (data: any) => {
        try {
            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (res.ok) {
                setShowManualForm(false)
                setShowAIForm(false)
                fetchExpenses()
            } else {
                const error = await res.json()
                alert(`Error: ${error.error || 'Failed to create expense'}`)
            }
        } catch (error) {
            console.error('Error creating expense:', error)
            alert('Failed to create expense')
        }
    }

    const handleUpdateExpense = async (data: any) => {
        if (!editingExpense) return
        try {
            const res = await fetch(`/api/expenses/${editingExpense.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })
            if (res.ok) {
                setEditingExpense(null)
                fetchExpenses()
            } else {
                const error = await res.json()
                alert(`Error: ${error.error || 'Failed to update expense'}`)
            }
        } catch (error) {
            console.error('Error updating expense:', error)
            alert('Failed to update expense')
        }
    }

    const handleDeleteExpense = async () => {
        if (!deleteTarget) return
        setIsDeleting(true)
        try {
            const res = await fetch(`/api/expenses/${deleteTarget.id}`, {
                method: 'DELETE',
            })
            if (res.ok) {
                setDeleteTarget(null)
                fetchExpenses()
            } else {
                const error = await res.json()
                alert(`Error: ${error.error || 'Failed to delete expense'}`)
            }
        } catch (error) {
            console.error('Error deleting expense:', error)
            alert('Failed to delete expense')
        } finally {
            setIsDeleting(false)
        }
    }

    const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0)
    const totalVat = expenses.reduce(
        (sum, exp) => sum + (exp.vatAmount ? Number(exp.vatAmount) : 0),
        0
    )

    // Group by category for summary
    const byCategory = expenses.reduce<Record<string, number>>((acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + Number(exp.amount)
        return acc
    }, {})

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
                    <h1 className="text-3xl font-bold">Expenses</h1>
                    <p className="mt-1 text-[hsl(var(--muted-foreground))]">
                        Track and manage your business expenses
                    </p>
                </div>
                <Button onClick={() => setShowMethodDialog(true)}>
                    <Plus className="h-4 w-4" />
                    Add Expense
                </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
                    <Input
                        placeholder="Search expenses or company..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="h-10 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 text-sm focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.5)]"
                >
                    <option value="all">All Categories</option>
                    {Object.entries(categoryGermanLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Stats Summary */}
            <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Total Expenses</p>
                    <p className="text-2xl font-bold text-[hsl(var(--destructive))]">
                        {formatCurrency(totalExpenses)}
                    </p>
                </div>
                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Deductible VAT</p>
                    <p className="text-2xl font-bold text-[hsl(var(--primary))]">
                        {formatCurrency(totalVat)}
                    </p>
                </div>
                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">Net Amount</p>
                    <p className="text-2xl font-bold">{formatCurrency(totalExpenses - totalVat)}</p>
                </div>
                <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                    <p className="text-sm text-[hsl(var(--muted-foreground))]">This Month</p>
                    <p className="text-2xl font-bold">{expenses.length} records</p>
                </div>
            </div>

            {/* Category Breakdown */}
            {Object.keys(byCategory).length > 0 && (
                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
                    <h3 className="mb-4 font-semibold">By Category</h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {Object.entries(byCategory).map(([category, amount]) => (
                            <div
                                key={category}
                                className="flex items-center justify-between rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.3)] p-3"
                            >
                                <span
                                    className={`rounded-full border px-2 py-0.5 text-xs font-medium ${categoryColors[category as ExpenseCategory]
                                        }`}
                                >
                                    {categoryGermanLabels[category as ExpenseCategory]}
                                </span>
                                <span className="font-semibold">{formatCurrency(amount)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Expenses List or Empty State */}
            {expenses.length === 0 ? (
                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-12 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-[hsl(var(--primary)/0.1)] flex items-center justify-center mb-4">
                        <Receipt className="h-8 w-8 text-[hsl(var(--primary))]" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No expenses yet</h3>
                    <p className="text-[hsl(var(--muted-foreground))] mb-4">
                        Start recording your business expenses for tax deductions
                    </p>
                    <Button onClick={() => setShowMethodDialog(true)}>
                        <Plus className="h-4 w-4" />
                        Add Expense
                    </Button>
                </div>
            ) : (
                <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.3)]">
                                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                                    Date
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                                    Company
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                                    Category
                                </th>
                                <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                                    Description
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                                    Amount
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                                    VAT
                                </th>
                                <th className="px-6 py-4 text-center text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                                    Document
                                </th>
                                <th className="px-6 py-4 text-right text-xs font-medium uppercase tracking-wider text-[hsl(var(--muted-foreground))]">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenses.map((expense, index) => (
                                <tr
                                    key={expense.id}
                                    className={`group border-b border-[hsl(var(--border))] transition-colors hover:bg-[hsl(var(--secondary)/0.3)] ${index === filteredExpenses.length - 1 ? 'border-b-0' : ''
                                        }`}
                                >
                                    <td className="px-6 py-4 text-sm">
                                        {formatDate(expense.invoiceDate)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-medium">{expense.vendorName}</p>
                                        {expense.invoiceNumber && (
                                            <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                                {expense.invoiceNumber}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`rounded-full border px-2 py-0.5 text-xs font-medium ${categoryColors[expense.category]
                                                }`}
                                        >
                                            {categoryGermanLabels[expense.category]}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="font-medium">{expense.description}</p>
                                        {expense.paymentMethod && (
                                            <p className="text-xs text-[hsl(var(--muted-foreground))]">
                                                {paymentMethodLabels[expense.paymentMethod]}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right font-semibold">
                                        {formatCurrency(Number(expense.amount))}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm text-[hsl(var(--muted-foreground))]">
                                        {formatCurrency(
                                            expense.vatAmount ? Number(expense.vatAmount) : 0
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {expense.driveUrl ? (
                                            <a
                                                href={expense.driveUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 text-[hsl(var(--primary))] hover:underline"
                                                title={expense.driveFileName || 'View Document'}
                                            >
                                                <FileText className="h-4 w-4" />
                                                <ExternalLink className="h-3 w-3" />
                                            </a>
                                        ) : (
                                            <span className="text-[hsl(var(--muted-foreground))]">-</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => setEditingExpense(expense)}
                                                className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))]"
                                                title="Edit"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget(expense)}
                                                className="rounded-lg p-2 text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.1)]"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Entry Method Selection Dialog */}
            {showMethodDialog && (
                <ExpenseEntryMethodDialog
                    onSelectMethod={(method) => {
                        setShowMethodDialog(false)
                        if (method === 'manual') {
                            setShowManualForm(true)
                        } else {
                            setShowAIForm(true)
                        }
                    }}
                    onCancel={() => setShowMethodDialog(false)}
                />
            )}

            {/* Manual Entry Form */}
            {(showManualForm || editingExpense) && (
                <ExpenseForm
                    onSubmit={editingExpense ? handleUpdateExpense : handleCreateExpense}
                    onCancel={() => {
                        setShowManualForm(false)
                        setEditingExpense(null)
                    }}
                    initialData={
                        editingExpense
                            ? {
                                vendorName: editingExpense.vendorName,
                                vendorAddress: editingExpense.vendorAddress || undefined,
                                invoiceNumber: editingExpense.invoiceNumber || undefined,
                                invoiceDate: editingExpense.invoiceDate.split('T')[0],
                                description: editingExpense.description,
                                category: editingExpense.category,
                                amount: String(editingExpense.amount),
                                vatRate: editingExpense.vatRate
                                    ? String(editingExpense.vatRate)
                                    : '19',
                                vatAmount: editingExpense.vatAmount
                                    ? String(editingExpense.vatAmount)
                                    : '',
                                currency: editingExpense.currency,
                                paymentDate: editingExpense.paymentDate?.split('T')[0],
                                paymentMethod: editingExpense.paymentMethod || undefined,
                                driveUrl: editingExpense.driveUrl || undefined,
                                notes: editingExpense.notes || undefined,
                                date: editingExpense.date.split('T')[0],
                            }
                            : undefined
                    }
                />
            )}

            {/* AI Upload Form */}
            {showAIForm && (
                <ExpenseAIUploadForm
                    onSubmit={handleCreateExpense}
                    onCancel={() => setShowAIForm(false)}
                />
            )}

            {/* Delete Confirmation Dialog */}
            {deleteTarget && (
                <ConfirmDialog
                    title="Delete Expense"
                    message={`Are you sure you want to delete the expense "${deleteTarget.description}"? This action cannot be undone.`}
                    confirmText="Delete"
                    cancelText="Cancel"
                    variant="danger"
                    onConfirm={handleDeleteExpense}
                    onCancel={() => setDeleteTarget(null)}
                    isLoading={isDeleting}
                />
            )}
        </div>
    )
}
