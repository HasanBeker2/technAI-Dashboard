'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle, X } from 'lucide-react'

interface ConfirmDialogProps {
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    variant?: 'danger' | 'warning' | 'default'
    onConfirm: () => void
    onCancel: () => void
    isLoading?: boolean
}

export function ConfirmDialog({
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    onConfirm,
    onCancel,
    isLoading = false,
}: ConfirmDialogProps) {
    const variantStyles = {
        danger: 'bg-[hsl(var(--destructive))] hover:bg-[hsl(var(--destructive)/0.9)]',
        warning: 'bg-[hsl(var(--warning))] hover:bg-[hsl(var(--warning)/0.9)]',
        default: 'bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.9)]',
    }

    const iconStyles = {
        danger: 'text-[hsl(var(--destructive))] bg-[hsl(var(--destructive)/0.1)]',
        warning: 'text-[hsl(var(--warning))] bg-[hsl(var(--warning)/0.1)]',
        default: 'text-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)]',
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-2xl animate-fade-in">
                <div className="mb-4 flex items-start gap-4">
                    <div className={`rounded-full p-3 ${iconStyles[variant]}`}>
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold">{title}</h3>
                        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                            {message}
                        </p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="rounded-lg p-1 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex gap-3 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                        className="flex-1"
                        disabled={isLoading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        type="button"
                        onClick={onConfirm}
                        className={`flex-1 ${variantStyles[variant]}`}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Processing...' : confirmText}
                    </Button>
                </div>
            </div>
        </div>
    )
}
