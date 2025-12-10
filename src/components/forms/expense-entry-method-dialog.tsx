'use client'

import { Button } from '@/components/ui/button'
import { X, Keyboard, Sparkles } from 'lucide-react'

interface ExpenseEntryMethodDialogProps {
    onSelectMethod: (method: 'manual' | 'ai') => void
    onCancel: () => void
}

export function ExpenseEntryMethodDialog({
    onSelectMethod,
    onCancel,
}: ExpenseEntryMethodDialogProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-8 shadow-2xl animate-fade-in">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold">Add Expense</h2>
                        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                            How would you like to add the expense?
                        </p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {/* Manual Entry Option */}
                    <button
                        onClick={() => onSelectMethod('manual')}
                        className="group relative overflow-hidden rounded-xl border-2 border-[hsl(var(--border))] bg-gradient-to-br from-[hsl(var(--card))] to-[hsl(var(--secondary)/0.3)] p-6 text-left transition-all hover:border-[hsl(var(--primary))] hover:shadow-lg"
                    >
                        <div className="absolute right-4 top-4 rounded-full bg-[hsl(var(--primary)/0.1)] p-3 transition-transform group-hover:scale-110">
                            <Keyboard className="h-8 w-8 text-[hsl(var(--primary))]" />
                        </div>
                        <div className="pr-16">
                            <h3 className="text-lg font-semibold">Manual Entry</h3>
                            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                                Enter invoice details manually
                            </p>
                            <ul className="mt-4 space-y-1 text-xs text-[hsl(var(--muted-foreground))]">
                                <li>• Full control over all fields</li>
                                <li>• Automatic filename suggestion</li>
                                <li>• Upload to Google Drive</li>
                            </ul>
                        </div>
                        <div className="mt-4 flex items-center text-sm font-medium text-[hsl(var(--primary))]">
                            Continue
                            <svg
                                className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                        </div>
                    </button>

                    {/* AI Upload Option */}
                    <button
                        onClick={() => onSelectMethod('ai')}
                        className="group relative overflow-hidden rounded-xl border-2 border-[hsl(var(--border))] bg-gradient-to-br from-[hsl(var(--card))] to-[hsl(var(--secondary)/0.3)] p-6 text-left transition-all hover:border-[hsl(var(--primary))] hover:shadow-lg"
                    >
                        <div className="absolute right-4 top-4 rounded-full bg-[hsl(var(--primary)/0.1)] p-3 transition-transform group-hover:scale-110">
                            <Sparkles className="h-8 w-8 text-[hsl(var(--primary))]" />
                        </div>
                        <div className="pr-16">
                            <h3 className="text-lg font-semibold">
                                AI Upload
                            </h3>
                            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                                Upload invoice/receipt photo
                            </p>
                            <ul className="mt-4 space-y-1 text-xs text-[hsl(var(--muted-foreground))]">
                                <li>• Automatic data extraction</li>
                                <li>• PDF and image support</li>
                                <li>• Auto upload to Drive</li>
                            </ul>
                        </div>
                        <div className="mt-4 flex items-center text-sm font-medium text-[hsl(var(--primary))]">
                            Continue
                            <svg
                                className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                />
                            </svg>
                        </div>
                    </button>
                </div>

                <div className="mt-6 rounded-lg bg-[hsl(var(--secondary)/0.3)] p-4">
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        <strong>Note:</strong> With both methods, your invoice will be uploaded to
                        Google Drive and a German filename will be suggested.
                    </p>
                </div>
            </div>
        </div>
    )
}
