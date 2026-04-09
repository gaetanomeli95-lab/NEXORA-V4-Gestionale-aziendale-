import { Invoice, Customer, InvoiceItem, Tenant, Company } from '@prisma/client'
import puppeteer from 'puppeteer'
import { formatDateTime } from '@/lib/utils'

export interface InvoiceData {
  invoice: Invoice
  tenant?: Tenant | null
  company?: Company | null
  customer: Customer
  items: InvoiceItem[]
}

export class PDFGenerator {
  static async generateInvoicePDF(invoiceData: InvoiceData): Promise<Buffer> {
    const htmlContent = this.generateInvoiceHTML(invoiceData)

    return this.renderPdf(htmlContent)
  }

  private static formatCurrency(amount: number | null | undefined): string {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(Number(amount || 0))
  }

  private static formatQuantity(value: number | null | undefined): string {
    const numericValue = Number(value || 0)
    return new Intl.NumberFormat('it-IT', {
      minimumFractionDigits: Number.isInteger(numericValue) ? 0 : 2,
      maximumFractionDigits: Number.isInteger(numericValue) ? 0 : 2
    }).format(numericValue)
  }

  private static displayValue(value: unknown): string {
    if (value === null || value === undefined || value === '') {
      return '&nbsp;'
    }

    return String(value)
  }

  private static multilineValue(value: unknown): string {
    return this.displayValue(value).replace(/\n/g, '<br>')
  }

  private static humanizeEnumLabel(value: string): string {
    return value
      .toLowerCase()
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  }

  private static translateEnumValue(value: unknown, labels: Record<string, string>): string {
    if (value === null || value === undefined || value === '') {
      return ''
    }

    const normalized = String(value).trim().toUpperCase()
    return labels[normalized] || this.humanizeEnumLabel(normalized)
  }

  private static translatePaymentMethod(value: unknown): string {
    return this.translateEnumValue(value, {
      BANK_TRANSFER: 'Bonifico bancario',
      WIRE_TRANSFER: 'Bonifico bancario',
      CASH: 'Contanti',
      CREDIT_CARD: 'Carta di credito',
      DEBIT_CARD: 'Carta di debito',
      CARD: 'Carta',
      POS: 'POS',
      PAYPAL: 'PayPal',
      CHECK: 'Assegno',
      SEPA: 'Addebito SEPA',
      OTHER: 'Altro',
    })
  }

  private static translateStatusLabel(value: unknown): string {
    return this.translateEnumValue(value, {
      DRAFT: 'Bozza',
      SENT: 'Inviata',
      PAID: 'Pagata',
      PARTIAL: 'Parziale',
      PARTIALLY_PAID: 'Parziale',
      OVERDUE: 'Scaduta',
      CANCELLED: 'Annullata',
      DELIVERED: 'Consegnato',
      COMPLETED: 'Completato',
      PROCESSING: 'In lavorazione',
      PENDING: 'In attesa',
      READY: 'Pronto',
      OPEN: 'Aperto',
      CLOSED: 'Chiuso',
      NON_PAGATO: 'Non pagato',
      UNPAID: 'Non pagata',
      PAGATO: 'Pagato',
      ACCONTO: 'Acconto',
      REFUNDED: 'Rimborsato',
    })
  }

