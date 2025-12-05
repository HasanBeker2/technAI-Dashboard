import { Decimal } from '@prisma/client/runtime/library'

export interface InvoiceItem {
    description: string
    quantity: number
    rate: number
    amount: number
}

export interface InvoiceTotals {
    subtotal: number
    vatRate: number
    vatAmount: number
    total: number
}

/**
 * Calculate invoice totals from items
 * @param items - Array of invoice line items
 * @param vatRate - VAT rate as percentage (default 19%)
 * @returns Object containing subtotal, vatRate, vatAmount, and total
 */
export function calculateInvoiceTotals(
    items: InvoiceItem[],
    vatRate: number = 19
): InvoiceTotals {
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0)
    const vatAmount = subtotal * (vatRate / 100)
    const total = subtotal + vatAmount

    return {
        subtotal: Math.round(subtotal * 100) / 100,
        vatRate,
        vatAmount: Math.round(vatAmount * 100) / 100,
        total: Math.round(total * 100) / 100,
    }
}

/**
 * Generate invoice number in format YEAR-XXXX
 * @param year - The year for the invoice
 * @param sequence - The sequential number (will be padded to 4 digits)
 * @returns Formatted invoice number
 */
export function generateInvoiceNumber(year: number, sequence: number): string {
    const paddedSequence = sequence.toString().padStart(4, '0')
    return `${year}-${paddedSequence}`
}

/**
 * Get the next invoice number based on existing invoices
 * @param existingNumbers - Array of existing invoice numbers
 * @param year - The year for the new invoice (defaults to current year)
 * @returns Next invoice number in sequence
 */
export function getNextInvoiceNumber(
    existingNumbers: string[],
    year: number = new Date().getFullYear()
): string {
    const yearPrefix = `${year}-`

    // Filter numbers from the same year and extract sequences
    const sequences = existingNumbers
        .filter(num => num.startsWith(yearPrefix))
        .map(num => {
            const seq = parseInt(num.replace(yearPrefix, ''), 10)
            return isNaN(seq) ? 0 : seq
        })

    const maxSequence = sequences.length > 0 ? Math.max(...sequences) : 0
    return generateInvoiceNumber(year, maxSequence + 1)
}

/**
 * Convert Prisma Decimal to number for calculations
 */
export function decimalToNumber(decimal: Decimal | number | string): number {
    if (typeof decimal === 'number') return decimal
    if (typeof decimal === 'string') return parseFloat(decimal)
    return decimal.toNumber()
}

/**
 * Prepare invoice data for PDF export
 */
export interface InvoicePDFData {
    invoiceNumber: string
    issueDate: string
    dueDate: string
    status: string
    client: {
        name: string
        email?: string
        address?: string
    }
    project?: {
        name: string
    }
    items: InvoiceItem[]
    subtotal: number
    vatRate: number
    vatAmount: number
    total: number
    notes?: string
}

export function prepareInvoiceForPDF(invoice: {
    invoiceNumber: string
    issueDate: Date
    dueDate: Date
    status: string
    client: { name: string; email?: string | null; address?: string | null }
    project?: { name: string } | null
    items: unknown
    subtotal: Decimal | number
    vatRate: Decimal | number
    vatAmount: Decimal | number
    total: Decimal | number
    notes?: string | null
}): InvoicePDFData {
    return {
        invoiceNumber: invoice.invoiceNumber,
        issueDate: invoice.issueDate.toISOString().split('T')[0],
        dueDate: invoice.dueDate.toISOString().split('T')[0],
        status: invoice.status,
        client: {
            name: invoice.client.name,
            email: invoice.client.email ?? undefined,
            address: invoice.client.address ?? undefined,
        },
        project: invoice.project ? { name: invoice.project.name } : undefined,
        items: invoice.items as InvoiceItem[],
        subtotal: decimalToNumber(invoice.subtotal),
        vatRate: decimalToNumber(invoice.vatRate),
        vatAmount: decimalToNumber(invoice.vatAmount),
        total: decimalToNumber(invoice.total),
        notes: invoice.notes ?? undefined,
    }
}

/**
 * Generate PDF stub - placeholder for actual PDF generation
 * In production, you would use a library like @react-pdf/renderer or pdfmake
 */
export async function generateInvoicePDF(data: InvoicePDFData): Promise<Buffer> {
    // Stub implementation - returns a simple text representation
    // Replace with actual PDF generation library
    const content = `
INVOICE: ${data.invoiceNumber}
Issue Date: ${data.issueDate}
Due Date: ${data.dueDate}
Status: ${data.status}

BILL TO:
${data.client.name}
${data.client.email || ''}
${data.client.address || ''}

${data.project ? `Project: ${data.project.name}` : ''}

ITEMS:
${data.items.map(item => `${item.description} - ${item.quantity} x €${item.rate} = €${item.amount}`).join('\n')}

Subtotal: €${data.subtotal.toFixed(2)}
VAT (${data.vatRate}%): €${data.vatAmount.toFixed(2)}
TOTAL: €${data.total.toFixed(2)}

${data.notes ? `Notes: ${data.notes}` : ''}
  `.trim()

    return Buffer.from(content, 'utf-8')
}
