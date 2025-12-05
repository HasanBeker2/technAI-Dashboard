import { formatCurrency, formatDate } from './utils'

interface InvoiceItem {
    description: string
    quantity: number
    rate: number
    amount: number
}

interface TimesheetEntry {
    date: string
    hours: number
    description: string | null
}

interface InvoiceForPDF {
    invoiceNumber: string
    status: string
    issueDate: string
    dueDate: string
    subtotal: number
    vatAmount: number
    vatRate: number
    total: number
    notes?: string
    servicePeriodStart?: string
    servicePeriodEnd?: string
    client: {
        name: string
        email?: string
        address?: string
    }
    project?: {
        name: string
    } | null
    items: InvoiceItem[]
    timesheets?: TimesheetEntry[]
}

// German status translations
const statusTranslations: Record<string, string> = {
    DRAFT: 'Entwurf',
    SENT: 'Gesendet',
    PAID: 'Bezahlt',
    OVERDUE: 'Überfällig',
    CANCELLED: 'Storniert',
}

export function generateInvoicePDF(invoice: InvoiceForPDF): void {
    // Create a new window for the printable invoice
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
        alert('Bitte erlauben Sie Popups um die Rechnung als PDF herunterzuladen')
        return
    }

    // Format address: street on first line, postal code and city on second line
    const formatAddress = (address?: string) => {
        if (!address) return ''
        // Try to parse address like "Umgehungsstraße 1-3, 35043, Marburg"
        const parts = address.split(',')
        if (parts.length >= 3) {
            const street = parts[0].trim()
            const postalCode = parts[1].trim()
            const city = parts[2].trim()
            return `${street}<br>${postalCode} ${city}`
        } else if (parts.length === 2) {
            return `${parts[0].trim()}<br>${parts[1].trim()}`
        }
        return address
    }

    // Parse items if it's a JSON string
    let items: InvoiceItem[]
    try {
        items = typeof invoice.items === 'string'
            ? JSON.parse(invoice.items)
            : invoice.items
    } catch (error) {
        console.error('Error parsing items:', error)
        alert('Fehler beim Laden der Rechnungspositionen')
        printWindow.close()
        return
    }

    const itemsHTML = items.map(item => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.rate)}/Std.</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 500;">${formatCurrency(item.amount)}</td>
        </tr>
    `).join('')

    // Generate EPC QR Code for SEPA Credit Transfer
    // Format: Service Tag, Version, Character Set, Identification, BIC, Name, IBAN, Amount, Purpose, Reference, Remittance, Information
    const epcData = [
        'BCD',
        '002',
        '1',
        'SCT',
        'VBMHDE5FXXX',
        'Hasan Beker',
        'DE85513900000022791702',
        `EUR${Number(invoice.total).toFixed(2)}`,
        '',
        '',  // Structured Creditor Reference (RF...) - leave empty if using unstructured
        `Rechnung ${invoice.invoiceNumber}`, // Remittance Information (Unstructured)
        ''
    ].join('\n')

    // Use QR Server API
    const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + encodeURIComponent(epcData)

    const html = `
        <!DOCTYPE html>
        <html lang="de">
        <head>
            <title>Rechnung ${invoice.invoiceNumber}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: 'Segoe UI', system-ui, sans-serif; 
                    background: white;
                    color: #1f2937;
                    line-height: 1.5;
                }
                .invoice-container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 40px;
                }
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 40px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #6366f1;
                }
                .logo {
                    font-size: 28px;
                    font-weight: bold;
                    color: #6366f1;
                }
                .invoice-title {
                    text-align: right;
                }
                .invoice-title h1 {
                    font-size: 32px;
                    color: #1f2937;
                    margin-bottom: 4px;
                }
                .invoice-number {
                    color: #6b7280;
                    font-size: 14px;
                }
                .status {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 9999px;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    margin-top: 8px;
                }
                .status-PAID { background: #dcfce7; color: #166534; }
                .status-SENT { background: #dbeafe; color: #1e40af; }
                .status-DRAFT { background: #f3f4f6; color: #4b5563; }
                .status-OVERDUE { background: #fee2e2; color: #991b1b; }
                .status-CANCELLED { background: #f3f4f6; color: #4b5563; }
                
                .info-section {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 40px;
                }
                .info-block h3 {
                    font-size: 12px;
                    text-transform: uppercase;
                    color: #6b7280;
                    margin-bottom: 8px;
                    letter-spacing: 0.5px;
                }
                .info-block p {
                    color: #374151;
                }
                .info-block .name {
                    font-weight: 600;
                    font-size: 16px;
                    color: #1f2937;
                }
                .info-block .address {
                    white-space: pre-line;
                }
                
                .items-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 30px;
                }
                .items-table th {
                    background: #f9fafb;
                    padding: 12px;
                    text-align: left;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                    color: #6b7280;
                    letter-spacing: 0.5px;
                }
                .items-table th:nth-child(2),
                .items-table th:nth-child(4) {
                    text-align: right;
                }
                .items-table th:nth-child(3) {
                    text-align: center;
                }
                
                .totals {
                    display: flex;
                    justify-content: flex-end;
                    margin-bottom: 30px;
                }
                .totals-box {
                    width: 320px;
                }
                .totals-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 0;
                    border-bottom: 1px solid #e5e7eb;
                }
                .totals-row.total {
                    border-bottom: none;
                    border-top: 2px solid #6366f1;
                    padding-top: 12px;
                    margin-top: 8px;
                    font-size: 18px;
                    font-weight: bold;
                }
                .totals-row.total .amount {
                    color: #6366f1;
                }
                .totals-row .label {
                    color: #6b7280;
                }
                
                .notes {
                    background: #f9fafb;
                    padding: 20px;
                    border-radius: 8px;
                    margin-top: 20px;
                }
                .notes h3 {
                    font-size: 12px;
                    text-transform: uppercase;
                    color: #6b7280;
                    margin-bottom: 8px;
                    letter-spacing: 0.5px;
                }
                
                .footer {
                    margin-top: 60px;
                    padding-top: 20px;
                    border-top: 1px solid #e5e7eb;
                    text-align: center;
                    color: #9ca3af;
                    font-size: 12px;
                }
                
                @media print {
                    @page {
                        margin: 0;
                        size: auto;
                    }
                    body { 
                        padding: 0;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .invoice-container {
                        max-width: none;
                        width: 100%;
                        padding: 20mm;
                    }
                    .no-print { display: none !important; }
                }
            </style>
        </head>
        <body>
            <div class="invoice-container">
                <div class="header">
                    <div class="logo">TechnAI Solutions</div>
                    <div class="invoice-title">
                        <h1>RECHNUNG</h1>
                        <p class="invoice-number">Nr. ${invoice.invoiceNumber}</p>
                    </div>
                </div>

                <div class="info-section">
                    <div class="info-block">
                        <h3>Rechnungsempfänger</h3>
                        <p class="name">${invoice.client.name}</p>
                        ${invoice.client.address ? `<p class="address">${formatAddress(invoice.client.address)}</p>` : ''}
                    </div>
                    <div class="info-block" style="text-align: right;">
                        <h3>Rechnungsdetails</h3>
                        <p><strong>Rechnungsdatum:</strong> ${formatDate(invoice.issueDate)}</p>
                        <p><strong>Fälligkeitsdatum:</strong> ${formatDate(invoice.dueDate)}</p>
                        ${invoice.project ? `<p><strong>Projekt:</strong> ${invoice.project.name}</p>` : ''}
                    </div>
                </div>

                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Beschreibung</th>
                            <th>Stundensatz</th>
                            <th>Stunden</th>
                            <th>Betrag</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHTML}
                    </tbody>
                </table>

                <div class="totals">
                    <div class="totals-box">
                        <div class="totals-row">
                            <span class="label">Zwischensumme:</span>
                            <span>${formatCurrency(invoice.subtotal)}</span>
                        </div>
                        <div class="totals-row">
                            <span class="label">MwSt. (${invoice.vatRate}%):</span>
                            <span>${formatCurrency(invoice.vatAmount)}</span>
                        </div>
                        <div class="totals-row total">
                            <span class="label">Gesamtbetrag:</span>
                            <span class="amount">${formatCurrency(invoice.total)}</span>
                        </div>
                    </div>
                </div>

                ${invoice.notes ? `
                <div class="notes">
                    <h3>Notizen</h3>
                    <p>${invoice.notes}</p>
                </div>
                ` : ''}

                ${invoice.servicePeriodStart && invoice.servicePeriodEnd ? `
                <div class="notes" style="margin-top: 20px;">
                    <h3>Leistungszeitraum</h3>
                    <p>${formatDate(invoice.servicePeriodStart)} - ${formatDate(invoice.servicePeriodEnd)}</p>
                    ${invoice.timesheets && invoice.timesheets.length > 0 ? '<p style="margin-top: 8px;">Detaillierte Aufschlüsselung siehe Anhang auf Seite 2.</p>' : ''}
                </div>
                ` : ''}

                <div class="footer">
                    <p><strong>Hasan Beker</strong> | Umgehungsstraße 1-3, 35043 Marburg</p>
                    <p>IBAN: DE85513900000022791702 | BIC: VBMHDE5FXXX</p>
                    <p style="margin-top: 10px;">
                        <img src="${qrUrl}" alt="QR Code für Zahlung" style="width: 150px; height: 150px; margin-top: 10px;" />
                    </p>
                    <p style="margin-top: 5px; font-size: 11px;">Scannen Sie den QR-Code für schnelle Zahlung</p>
                </div>
            </div>

            ${invoice.timesheets && invoice.timesheets.length > 0 ? `
            <div class="invoice-container" style="page-break-before: always;">
                <h2 style="margin-bottom: 20px; color: #1f2937;">Anhang: Detaillierte Stundenaufschlüsselung</h2>
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Datum</th>
                            <th>Aufgabe</th>
                            <th style="text-align: right;">Stunden</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoice.timesheets.map(ts => `
                            <tr>
                                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${formatDate(ts.date)}</td>
                                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${ts.description || '-'}</td>
                                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">${Number(ts.hours).toFixed(2)}h</td>
                            </tr>
                        `).join('')}
                        <tr>
                            <td colspan="2" style="padding: 12px; font-weight: bold; text-align: right;">Gesamt:</td>
                            <td style="padding: 12px; font-weight: bold; text-align: right;">${invoice.timesheets.reduce((sum, ts) => sum + Number(ts.hours), 0).toFixed(2)}h</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            ` : ''}

            <script>
                window.onload = function() {
                    setTimeout(function() {
                        window.print();
                    }, 500);
                };
            </script>
        </body>
        </html>
    `

    printWindow.document.write(html)
    printWindow.document.close()
}
