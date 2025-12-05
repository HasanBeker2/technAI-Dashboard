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
    console.log('Invoice data:', invoice)
    console.log('Timesheets:', invoice.timesheets)
    console.log('Has timesheets:', invoice.timesheets && invoice.timesheets.length > 0)

    // Create a new window for the printable invoice
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
        alert('Bitte erlauben Sie Popups um die Rechnung als PDF herunterzuladen')
        return
    }

    // Set the document title immediately for better filename suggestion
    const filename = `Rechnung_${invoice.invoiceNumber}_${invoice.client.name.replace(/\s+/g, '_')}`
    printWindow.document.title = filename

    const hasTimesheets = invoice.timesheets && invoice.timesheets.length > 0
    const totalPages = hasTimesheets ? 2 : 1

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
            <title>${filename}</title>
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
                    margin-right: 12px;
                }
                .totals-box {
                    width: 280px;
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

                <div class="footer">
                    <!-- Payment Instructions -->
                    <div style="margin-bottom: 15px;">
                        <p style="line-height: 1.4; font-size: 11px; color: #374151;">
                            Bitte überweisen Sie den Gesamtbetrag innerhalb von 14 Tagen nach Erhalt der Rechnung unter Angabe Ihrer Rechnungsnummer.
                        </p>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px; margin-bottom: 20px;">
                        <!-- Left: QR Code -->
                        <div>
                            <img src="${qrUrl}" alt="QR Code" style="width: 120px; height: 120px; margin-bottom: 5px;" />
                            <p style="font-size: 10px; color: #6b7280;">Scannen für Überweisung</p>
                        </div>
                        
                        <!-- Center: Bank Info -->
                        <div style="text-align: center;">
                            <p style="font-weight: 600; margin-bottom: 6px; font-size: 12px; color: #6b7280;">Bankverbindung</p>
                            <p style="margin-bottom: 2px; font-size: 12px; color: #6b7280;">Volksbank Mittelhessen</p>
                            <p style="margin-bottom: 2px; font-size: 11px; color: #6b7280;">Kontoinhaber: Hasan Beker</p>
                            <p style="margin-bottom: 2px; font-size: 11px; color: #6b7280;">IBAN: DE85 5139 0000 0022 7917 02</p>
                            <p style="font-size: 11px; color: #6b7280;">BIC: VBMHDE5FXXX</p>
                        </div>
                        
                        <!-- Right: Company Info -->
                        <div style="text-align: right;">
                            <p style="margin-bottom: 3px; font-size: 13px; color: #6b7280;">TechnAI Solutions</p>
                            <p style="margin-bottom: 3px; font-size: 13px; color: #6b7280;">Hasan Beker</p>
                            <p style="margin-bottom: 3px; font-size: 12px; color: #6b7280;">Steinweg 7</p>
                            <p style="margin-bottom: 3px; font-size: 12px; color: #6b7280;">35423 Lich</p>
                            <p style="margin-bottom: 3px; font-size: 11px; color: #6b7280;">Steuernummer: 020/805/35925</p>
                            <p style="font-size: 11px; color: #6b7280;">Ust-IdNr.: DE458232218</p>
                        </div>
                    </div>
                    
                    <!-- Bottom: Contact with Icons -->
                    <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                        <div style="flex: 1;"></div>
                        <div style="display: flex; justify-content: center; gap: 30px; flex: 1;">
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span style="font-size: 16px;">🌐</span>
                                <a href="https://www.technai.io" style="color: #6366f1; text-decoration: none; font-size: 13px;">www.technai.io</a>
                            </div>
                            <div style="display: flex; align-items: center; gap: 6px;">
                                <span style="font-size: 16px;">✉️</span>
                                <a href="mailto:info@technai.io" style="color: #6366f1; text-decoration: none; font-size: 13px;">info@technai.io</a>
                            </div>
                        </div>
                        <div style="flex: 1; text-align: right;">
                            <span style="font-size: 11px; color: #6b7280;">Seite 1/${totalPages}</span>
                        </div>
                    </div>
                </div>
            </div>

            ${invoice.timesheets && invoice.timesheets.length > 0 ? `
            <div class="invoice-container" style="page-break-before: always;">
                <!-- Page 2 Header -->
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #6366f1;">
                    <div style="font-size: 24px; font-weight: bold; color: #6366f1;">TechnAI Solutions</div>
                    <div style="text-align: right;">
                        <h1 style="font-size: 28px; color: #1f2937; margin-bottom: 4px;">RECHNUNG</h1>
                        <p style="color: #6b7280; font-size: 14px;">Nr. ${invoice.invoiceNumber}</p>
                    </div>
                </div>

                <!-- Service Period -->
                <div style="margin-bottom: 25px;">
                    <p style="font-size: 14px; color: #374151;">
                        <strong>Dienstleistungszeitraum:</strong> ${invoice.servicePeriodStart && invoice.servicePeriodEnd ? `${formatDate(invoice.servicePeriodStart)} – ${formatDate(invoice.servicePeriodEnd)}` : 'N/A'} (Leistungsnachweis)
                    </p>
                </div>

                <!-- Timesheet Table -->
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>Datum</th>
                            <th style="text-align: center;">Aufgabe</th>
                            <th style="text-align: right;">Stunden</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${invoice.timesheets.map(ts => `
                            <tr>
                                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px;">${formatDate(ts.date).split('.').slice(0, 2).join('.')}</td>
                                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-size: 11px;">${ts.description || '-'}</td>
                                <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 11px;">${Number(ts.hours)}</td>
                            </tr>
                        `).join('')}
                        <tr style="background: #f9fafb;">
                            <td colspan="2" style="padding: 12px; font-weight: bold; text-align: right; border-top: 2px solid #6366f1;">Gesamt:</td>
                            <td style="padding: 12px; font-weight: bold; text-align: right; border-top: 2px solid #6366f1;">${invoice.timesheets.reduce((sum, ts) => sum + Number(ts.hours), 0)}</td>
                        </tr>
                    </tbody>
                </table>

                <!-- Page 2 Footer -->
                <div style="margin-top: 40px; padding-top: 15px; border-top: 1px solid #e5e7eb; text-align: right;">
                    <span style="font-size: 11px; color: #6b7280;">Seite 2/${totalPages}</span>
                </div>
            </div>
            ` : ''}

            <script>
                window.onload = function() {
                    document.title = "${filename}";
                    try {
                        // Try to set a nicer URL than about:blank
                        window.history.replaceState(null, "${filename}", "/rechnung-${invoice.invoiceNumber}");
                    } catch (e) {
                        console.log("Could not update URL", e);
                    }
                    
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
