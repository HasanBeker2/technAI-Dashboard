'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Plus, Trash2, Calendar } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface InvoiceItem {
    description: string
    quantity: number
    rate: number
    amount: number
}

interface TimesheetEntry {
    id: string
    date: string
    hours: number
    description: string | null
}

interface InvoiceFormProps {
    clients: { id: string; name: string }[]
    projects: { id: string; name: string; clientId: string; hourlyRate: number }[]
    onSubmit: (data: {
        clientId: string
        projectId?: string
        issueDate: string
        dueDate: string
        items: InvoiceItem[]
        vatRate: number
        notes?: string
        status: 'PENDING'
        servicePeriodStart?: string
        servicePeriodEnd?: string
    }) => void
    onCancel: () => void
    initialData?: {
        clientId: string
        projectId?: string
        issueDate: string
        dueDate: string
        items: InvoiceItem[]
        vatRate: number
        notes?: string
    }
}

export function InvoiceForm({
    clients,
    projects,
    onSubmit,
    onCancel,
    initialData,
}: InvoiceFormProps) {
    const today = new Date().toISOString().split('T')[0]
    const defaultDueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 2 weeks

    const [formData, setFormData] = useState({
        clientId: initialData?.clientId || '',
        projectId: initialData?.projectId || '',
        issueDate: initialData?.issueDate || today,
        dueDate: initialData?.dueDate || defaultDueDate,
        vatRate: initialData?.vatRate?.toString() || '19',
        notes: initialData?.notes || '',
        servicePeriodStart: '',
        servicePeriodEnd: '',
    })

    const [items, setItems] = useState<InvoiceItem[]>(
        initialData?.items && initialData.items.length > 0
            ? initialData.items
            : [{ description: '', quantity: 1, rate: 0, amount: 0 }]
    )

    const [unbilledTimesheets, setUnbilledTimesheets] = useState<TimesheetEntry[]>([])
    const [loadingTimesheets, setLoadingTimesheets] = useState(false)
    const [timesheetSummary, setTimesheetSummary] = useState({ totalHours: 0, totalEarnings: 0 })

    // Fetch timesheets when project changes
    useEffect(() => {
        if (formData.projectId) {
            fetchTimesheets(formData.projectId)
        } else {
            setUnbilledTimesheets([])
            setFormData(prev => ({ ...prev, servicePeriodStart: '', servicePeriodEnd: '' }))
        }
    }, [formData.projectId])

    // Update summary when service period changes
    useEffect(() => {
        if (formData.servicePeriodStart && formData.servicePeriodEnd && unbilledTimesheets.length > 0) {
            const filtered = unbilledTimesheets.filter(ts => {
                const tsDate = ts.date.split('T')[0]
                return tsDate >= formData.servicePeriodStart && tsDate <= formData.servicePeriodEnd
            })

            const totalHours = filtered.reduce((sum, ts) => sum + Number(ts.hours), 0)
            const selectedProject = projects.find(p => p.id === formData.projectId)
            const hourlyRate = selectedProject?.hourlyRate || 0
            const totalEarnings = totalHours * hourlyRate

            setTimesheetSummary({ totalHours, totalEarnings })

            // Auto-populate invoice items
            if (totalHours > 0) {
                const startDate = new Date(formData.servicePeriodStart)
                const endDate = new Date(formData.servicePeriodEnd)
                const description = `Dienstleistungen ${startDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}–${endDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}`

                setItems([{
                    description,
                    quantity: totalHours,
                    rate: hourlyRate,
                    amount: totalEarnings
                }])
            }
        } else {
            setTimesheetSummary({ totalHours: 0, totalEarnings: 0 })
        }
    }, [formData.servicePeriodStart, formData.servicePeriodEnd, unbilledTimesheets, formData.projectId, projects])

    const fetchTimesheets = async (projectId: string) => {
        setLoadingTimesheets(true)
        try {
            const res = await fetch(`/api/timesheets?projectId=${projectId}`)
            if (res.ok) {
                const data = await res.json()
                setUnbilledTimesheets(data)

                // Set default date range to cover all timesheets
                if (data.length > 0) {
                    const dates = data.map((ts: TimesheetEntry) => ts.date.split('T')[0]).sort()
                    setFormData(prev => ({
                        ...prev,
                        servicePeriodStart: dates[0],
                        servicePeriodEnd: dates[dates.length - 1]
                    }))
                }
            }
        } catch (error) {
            console.error('Error fetching timesheets:', error)
        } finally {
            setLoadingTimesheets(false)
        }
    }

    const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
        const newItems = [...items]
        if (field === 'description') {
            newItems[index].description = value as string
        } else {
            const numValue = typeof value === 'string' ? parseFloat(value) || 0 : value
            newItems[index][field] = numValue
            // Recalculate amount
            newItems[index].amount = newItems[index].quantity * newItems[index].rate
        }
        setItems(newItems)
    }

    const addItem = () => {
        setItems([...items, { description: '', quantity: 1, rate: 0, amount: 0 }])
    }

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index))
        }
    }

    const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
    const vatAmount = subtotal * (parseFloat(formData.vatRate) / 100)
    const total = subtotal + vatAmount

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        onSubmit({
            clientId: formData.clientId,
            projectId: formData.projectId || undefined,
            issueDate: formData.issueDate,
            dueDate: formData.dueDate,
            items: items.filter(item => item.description && item.amount > 0),
            vatRate: parseFloat(formData.vatRate),
            notes: formData.notes || undefined,
            status: 'PENDING',
            servicePeriodStart: formData.servicePeriodStart || undefined,
            servicePeriodEnd: formData.servicePeriodEnd || undefined,
        })
    }

    const filteredProjects = formData.clientId
        ? projects.filter(p => p.clientId === formData.clientId)
        : projects

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto py-8">
            <div className="w-full max-w-2xl rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-2xl animate-fade-in mx-4">
                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Create New Invoice</h2>
                    <button
                        onClick={onCancel}
                        className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Client & Project */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium">Client</label>
                            <select
                                value={formData.clientId}
                                onChange={(e) =>
                                    setFormData({ ...formData, clientId: e.target.value, projectId: '' })
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
                            <label className="mb-2 block text-sm font-medium">Project (optional)</label>
                            <select
                                value={formData.projectId}
                                onChange={(e) =>
                                    setFormData({ ...formData, projectId: e.target.value })
                                }
                                className="flex h-10 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.5)]"
                            >
                                <option value="">No project</option>
                                {filteredProjects.map((project) => (
                                    <option key={project.id} value={project.id}>
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Service Period Section */}
                    {formData.projectId && unbilledTimesheets.length > 0 && (
                        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.3)] p-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-[hsl(var(--primary))]" />
                                <h3 className="font-medium">Service Period</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium">Start Date</label>
                                    <Input
                                        type="date"
                                        value={formData.servicePeriodStart}
                                        onChange={(e) => setFormData({ ...formData, servicePeriodStart: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium">End Date</label>
                                    <Input
                                        type="date"
                                        value={formData.servicePeriodEnd}
                                        onChange={(e) => setFormData({ ...formData, servicePeriodEnd: e.target.value })}
                                    />
                                </div>
                            </div>
                            {timesheetSummary.totalHours > 0 && (
                                <div className="flex justify-between text-sm pt-2 border-t border-[hsl(var(--border))]">
                                    <span className="text-[hsl(var(--muted-foreground))]">Total Hours:</span>
                                    <span className="font-semibold">{timesheetSummary.totalHours}h ({formatCurrency(timesheetSummary.totalEarnings)})</span>
                                </div>
                            )}
                        </div>
                    )}

                    {formData.projectId && unbilledTimesheets.length === 0 && !loadingTimesheets && (
                        <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)] p-3 text-sm text-[hsl(var(--muted-foreground))]">
                            ℹ️ No timesheets found for this project. You can still create an invoice by adding line items manually below.
                        </div>
                    )}

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium">Issue Date</label>
                            <Input
                                type="date"
                                value={formData.issueDate}
                                onChange={(e) => setFormData({ ...formData, issueDate: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="mb-2 block text-sm font-medium">Due Date</label>
                            <Input
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {/* Line Items */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">Line Items</label>
                        <div className="space-y-2">
                            {items.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                                    <div className="col-span-5">
                                        <Input
                                            placeholder="Description"
                                            value={item.description}
                                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Input
                                            type="number"
                                            placeholder="Qty"
                                            min="1"
                                            step="0.01"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Input
                                            type="number"
                                            step="0.01"
                                            placeholder="Rate"
                                            min="0"
                                            value={item.rate || ''}
                                            onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="col-span-2 text-right font-medium py-2">
                                        €{item.amount.toFixed(2)}
                                    </div>
                                    <div className="col-span-1">
                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            className="rounded-lg p-2 text-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.1)]"
                                            disabled={items.length === 1}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={addItem} className="mt-2">
                            <Plus className="h-4 w-4" />
                            Add Item
                        </Button>
                    </div>

                    {/* Totals */}
                    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.3)] p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-[hsl(var(--muted-foreground))]">Subtotal</span>
                            <span>€{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm items-center">
                            <span className="text-[hsl(var(--muted-foreground))]">VAT</span>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="30"
                                    value={formData.vatRate}
                                    onChange={(e) => setFormData({ ...formData, vatRate: e.target.value })}
                                    className="w-20 h-8 text-right"
                                />
                                <span>%</span>
                                <span className="w-24 text-right">€{vatAmount.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="flex justify-between font-semibold text-lg border-t border-[hsl(var(--border))] pt-2">
                            <span>Total</span>
                            <span className="gradient-text">€{total.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="mb-2 block text-sm font-medium">Notes (optional)</label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Payment terms, thank you message, etc."
                            rows={2}
                            className="flex w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm focus:border-[hsl(var(--primary))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--primary)/0.5)]"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1">
                            Save Invoice
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
