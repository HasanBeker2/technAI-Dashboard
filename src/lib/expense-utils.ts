import type { ExpenseCategory, PaymentMethod } from './validations'

/**
 * German labels for expense categories
 */
export const categoryGermanLabels: Record<ExpenseCategory, string> = {
    SOFTWARE: 'Software',
    HARDWARE: 'Hardware',
    OFFICE: 'Bürobedarf',
    TRAVEL: 'Reisekosten',
    MARKETING: 'Marketing',
    UTILITIES: 'Nebenkosten',
    PROFESSIONAL_SERVICES: 'Dienstleistungen',
    OTHER: 'Sonstiges',
}

/**
 * German labels for payment methods
 */
export const paymentMethodLabels: Record<PaymentMethod, string> = {
    BANK_TRANSFER: 'Überweisung',
    CREDIT_CARD: 'Kreditkarte',
    DEBIT_CARD: 'EC-Karte',
    CASH: 'Bargeld',
    PAYPAL: 'PayPal',
    OTHER: 'Sonstiges',
}

/**
 * Sanitize filename by removing special characters
 */
export function sanitizeFilename(filename: string): string {
    return filename
        .replace(/ä/g, 'ae')
        .replace(/ö/g, 'oe')
        .replace(/ü/g, 'ue')
        .replace(/Ä/g, 'Ae')
        .replace(/Ö/g, 'Oe')
        .replace(/Ü/g, 'Ue')
        .replace(/ß/g, 'ss')
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
}

/**
 * Generate German filename for expense document
 * Format: YYYY-MM-DD_Category_VendorName_Rechnung.pdf
 */
export function generateGermanFilename(
    date: Date | string,
    category: ExpenseCategory,
    vendorName: string,
    extension: string = 'pdf'
): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const dateStr = dateObj.toISOString().split('T')[0] // YYYY-MM-DD

    const categoryLabel = categoryGermanLabels[category]
    const sanitizedVendor = sanitizeFilename(vendorName)
    const sanitizedCategory = sanitizeFilename(categoryLabel)

    return `${dateStr}_${sanitizedCategory}_${sanitizedVendor}_Rechnung.${extension}`
}

/**
 * Format payment method for display
 */
export function formatPaymentMethod(method: PaymentMethod): string {
    return paymentMethodLabels[method] || method
}

/**
 * Get German category label
 */
export function getCategoryGermanLabel(category: ExpenseCategory): string {
    return categoryGermanLabels[category] || category
}

/**
 * Validate Google Drive URL format
 */
export function validateDriveUrl(url: string): boolean {
    if (!url) return true // Optional field

    const driveUrlPattern = /^https:\/\/drive\.google\.com\/(file\/d\/|open\?id=)/
    return driveUrlPattern.test(url)
}

/**
 * Extract file ID from Google Drive URL
 */
export function extractDriveFileId(url: string): string | null {
    if (!url) return null

    // Match: https://drive.google.com/file/d/FILE_ID/view
    let match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
    if (match) return match[1]

    // Match: https://drive.google.com/open?id=FILE_ID
    match = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
    if (match) return match[1]

    return null
}

/**
 * Calculate VAT amount from gross amount and VAT rate
 */
export function calculateVatFromGross(
    grossAmount: number,
    vatRate: number
): {
    netAmount: number
    vatAmount: number
} {
    const netAmount = grossAmount / (1 + vatRate / 100)
    const vatAmount = grossAmount - netAmount

    return {
        netAmount: Math.round(netAmount * 100) / 100,
        vatAmount: Math.round(vatAmount * 100) / 100,
    }
}

/**
 * Calculate VAT amount from net amount and VAT rate
 */
export function calculateVatFromNet(
    netAmount: number,
    vatRate: number
): {
    grossAmount: number
    vatAmount: number
} {
    const vatAmount = netAmount * (vatRate / 100)
    const grossAmount = netAmount + vatAmount

    return {
        grossAmount: Math.round(grossAmount * 100) / 100,
        vatAmount: Math.round(vatAmount * 100) / 100,
    }
}

/**
 * Suggest expense category based on description
 */
export function suggestCategory(description: string): ExpenseCategory {
    const lowerDesc = description.toLowerCase()

    if (
        lowerDesc.includes('software') ||
        lowerDesc.includes('saas') ||
        lowerDesc.includes('subscription') ||
        lowerDesc.includes('license') ||
        lowerDesc.includes('api')
    ) {
        return 'SOFTWARE'
    }

    if (
        lowerDesc.includes('laptop') ||
        lowerDesc.includes('computer') ||
        lowerDesc.includes('monitor') ||
        lowerDesc.includes('hardware') ||
        lowerDesc.includes('equipment')
    ) {
        return 'HARDWARE'
    }

    if (
        lowerDesc.includes('office') ||
        lowerDesc.includes('stationery') ||
        lowerDesc.includes('supplies') ||
        lowerDesc.includes('büro')
    ) {
        return 'OFFICE'
    }

    if (
        lowerDesc.includes('travel') ||
        lowerDesc.includes('flight') ||
        lowerDesc.includes('hotel') ||
        lowerDesc.includes('train') ||
        lowerDesc.includes('reise')
    ) {
        return 'TRAVEL'
    }

    if (
        lowerDesc.includes('marketing') ||
        lowerDesc.includes('advertising') ||
        lowerDesc.includes('ads') ||
        lowerDesc.includes('promotion')
    ) {
        return 'MARKETING'
    }

    if (
        lowerDesc.includes('electricity') ||
        lowerDesc.includes('internet') ||
        lowerDesc.includes('phone') ||
        lowerDesc.includes('utilities') ||
        lowerDesc.includes('strom')
    ) {
        return 'UTILITIES'
    }

    if (
        lowerDesc.includes('consulting') ||
        lowerDesc.includes('legal') ||
        lowerDesc.includes('accounting') ||
        lowerDesc.includes('professional')
    ) {
        return 'PROFESSIONAL_SERVICES'
    }

    return 'OTHER'
}