  private static documentStyles(): string {
    return `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; font-size: 11px; line-height: 1.45; color: #0f172a; padding: 9mm; background: #fff; }
        .document-heading { text-align: center; font-size: 22px; font-weight: 800; letter-spacing: 0.22em; color: #0f172a; margin-bottom: 16px; padding: 10px 12px; border: 1px solid #cbd5e1; border-radius: 16px; background: linear-gradient(180deg, #f8fbff 0%, #eef4fb 100%); box-shadow: 0 10px 28px rgba(15, 23, 42, 0.08); }
        .top-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.08fr); gap: 18px; margin-bottom: 16px; align-items: start; }
        .sender-card, .recipient-card, .document-card, .info-card, .notes-panel, .totals-panel { border: 1px solid #d6deea; border-radius: 16px; background: #fff; box-shadow: 0 10px 26px rgba(15, 23, 42, 0.06); overflow: hidden; }
        .sender-card { background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%); }
        .recipient-card { background: linear-gradient(180deg, #fffaf1 0%, #fff3df 100%); }
        .document-card, .info-card { background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%); }
        .sender-card, .recipient-card, .document-card, .info-card { padding: 14px 16px; min-height: 136px; }
        .logo-box { width: 160px; height: 96px; border: 1px solid #d8e0ea; border-radius: 14px; display: flex; align-items: center; justify-content: center; background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%); margin-bottom: 14px; }
        .logo-fallback { font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: 0.08em; }
        .company-name, .party-name { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #0f172a; margin-bottom: 8px; }
        .company-lines, .party-lines { font-size: 10.2px; line-height: 1.65; text-transform: uppercase; color: #334155; }
        .meta-table, .items-table, .totals-table { width: 100%; border-collapse: collapse; }
        .meta-table { margin-bottom: 16px; }
        .meta-table th, .meta-table td { border: 1px solid #d6deea; padding: 8px 10px; font-size: 10px; }
        .meta-table th { background: #eef4fb; text-transform: uppercase; font-weight: 800; color: #0f172a; width: 18%; }
        .meta-table td { width: 32%; min-height: 24px; color: #1e293b; }
        .items-table { margin-bottom: 16px; }
        .items-table thead th { background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%); color: #f8fafc; border: 1px solid #1e293b; padding: 8px 10px; text-align: left; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.08em; }
        .items-table tbody td { border: 1px solid #dce4ee; padding: 8px 10px; vertical-align: top; font-size: 10px; color: #1e293b; }
        .items-table tbody tr:nth-child(even) td { background: #f8fbff; }
        .bottom-grid { display: grid; grid-template-columns: minmax(0, 1.12fr) minmax(0, 0.88fr); gap: 18px; margin-bottom: 12px; }
        .panel-title { background: linear-gradient(180deg, #eff4ff 0%, #dbe8f6 100%); border-bottom: 1px solid #d6deea; padding: 8px 10px; font-size: 9.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #0f172a; }
        .panel-title.sub-panel-title { border-top: 1px solid #d6deea; }
        .panel-body { padding: 12px; min-height: 96px; font-size: 10px; line-height: 1.6; color: #334155; background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%); }
        .panel-body.compact { min-height: 56px; }
        .totals-table td { border: 1px solid #dce4ee; padding: 8px 10px; font-size: 10px; }
        .totals-table td:first-child { background: #f8fbff; width: 65%; color: #334155; }
        .totals-table td:last-child { color: #0f172a; font-weight: 700; }
        .totals-table tr.grand td { background: linear-gradient(180deg, #dbeafe 0%, #bfdbfe 100%); font-size: 11px; font-weight: 800; color: #0f172a; }
        .legal-note { margin-top: 12px; padding-top: 10px; border-top: 1px dashed #cbd5e1; font-size: 8.4px; color: #64748b; line-height: 1.5; }
        .signature-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 32px; margin-top: 30px; }
        .signature-box { text-align: center; padding-top: 18px; border-top: 1px solid #94a3b8; font-size: 9.2px; color: #475569; text-transform: uppercase; letter-spacing: 0.06em; }
        .footer { margin-top: 16px; text-align: center; font-size: 8.4px; color: #94a3b8; letter-spacing: 0.04em; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
      </style>
    `
  }

  private static renderIssuerBox(tenant?: Tenant | null, company?: Company | null): string {
    const issuer = company || tenant
    const issuerFiscalCode = company?.taxCode || tenant?.fiscalCode || ''

    return `
      <div class="sender-card">
        <div class="logo-box">
          ${issuer?.logo ? `<img src="${issuer.logo}" alt="${issuer?.name || 'NEXORA'}" style="max-width:100%; max-height:88px; object-fit:contain;">` : `<div class="logo-fallback">${(issuer?.name || 'N').slice(0, 1)}</div>`}
        </div>
        <div class="company-name">${issuer?.legalName || issuer?.name || 'NEXORA'}</div>
        <div class="company-lines">
          ${issuer?.address || ''}<br>
          ${[issuer?.postalCode, issuer?.city, issuer?.province].filter(Boolean).join(' ')}<br>
          ${issuer?.vatNumber ? `P.IVA ${issuer.vatNumber}<br>` : ''}
          ${issuerFiscalCode ? `C.F. ${issuerFiscalCode}<br>` : ''}
          ${issuer?.phone ? `TEL ${issuer.phone}<br>` : ''}
          ${issuer?.email || ''}
        </div>
      </div>
    `
  }

