'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Upload, FileText, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { categoryGermanLabels, paymentMethodLabels, generateGermanFilename } from '@/lib/expense-utils'
import type { ExpenseCategory, PaymentMethod } from '@/lib/validations'

interface AIUploadFormProps {
    onSubmit: (data: any) => void
    onCancel: () => void
}

type UploadStage = 'upload' | 'processing' | 'review' | 'uploading' | 'complete' | 'error'

export function ExpenseAIUploadForm({ onSubmit, onCancel }: AIUploadFormProps) {
    const [stage, setStage] = useState<UploadStage>('upload')
    const [file, setFile] = useState<File | null>(null)
    const [extractedData, setExtractedData] = useState<any>(null)
    const [error, setError] = useState<string>('')
    const [dragActive, setDragActive] = useState(false)

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true)
        } else if (e.type === 'dragleave') {
            setDragActive(false)
        }
    }, [])

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0])
        }
    }, [])

    const handleFileSelect = async (selectedFile: File) => {
        // Validate file type (match backend validation)
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        if (!allowedTypes.includes(selectedFile.type)) {
            setError('Invalid file type. Please upload an image file (JPG, PNG, WEBP). PDF support coming soon.')
            return
        }

        // Validate file size (10MB)
        if (selectedFile.size > 10 * 1024 * 1024) {
            setError('File too large. Maximum size is 10MB.')
            return
        }

        setFile(selectedFile)
        setError('')
        await processDocument(selectedFile)
    }

    const processDocument = async (file: File) => {
        setStage('processing')
        setError('')

        try {
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch('/api/expenses/process-document', {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.details || 'Belge işlenemedi')
            }

            const result = await response.json()
            setExtractedData(result.data)
            setStage('review')
        } catch (error: any) {
            console.error('Error processing document:', error)

            // Try to get detailed error from response
            let errorMsg = 'Failed to analyze invoice. Please try manual entry.'
            if (error.response) {
                const errorData = await error.response.json()
                console.error('API Error Details:', errorData)
                errorMsg = `${errorData.details || errorMsg}\n\nDebug: ${JSON.stringify(errorData.debugInfo || {})}`
            }

            setError(errorMsg)
            setStage('error')
        }
    }

    const handleSubmitExtractedData = async () => {
        if (!extractedData) return

        setStage('uploading')

        try {
            // Generate filename
            const filename = generateGermanFilename(
                extractedData.invoiceDate || new Date().toISOString().split('T')[0],
                extractedData.category || 'OTHER',
                extractedData.vendorName || 'Unknown',
                file?.name.split('.').pop() || 'pdf'
            )

            // Upload to Google Drive
            const driveFormData = new FormData()
            driveFormData.append('file', file!)
            driveFormData.append('fileName', filename)

            const driveResponse = await fetch('/api/google/upload', {
                method: 'POST',
                body: driveFormData,
            })

            let driveData = null
            if (driveResponse.ok) {
                driveData = await driveResponse.json()
            }

            // Submit expense with Drive data
            onSubmit({
                vendorName: extractedData.vendorName,
                vendorAddress: extractedData.vendorAddress,
                invoiceNumber: extractedData.invoiceNumber,
                invoiceDate: extractedData.invoiceDate,
                description: extractedData.description,
                category: extractedData.category,
                amount: extractedData.amount,
                vatRate: extractedData.vatRate,
                vatAmount: extractedData.vatAmount,
                currency: extractedData.currency || 'EUR',
                paymentMethod: extractedData.paymentMethod,
                driveFileId: driveData?.fileId,
                driveUrl: driveData?.webViewLink,
                driveFileName: filename,
                date: extractedData.invoiceDate || new Date().toISOString().split('T')[0],
            })

            setStage('complete')
        } catch (err) {
            console.error('Error uploading:', err)
            setError('Yükleme sırasında hata oluştu')
            setStage('error')
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm overflow-y-auto p-4">
            <div className="w-full max-w-3xl rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 shadow-2xl animate-fade-in my-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold">AI Document Upload</h2>
                        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                            {stage === 'upload' && 'Upload invoice or receipt'}
                            {stage === 'processing' && 'Analyzing document...'}
                            {stage === 'review' && 'Review extracted data'}
                            {stage === 'uploading' && 'Uploading to Google Drive...'}
                            {stage === 'complete' && 'Successfully completed!'}
                            {stage === 'error' && 'Error occurred'}
                        </p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="rounded-lg p-2 text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))]"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Upload Stage */}
                {stage === 'upload' && (
                    <div
                        className={`relative rounded-xl border-2 border-dashed p-12 text-center transition-colors ${dragActive
                            ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.1)]'
                            : 'border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.3)]'
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <Upload className="mx-auto h-12 w-12 text-[hsl(var(--muted-foreground))]" />
                        <h3 className="mt-4 text-lg font-medium">Upload File</h3>
                        <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                            Drag and drop file or click to select
                        </p>
                        <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                            className="absolute inset-0 cursor-pointer opacity-0"
                        />
                        <p className="mt-4 text-xs text-[hsl(var(--muted-foreground))]">
                            JPG, PNG, WEBP (Max. 10MB)
                            <br />
                            <span className="text-yellow-500">Note: PDF support coming soon - please upload image files</span>
                        </p>
                    </div>
                )}

                {/* Processing Stage */}
                {stage === 'processing' && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-16 w-16 animate-spin text-[hsl(var(--primary))]" />
                        <h3 className="mt-6 text-lg font-medium">Analyzing Document</h3>
                        <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                            AI is extracting invoice information...
                        </p>
                        <div className="mt-6 w-full max-w-md space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                                <div className="h-2 w-2 rounded-full bg-[hsl(var(--primary))] animate-pulse" />
                                Reading document
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <div className="h-2 w-2 rounded-full bg-[hsl(var(--primary))] animate-pulse" />
                                Extracting data
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <div className="h-2 w-2 rounded-full bg-[hsl(var(--primary))] animate-pulse" />
                                Determining category
                            </div>
                        </div>
                    </div>
                )}

                {/* Review Stage */}
                {stage === 'review' && extractedData && (
                    <div className="space-y-4">
                        <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-4">
                            <div className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                <p className="text-sm font-medium">Data extracted successfully!</p>
                            </div>
                            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                                Review the information below and edit if needed
                            </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-medium">Company Name</label>
                                <Input
                                    value={extractedData.vendorName || ''}
                                    onChange={(e) =>
                                        setExtractedData({ ...extractedData, vendorName: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium">Invoice Date</label>
                                <Input
                                    type="date"
                                    value={extractedData.invoiceDate || ''}
                                    onChange={(e) =>
                                        setExtractedData({ ...extractedData, invoiceDate: e.target.value })
                                    }
                                />
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium">Category</label>
                                <select
                                    value={extractedData.category || 'OTHER'}
                                    onChange={(e) =>
                                        setExtractedData({
                                            ...extractedData,
                                            category: e.target.value as ExpenseCategory,
                                        })
                                    }
                                    className="flex h-10 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm"
                                >
                                    {Object.entries(categoryGermanLabels).map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium">Total Amount</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={extractedData.amount || ''}
                                    onChange={(e) =>
                                        setExtractedData({
                                            ...extractedData,
                                            amount: parseFloat(e.target.value),
                                        })
                                    }
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-medium">Description</label>
                                <Input
                                    value={extractedData.description || ''}
                                    onChange={(e) =>
                                        setExtractedData({ ...extractedData, description: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setStage('upload')}
                                className="flex-1"
                            >
                                Upload New Document
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSubmitExtractedData}
                                className="flex-1"
                            >
                                Save & Upload to Drive
                            </Button>
                        </div>
                    </div>
                )}

                {/* Uploading Stage */}
                {stage === 'uploading' && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Loader2 className="h-16 w-16 animate-spin text-[hsl(var(--primary))]" />
                        <h3 className="mt-6 text-lg font-medium">Uploading to Google Drive</h3>
                        <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                            Please wait...
                        </p>
                    </div>
                )}

                {/* Error Stage */}
                {stage === 'error' && (
                    <div className="space-y-4">
                        <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-red-500" />
                                <p className="text-sm font-medium">Error Occurred</p>
                            </div>
                            <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{error}</p>
                        </div>
                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setStage('upload')}
                                className="flex-1"
                            >
                                Try Again
                            </Button>
                            <Button type="button" onClick={onCancel} className="flex-1">
                                Close
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