  private static renderPartyCard(customer: Customer): string {
    return `
      <div class="recipient-card">
        <div class="party-name">Cliente</div>
        <div class="party-lines">
          NOME/COGNOME: ${this.displayValue(customer.name)}<br>
          SEDE: ${this.displayValue(customer.address)}<br>
          CAP/CITTÀ/PROV: ${this.displayValue([customer.postalCode, customer.city, customer.province].filter(Boolean).join(' '))}<br>
          P.IVA: ${this.displayValue(customer.vatNumber)}<br>
          COD FISCALE: ${this.displayValue(customer.fiscalCode || customer.taxCode)}<br>
          CODICE CLIENTE: ${this.displayValue(customer.code)}
        </div>
      </div>
    `
  }

  private static renderMetaTable(rows: Array<{ leftLabel: string; leftValue: unknown; rightLabel: string; rightValue: unknown }>): string {
    return `
      <table class="meta-table">
        <tbody>
          ${rows.map((row) => `
            <tr>
              <th>${row.leftLabel}</th>
              <td>${this.displayValue(row.leftValue)}</td>
              <th>${row.rightLabel}</th>
              <td>${this.displayValue(row.rightValue)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `
  }

  private static renderTotalsPanel(rows: Array<{ label: string; value: string; grand?: boolean }>): string {
    return `
      <div class="totals-panel">
        <div class="panel-title">Riepilogo Importi</div>
        <table class="totals-table">
          <tbody>
            ${rows.map((row) => `
              <tr class="${row.grand ? 'grand' : ''}">
                <td>${row.label}</td>
                <td class="text-right">${row.value}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `
  }

  private static renderNotesPanel(title: string, content: unknown, secondaryTitle?: string, secondaryContent?: unknown): string {
    return `
      <div class="notes-panel">
        <div class="panel-title">${title}</div>
        <div class="panel-body">${this.multilineValue(content)}</div>
        ${secondaryTitle ? `<div class="panel-title sub-panel-title">${secondaryTitle}</div><div class="panel-body compact">${this.multilineValue(secondaryContent)}</div>` : ''}
      </div>
    `
  }

  private static formatPercentage(value: number | null | undefined): string {
    return `${new Intl.NumberFormat('it-IT', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1
    }).format(Number(value || 0))}%`
  }

  private static renderReportTable(title: string, headers: string[], rows: string[][], emptyLabel: string): string {
    return `
      <div style="margin-bottom: 14px;">
        <div class="panel-title">${title}</div>
        <table class="items-table" style="margin-bottom:0;">
          <thead>
            <tr>
              ${headers.map((header) => `<th>${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${rows.length > 0 ? rows.map((row) => `
              <tr>
                ${row.map((cell, index) => `<td class="${index > 0 ? 'text-right' : ''}">${cell}</td>`).join('')}
              </tr>
            `).join('') : `<tr><td colspan="${headers.length}" class="text-center">${emptyLabel}</td></tr>`}
          </tbody>
        </table>
      </div>
    `
  }

  private static reportTypeLabel(type: string | null | undefined): string {
    switch ((type || '').toLowerCase()) {
      case 'sales':
        return 'Report Vendite'
      case 'financial':
        return 'Report Finanziario'
      case 'customers':
        return 'Report Clienti'
      default:
        return 'Report Analitico'
    }
  }

  private static generateInvoiceHTML(data: InvoiceData): string {
    const { invoice, customer, items, tenant, company } = data

    const itemsRows = items.map((item) => `
      <tr>
        <td>${item.code || ''}</td>
        <td>${item.description}</td>
        <td class="text-center">${this.formatQuantity(item.quantity)}</td>
        <td class="text-center">${item.unit}</td>
        <td class="text-center">${item.taxRate}%</td>
        <td class="text-center">${item.discount > 0 ? `${item.discount}%` : '-'}</td>
        <td class="text-right">${this.formatCurrency(item.unitPrice)}</td>
        <td class="text-right">${this.formatCurrency(item.totalPrice)}</td>
      </tr>
    `).join('')

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Fattura ${invoice.number}</title>
        ${this.documentStyles()}
      </head>
      <body>
        <div class="document-heading">FATTURA</div>
        <div class="top-grid">
          <div>${this.renderIssuerBox(tenant, company)}</div>
          <div>${this.renderPartyCard(customer)}</div>
        </div>

        ${this.renderMetaTable([
          { leftLabel: 'Numero Fattura', leftValue: invoice.number, rightLabel: 'Data Fattura', rightValue: formatDateTime(invoice.issueDate) },
          { leftLabel: 'Pagamento', leftValue: this.translatePaymentMethod(invoice.paymentMethod), rightLabel: 'IBAN', rightValue: invoice.bankAccount },
          { leftLabel: 'Consegna', leftValue: invoice.deliveryDate ? formatDateTime(invoice.deliveryDate) : '', rightLabel: 'Scadenza', rightValue: invoice.dueDate ? formatDateTime(invoice.dueDate) : '' },
          { leftLabel: 'Stato', leftValue: this.translateStatusLabel(invoice.status), rightLabel: 'Saldo Residuo', rightValue: this.formatCurrency(invoice.balanceAmount) }
        ])}

        <table class="items-table">
          <thead>
            <tr>
              <th>Codice Prodotto</th>
              <th>Descrizione</th>
              <th class="text-center">Q.tà</th>
              <th class="text-center">U.M.</th>
              <th class="text-center">Iva</th>
              <th class="text-center">Sconto</th>
              <th class="text-right">P. Uni.</th>
              <th class="text-right">Totale</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div class="bottom-grid">
          ${this.renderNotesPanel('Note', invoice.notes, 'Note Contabili', invoice.internalNotes || invoice.customerNotes)}
          ${this.renderTotalsPanel([
            { label: 'Totale Documento (Euro)', value: this.formatCurrency(invoice.subtotal) },
            { label: 'Sconto (Euro) iva esclusa', value: invoice.discountAmount > 0 ? this.formatCurrency(invoice.discountAmount) : this.formatCurrency(0) },
            { label: 'Acconto / Pagato (Euro)', value: invoice.paidAmount > 0 ? this.formatCurrency(invoice.paidAmount) : this.formatCurrency(0) },
            { label: 'IVA (Euro)', value: this.formatCurrency(invoice.taxAmount) },
            { label: 'Totale da Pagare (Euro)', value: this.formatCurrency(Math.max(invoice.totalAmount - invoice.paidAmount, 0)), grand: true }
          ])}
        </div>

        <div class="legal-note">Documento emesso in formato gestionale. Conservare per verifica amministrativa e controllo scadenze di pagamento.</div>

        <div class="signature-row">
          <div class="signature-box">Firma Emittente</div>
          <div class="signature-box">Firma Destinatario</div>
        </div>

        <div class="footer">PDF NEXORA | ${formatDateTime(new Date())}</div>
      </body>
      </html>
    `
  }

  private static async renderPdf(htmlContent: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    try {
      const page = await browser.newPage()
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '12mm',
          right: '10mm',
          bottom: '12mm',
          left: '10mm'
        }
      })

      return Buffer.from(pdfBuffer)
    } finally {
      await browser.close()
    }
  }

  static async generateReceiptPDF(paymentData: any): Promise<Buffer> {
    const issuer = paymentData?.invoice?.company || paymentData?.invoice?.tenant
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ricevuta Pagamento</title>
        ${this.documentStyles()}
      </head>
      <body>
        <div class="document-heading">RICEVUTA PAGAMENTO</div>
        <div class="top-grid">
          <div>${this.renderIssuerBox(paymentData?.invoice?.tenant, paymentData?.invoice?.company)}</div>
          <div class="recipient-card">
            <div class="party-name">Cliente</div>
            <div class="party-lines">
              ${this.displayValue(paymentData?.invoice?.customer?.name)}<br>
              ${this.displayValue(paymentData?.invoice?.customer?.address)}<br>
              ${this.displayValue([paymentData?.invoice?.customer?.postalCode, paymentData?.invoice?.customer?.city, paymentData?.invoice?.customer?.province].filter(Boolean).join(' '))}<br>
              ${this.displayValue(paymentData?.invoice?.customer?.vatNumber)}
            </div>
          </div>
        </div>

        ${this.renderMetaTable([
          { leftLabel: 'Riferimento', leftValue: paymentData.reference || paymentData.id, rightLabel: 'Data Pagamento', rightValue: formatDateTime(paymentData.paymentDate) },
          { leftLabel: 'Metodo', leftValue: this.translatePaymentMethod(paymentData.method), rightLabel: 'Stato', rightValue: this.translateStatusLabel(paymentData.status) },
          { leftLabel: 'Fattura', leftValue: paymentData?.invoice?.number, rightLabel: 'Importo', rightValue: this.formatCurrency(paymentData.amount) }
        ])}

        <div class="bottom-grid" style="grid-template-columns:minmax(0,1fr) minmax(0,0.9fr);">
          ${this.renderNotesPanel('Dettagli Incasso', paymentData.notes || 'Pagamento registrato nel sistema NEXORA.', 'Emittente', `${issuer?.legalName || issuer?.name || 'NEXORA'}${issuer?.vatNumber ? `\nP.IVA ${issuer.vatNumber}` : ''}`)}
          ${this.renderTotalsPanel([
            { label: 'Importo Incassato', value: this.formatCurrency(paymentData.amount), grand: true }
          ])}
        </div>

        <div class="signature-row">
          <div class="signature-box">Firma Emittente</div>
          <div class="signature-box">Firma Cliente</div>
        </div>

        <div class="footer">Ricevuta generata con NEXORA | ${formatDateTime(new Date())}</div>
      </body>
      </html>
    `

    return this.renderPdf(htmlContent)
  }

  static async generateReportPDF(reportData: any): Promise<Buffer> {
    const overview = reportData?.overview || {}
    const topCustomers = Array.isArray(reportData?.topCustomers) ? reportData.topCustomers.slice(0, 8) : []
    const topProducts = Array.isArray(reportData?.topProducts) ? reportData.topProducts.slice(0, 8) : []
    const monthlyTrends = Array.isArray(reportData?.monthlyTrends) ? reportData.monthlyTrends.slice(-6) : []
    const paymentMethods = reportData?.paymentMethods && typeof reportData.paymentMethods === 'object'
      ? Object.entries(reportData.paymentMethods)
      : []

    const totalRevenue = Number(overview.totalRevenue || 0)
    const totalInvoices = Number(overview.totalInvoices || 0)
    const averageInvoiceValue = Number(overview.averageInvoiceValue || 0)
    const paidInvoices = Number(overview.paidInvoices || 0)
    const pendingInvoices = Number(overview.pendingInvoices || 0)
    const overdueInvoices = Number(overview.overdueInvoices || 0)
    const totalTax = Number(overview.totalTax || 0)
    const totalDiscount = Number(overview.totalDiscount || 0)
    const paymentRate = totalInvoices > 0 ? (paidInvoices / totalInvoices) * 100 : 0
    const growthMetrics = reportData?.growthMetrics || {}
    const reportLabel = this.reportTypeLabel(reportData?.reportType)

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${reportLabel}</title>
        ${this.documentStyles()}
        <style>
          .report-summary-grid { display:grid; grid-template-columns: minmax(0, 1.08fr) minmax(0, 0.92fr); gap:16px; margin-bottom:14px; }
          .report-kpi-grid { display:grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap:12px; margin-bottom:14px; }
          .report-kpi-card { border:1px solid #c5ccd3; padding:10px 12px; min-height:78px; background:#fff; }
          .report-kpi-label { font-size:9px; text-transform:uppercase; letter-spacing:0.04em; color:#64748b; margin-bottom:8px; }
          .report-kpi-value { font-size:16px; font-weight:700; color:#111827; }
          .report-kpi-sub { font-size:9px; color:#6b7280; margin-top:6px; }
          .report-two-col { display:grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap:16px; }
        </style>
      </head>
      <body>
        <div class="document-heading">${reportLabel.toUpperCase()}</div>

        ${this.renderMetaTable([
          { leftLabel: 'Periodo', leftValue: reportData?.period || 'N/D', rightLabel: 'Tipologia', rightValue: reportLabel },
          { leftLabel: 'Fatture Totali', leftValue: totalInvoices, rightLabel: 'Fatture Pagate', rightValue: paidInvoices },
          { leftLabel: 'Fatture Aperte', leftValue: pendingInvoices, rightLabel: 'Fatture Scadute', rightValue: overdueInvoices },
          { leftLabel: 'Data Emissione', leftValue: formatDateTime(new Date()), rightLabel: 'Sistema', rightValue: 'NEXORA Enterprise' }
        ])}

        <div class="report-kpi-grid">
          <div class="report-kpi-card">
            <div class="report-kpi-label">Fatturato Totale</div>
            <div class="report-kpi-value">${this.formatCurrency(totalRevenue)}</div>
            <div class="report-kpi-sub">Imponibile e totale vendite del periodo</div>
          </div>
          <div class="report-kpi-card">
            <div class="report-kpi-label">Valore Medio Fattura</div>
            <div class="report-kpi-value">${this.formatCurrency(averageInvoiceValue)}</div>
            <div class="report-kpi-sub">Media documento emesso</div>
          </div>
          <div class="report-kpi-card">
            <div class="report-kpi-label">Tasso Incasso</div>
            <div class="report-kpi-value">${this.formatPercentage(paymentRate)}</div>
            <div class="report-kpi-sub">Rapporto tra fatture pagate e totali</div>
          </div>
          <div class="report-kpi-card">
            <div class="report-kpi-label">Crescita Ricavi</div>
            <div class="report-kpi-value">${this.formatPercentage(Number(growthMetrics.revenueGrowth || 0))}</div>
            <div class="report-kpi-sub">Variazione rispetto al periodo precedente</div>
          </div>
        </div>

        <div class="report-summary-grid">
          ${this.renderNotesPanel(
            'Sintesi Direzionale',
            [
              `Fatturato del periodo: ${this.formatCurrency(totalRevenue)}`,
              `Numero documenti emessi: ${new Intl.NumberFormat('it-IT').format(totalInvoices)}`,
              `Documenti ancora aperti: ${new Intl.NumberFormat('it-IT').format(pendingInvoices)}`,
              `Documenti scaduti: ${new Intl.NumberFormat('it-IT').format(overdueInvoices)}`
            ].join('\n'),
            'Metriche di Crescita',
            [
              `Ricavi: ${this.formatPercentage(Number(growthMetrics.revenueGrowth || 0))}`,
              `Fatture: ${this.formatPercentage(Number(growthMetrics.invoiceGrowth || 0))}`,
              `Clienti: ${this.formatPercentage(Number(growthMetrics.customerGrowth || 0))}`
            ].join('\n')
          )}
          ${this.renderTotalsPanel([
            { label: 'Totale Ricavi', value: this.formatCurrency(totalRevenue) },
            { label: 'IVA Complessiva', value: this.formatCurrency(totalTax) },
            { label: 'Sconti Concessi', value: this.formatCurrency(totalDiscount) },
            { label: 'Valore Medio Documento', value: this.formatCurrency(averageInvoiceValue) },
            { label: 'Indice Incasso', value: this.formatPercentage(paymentRate), grand: true }
          ])}
        </div>

        ${this.renderReportTable(
          'Top Clienti',
          ['Cliente', 'Fatturato', 'Fatture', 'Ordine Medio'],
          topCustomers.map((customer: any) => [
            this.displayValue(customer?.name),
            this.formatCurrency(Number(customer?.revenue || 0)),
            new Intl.NumberFormat('it-IT').format(Number(customer?.invoices || 0)),
            this.formatCurrency(Number(customer?.avgOrderValue || 0))
          ]),
          'Nessun cliente disponibile nel periodo selezionato.'
        )}

        <div class="report-two-col">
          ${this.renderReportTable(
            'Top Prodotti',
            ['Prodotto', 'Ricavi', 'Quantità', 'Margine'],
            topProducts.map((product: any) => [
              this.displayValue(product?.product?.name || product?.productId),
              this.formatCurrency(Number(product?.revenue || 0)),
              this.formatQuantity(Number(product?.quantity || 0)),
              this.formatPercentage(Number(product?.profitMargin || 0))
            ]),
            'Nessun prodotto disponibile nel periodo selezionato.'
          )}
          ${this.renderReportTable(
            'Metodi di Pagamento',
            ['Metodo', 'Incassi', 'Operazioni'],
            paymentMethods.map(([method, stats]: any) => [
              this.displayValue(this.translatePaymentMethod(method)),
              this.formatCurrency(Number(stats?.revenue || 0)),
              new Intl.NumberFormat('it-IT').format(Number(stats?.count || 0))
            ]),
            'Nessun metodo di pagamento rilevato.'
          )}
        </div>

        ${this.renderReportTable(
          'Andamento Mensile',
          ['Periodo', 'Ricavi', 'Fatture', 'Clienti'],
          monthlyTrends.map((trend: any) => [
            this.displayValue(trend?.month || trend?.period),
            this.formatCurrency(Number(trend?.revenue || 0)),
            new Intl.NumberFormat('it-IT').format(Number(trend?.invoices || 0)),
            new Intl.NumberFormat('it-IT').format(Number(trend?.customers || 0))
          ]),
          'Nessun trend disponibile per il periodo selezionato.'
        )}

        <div class="legal-note">Report gestionale generato da NEXORA per analisi interna, monitoraggio commerciale e controllo dell'andamento economico.</div>

        <div class="footer">Report generato con NEXORA | ${formatDateTime(new Date())}</div>
      </body>
      </html>
    `

    return this.renderPdf(htmlContent)
  }
}
