import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { formatDateTime } from '@/lib/utils'
import puppeteer from 'puppeteer'

export const dynamic = 'force-dynamic'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount)
}

function formatDate(date: Date | string): string {
  return formatDateTime(date)
}

function baseStyles(): string {
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
      .logo-box img { max-width: 100%; max-height: 88px; object-fit: contain; }
      .logo-fallback { font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: 0.08em; }
      .company-name, .party-name { font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; color: #0f172a; margin-bottom: 8px; }
      .company-lines, .party-lines, .document-lines, .info-lines { font-size: 10.2px; line-height: 1.65; text-transform: uppercase; color: #334155; }
      .document-card { display: flex; flex-direction: column; justify-content: space-between; background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%); color: #f8fafc; }
      .document-title { font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.14em; text-align: center; margin-bottom: 12px; }
      .document-lines { color: #e2e8f0; }
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
      .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 16px; }
      .legal-note { margin-top: 12px; padding-top: 10px; border-top: 1px dashed #cbd5e1; font-size: 8.4px; color: #64748b; line-height: 1.5; }
      .signature-row { display: grid; grid-template-columns: repeat(2, 1fr); gap: 32px; margin-top: 30px; }
      .signature-row.signature-row--three { grid-template-columns: repeat(3, 1fr); gap: 18px; }
      .signature-box { text-align: center; padding-top: 18px; border-top: 1px solid #94a3b8; font-size: 9.2px; color: #475569; text-transform: uppercase; letter-spacing: 0.06em; }
      .footer { margin-top: 16px; text-align: center; font-size: 8.4px; color: #94a3b8; letter-spacing: 0.04em; }
      .text-right { text-align: right; }
      .text-center { text-align: center; }
      @media print {
        body { padding: 6mm; }
        .no-print { display: none; }
      }
    </style>
  `
}

function companyHeader(tenant: any): string {
  return `
    <div class="sender-card">
      <div class="logo-box">
        ${tenant?.logo ? `<img src="${tenant.logo}" alt="${tenant?.name || 'NEXORA'}">` : `<div class="logo-fallback">${(tenant?.name || 'N').slice(0, 1)}</div>`}
      </div>
      <div class="company-name">${tenant?.legalName || tenant?.name || 'NEXORA V4 Enterprise'}</div>
      <div class="company-lines">
        ${tenant?.address || ''}<br>
        ${tenant?.postalCode || ''} ${tenant?.city || ''}${tenant?.province ? ` ${tenant.province}` : ''}<br>
        ${tenant?.vatNumber ? `P.IVA ${tenant.vatNumber}<br>` : ''}
        ${tenant?.fiscalCode ? `C.F. ${tenant.fiscalCode}<br>` : ''}
        ${tenant?.phone ? `TEL ${tenant.phone}<br>` : ''}
        ${tenant?.email || ''}
      </div>
    </div>
  `
}

function displayValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '&nbsp;'
  }

  return String(value)
}

function multilineValue(value: unknown): string {
  return displayValue(value).replace(/\n/g, '<br>')
}

function formatShippingAddress(value: unknown): string {
  if (!value) {
    return ''
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (parsed && typeof parsed === 'object') {
        return [
          (parsed as Record<string, unknown>).street,
          [
            (parsed as Record<string, unknown>).postalCode,
            (parsed as Record<string, unknown>).city
          ].filter(Boolean).join(' '),
          (parsed as Record<string, unknown>).country
        ].filter((entry): entry is string => typeof entry === 'string' && entry.length > 0).join(', ')
      }
    } catch {
      return value
    }

    return value
  }

  if (typeof value === 'object') {
    const address = value as Record<string, unknown>
    return [
      address.street,
      [address.postalCode, address.city].filter(Boolean).join(' '),
      address.country
    ].filter((entry): entry is string => typeof entry === 'string' && entry.length > 0).join(', ')
  }

  return ''
}

const ESTIMATE_DELIVERY_ADDRESS_MARKER = '[[DELIVERY_ADDRESS]]:'

function extractEstimateDeliveryMetadata(value: unknown): { cleanNotes: string; deliveryAddress: string } {
  if (typeof value !== 'string' || !value.trim()) {
    return {
      cleanNotes: typeof value === 'string' ? value : '',
      deliveryAddress: ''
    }
  }

  let deliveryAddress = ''
  const cleanNotes = value
    .split('\n')
    .filter((line) => {
      if (line.startsWith(ESTIMATE_DELIVERY_ADDRESS_MARKER)) {
        deliveryAddress = line.slice(ESTIMATE_DELIVERY_ADDRESS_MARKER.length).trim()
        return false
      }

      return true
    })
    .join('\n')
    .trim()

  return {
    cleanNotes,
    deliveryAddress
  }
}

function formatQuantity(value: number): string {
  return new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2
  }).format(value)
}

function humanizeEnumLabel(value: string) {
  return value
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function translateEnumValue(value: unknown, labels: Record<string, string>) {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  const normalized = String(value).trim().toUpperCase()
  return labels[normalized] || humanizeEnumLabel(normalized)
}

function translatePaymentMethod(value: unknown) {
  return translateEnumValue(value, {
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

function translateStatusLabel(value: unknown) {
  return translateEnumValue(value, {
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
    IN_LAVORAZIONE: 'In lavorazione',
  })
}

function translatePriorityLabel(value: unknown) {
  return translateEnumValue(value, {
    LOW: 'Bassa',
    MEDIUM: 'Media',
    HIGH: 'Alta',
    URGENT: 'Urgente',
  })
}

function translateTransportMethod(value: unknown) {
  return translateEnumValue(value, {
    PICKUP: 'Ritiro in sede',
    DELIVERY: 'Consegna',
    COURIER: 'Corriere',
    TRUCK: 'Automezzo',
    HAND_DELIVERY: 'Consegna a mano',
  })
}

function renderPartyCard(label: string, entity: any): string {
  return `
    <div class="recipient-card">
      <div class="party-name">${label}</div>
      <div class="party-lines">
        NOME/COGNOME: ${displayValue(entity?.name)}<br>
        SEDE: ${displayValue(entity?.address)}<br>
        CAP/CITTÀ/PROV: ${displayValue([entity?.postalCode, entity?.city, entity?.province].filter(Boolean).join(' '))}<br>
        P.IVA: ${displayValue(entity?.vatNumber)}<br>
        COD FISCALE: ${displayValue(entity?.fiscalCode || entity?.taxCode)}<br>
        CODICE CLIENTE: ${displayValue(entity?.code)}
      </div>
    </div>
  `
}

function renderMetaTable(rows: Array<{ leftLabel: string; leftValue: unknown; rightLabel: string; rightValue: unknown }>): string {
  return `
    <table class="meta-table">
      <tbody>
        ${rows.map((row) => `
          <tr>
            <th>${row.leftLabel}</th>
            <td>${displayValue(row.leftValue)}</td>
            <th>${row.rightLabel}</th>
            <td>${displayValue(row.rightValue)}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `
}

function renderTotalsPanel(rows: Array<{ label: string; value: string; grand?: boolean }>): string {
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

function renderNotesPanel(title: string, content: unknown, secondaryTitle?: string, secondaryContent?: unknown): string {
  return `
    <div class="notes-panel">
      <div class="panel-title">${title}</div>
      <div class="panel-body">${multilineValue(content)}</div>
      ${secondaryTitle ? `<div class="panel-title sub-panel-title">${secondaryTitle}</div><div class="panel-body compact">${multilineValue(secondaryContent)}</div>` : ''}
    </div>
  `
}

function renderSignatureRow(labels: string[]): string {
  return `
    <div class="signature-row ${labels.length === 3 ? 'signature-row--three' : ''}">
      ${labels.map((label) => `<div class="signature-box">${label}</div>`).join('')}
    </div>
  `
}

async function renderPdfFromHtml(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '8mm',
        bottom: '10mm',
        left: '8mm'
      }
    })

    return Buffer.from(pdfBuffer)
  } finally {
    await browser.close()
  }
}

async function generateEstimateHTML(id: string, tenantId: string): Promise<string> {
  const estimate = await prisma.estimate.findFirst({
    where: { id, tenantId },
    include: {
      customer: true,
      items: { include: { product: true }, orderBy: { sortOrder: 'asc' } }
    }
  })
  if (!estimate) throw new Error('Preventivo non trovato')

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })

  const itemsRows = estimate.items.map(item => `
    <tr>
      <td>${item.code || ''}</td>
      <td>${item.description}</td>
      <td class="text-center">${formatQuantity(item.quantity)}</td>
      <td class="text-center">${item.unit}</td>
      <td class="text-center">${item.vatRate}%</td>
      <td class="text-center">${item.taxRate}%</td>
      <td class="text-right">${formatCurrency(item.unitPrice)}</td>
      <td class="text-center">${item.discount > 0 ? `${item.discount}%` : '-'}</td>
      <td class="text-right">${formatCurrency(item.totalPrice)}</td>
    </tr>
  `).join('')

  const { cleanNotes, deliveryAddress } = extractEstimateDeliveryMetadata(estimate.internalNotes)
  const recipient = deliveryAddress
    ? {
        ...estimate.customer,
        address: deliveryAddress,
        postalCode: '',
        city: '',
        province: ''
      }
    : estimate.customer

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Preventivo ${estimate.number}</title>${baseStyles()}</head><body>
    <div class="document-heading">PREVENTIVO</div>
    <div class="top-grid">
      <div>${companyHeader(tenant)}</div>
      <div>${renderPartyCard('Destinatario', recipient)}</div>
    </div>
    ${renderMetaTable([
      { leftLabel: 'Numero Preventivo', leftValue: estimate.number, rightLabel: 'Data Preventivo', rightValue: formatDate(estimate.issueDate) },
      { leftLabel: 'Pagamento', leftValue: translatePaymentMethod(estimate.paymentMethod), rightLabel: 'Consegna', rightValue: estimate.deliveryDate ? formatDate(estimate.deliveryDate) : '' },
      { leftLabel: 'Scadenza', leftValue: estimate.dueDate ? formatDate(estimate.dueDate) : '', rightLabel: 'Stato', rightValue: translateStatusLabel(estimate.status) }
    ])}

    <table class="items-table">
      <thead><tr><th>Codice Prodotto</th><th>Descrizione</th><th class="text-center">Q.tà</th><th class="text-center">U.M.</th><th class="text-center">Iva</th><th class="text-center">Natura Iva</th><th class="text-right">P. Uni.</th><th class="text-center">Sconto</th><th class="text-right">Totale</th></tr></thead>
      <tbody>${itemsRows}</tbody>
    </table>
    <div class="bottom-grid">
      ${renderNotesPanel('Note', estimate.notes, 'Note Contabili', cleanNotes || (estimate.depositAmount > 0 ? `Acconto versato ${formatCurrency(estimate.depositAmount)}` : ''))}
      ${renderTotalsPanel([
        { label: 'Totale Merce', value: formatCurrency(estimate.subtotal) },
        { label: 'Sconto (Euro)', value: estimate.discountAmount > 0 ? `-${formatCurrency(estimate.discountAmount)}` : formatCurrency(0) },
        { label: 'Acconto (Euro)', value: estimate.depositAmount > 0 ? formatCurrency(estimate.depositAmount) : formatCurrency(0) },
        { label: 'Totale Documento (Euro)', value: formatCurrency(estimate.totalAmount) },
        { label: 'Totale da Pagare (Euro)', value: formatCurrency(Math.max(estimate.totalAmount - estimate.depositAmount, 0)), grand: true }
      ])}

    </div>
    <div class="legal-note">Documento commerciale valido ai fini amministrativi. Verificare dati anagrafici, condizioni di pagamento e importi prima della conferma definitiva.</div>
    ${renderSignatureRow(['Firma Emittente', 'Firma Destinatario'])}
    <div class="footer">Stampa NEXORA | ${formatDate(new Date())}</div>
    <script>window.onload = function() { window.print(); }</script>
  </body></html>`
}

async function generateInvoiceHTML(id: string, tenantId: string): Promise<string> {
  const invoice = await prisma.invoice.findFirst({
    where: { id, tenantId },
    include: {
      customer: true,
      items: { include: { product: true } }
    }
  })
  if (!invoice) throw new Error('Fattura non trovata')

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })

  const itemsRows = invoice.items.map(item => `
    <tr>
      <td>${item.code || ''}</td>
      <td>${item.description}</td>
      <td class="text-center">${formatQuantity(item.quantity)}</td>
      <td class="text-center">${item.unit}</td>
      <td class="text-center">${item.taxRate}%</td>
      <td class="text-center">${item.discount > 0 ? `${item.discount}%` : '-'}</td>
      <td class="text-right">${formatCurrency(item.unitPrice)}</td>
      <td class="text-right">${formatCurrency(item.totalPrice)}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Fattura ${invoice.number}</title>${baseStyles()}</head><body>
    <div class="document-heading">FATTURA</div>
    <div class="top-grid">
      <div>${companyHeader(tenant)}</div>
      <div>${renderPartyCard('Cliente', invoice.customer)}</div>
    </div>
    ${renderMetaTable([
      { leftLabel: 'Numero Fattura', leftValue: invoice.number, rightLabel: 'Data Fattura', rightValue: formatDate(invoice.issueDate) },
      { leftLabel: 'Pagamento', leftValue: translatePaymentMethod(invoice.paymentMethod), rightLabel: 'IBAN', rightValue: invoice.bankAccount },
      { leftLabel: 'Consegna', leftValue: invoice.deliveryDate ? formatDate(invoice.deliveryDate) : '', rightLabel: 'Scadenza', rightValue: invoice.dueDate ? formatDate(invoice.dueDate) : '' }
    ])}

    <table class="items-table">
      <thead><tr><th>Codice Prodotto</th><th>Descrizione</th><th class="text-center">Q.tà</th><th class="text-center">U.M.</th><th class="text-center">Iva</th><th class="text-center">Sconto</th><th class="text-right">P. Uni.</th><th class="text-right">Totale</th></tr></thead>
      <tbody>${itemsRows}</tbody>
    </table>
    <div class="bottom-grid">
      ${renderNotesPanel('Note', invoice.notes, 'Note Contabili', invoice.internalNotes || invoice.customerNotes)}
      ${renderTotalsPanel([
        { label: 'Totale Documento (Euro)', value: formatCurrency(invoice.subtotal) },
        { label: 'Sconto (Euro) iva esclusa', value: invoice.discountAmount > 0 ? formatCurrency(invoice.discountAmount) : formatCurrency(0) },
        { label: 'Acconto / Pagato (Euro)', value: invoice.paidAmount > 0 ? formatCurrency(invoice.paidAmount) : formatCurrency(0) },
        { label: 'IVA (Euro)', value: formatCurrency(invoice.taxAmount) },
        { label: 'Totale da Pagare (Euro)', value: formatCurrency(Math.max(invoice.totalAmount - invoice.paidAmount, 0)), grand: true }
      ])}

    </div>
    <div class="legal-note">Documento emesso in formato gestionale. Conservare per verifica amministrativa e controllo scadenze di pagamento.</div>
    ${renderSignatureRow(['Firma Emittente', 'Firma Destinatario'])}
    <div class="footer">Stampa NEXORA | ${formatDate(new Date())}</div>
    <script>window.onload = function() { window.print(); }</script>
  </body></html>`
}

async function generateDdtHTML(id: string, tenantId: string): Promise<string> {
  const ddt = await prisma.ddt.findFirst({
    where: { id, tenantId },
    include: { customer: true }
  })
  if (!ddt) throw new Error('DDT non trovato')

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
  const items = ddt.itemsPayload ? JSON.parse(ddt.itemsPayload) : []

  const itemsRows = items.map((item: any) => `
    <tr>
      <td>${item.code || ''}</td>
      <td>${item.description || ''}</td>
      <td class="text-center">${item.quantity ? formatQuantity(Number(item.quantity)) : ''}</td>
      <td class="text-center">${item.unit || 'pz'}</td>
      <td>${item.notes || ''}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>DDT ${ddt.number}</title>${baseStyles()}</head><body>
    <div class="document-heading">DOCUMENTO DI TRASPORTO</div>
    <div class="top-grid">
      <div>${companyHeader(tenant)}</div>
      <div class="document-card">
        <div class="document-title">D.D.T.</div>
        <div class="document-lines">
          N. ${displayValue(ddt.number)}<br>
          DEL ${formatDate(ddt.issueDate)}<br><br>
          A MEZZO ${displayValue(translateTransportMethod(ddt.transportMethod))}<br>
          CAUSALE DEL TRASPORTO ${displayValue(ddt.referenceNumber || 'VENDITA')}
        </div>
      </div>
    </div>
    <div class="info-grid">
      <div class="info-card">
        <div class="panel-title">Cessionario / Destinatario</div>
        <div class="panel-body info-lines">
          ${displayValue(ddt.customer?.name)}<br>
          ${displayValue(ddt.customer?.address)}<br>
          ${displayValue([ddt.customer?.city, ddt.customer?.province].filter(Boolean).join(' '))}<br>
          ${displayValue(ddt.customer?.vatNumber)}
        </div>
      </div>
      <div class="info-card">
        <div class="panel-title">Luogo di Destinazione</div>
        <div class="panel-body info-lines">
          ${displayValue(ddt.customer?.address)}<br>
          ${displayValue([ddt.customer?.postalCode, ddt.customer?.city, ddt.customer?.province].filter(Boolean).join(' '))}<br><br>
          VS ORDINE N. ${displayValue(ddt.referenceNumber)}<br>
          PORTO: FRANCO
        </div>
      </div>
    </div>
    <table class="items-table">
      <thead><tr><th>Codice Prodotto</th><th>Descrizione</th><th class="text-center">U.M.</th><th class="text-center">Quantità</th><th>Annotazioni</th></tr></thead>
      <tbody>${itemsRows}</tbody>
    </table>
    <div class="bottom-grid" style="grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);">
      ${renderNotesPanel('Annotazioni', ddt.notes, 'Dettagli Trasporto', `${translateTransportMethod(ddt.transportMethod) || ''}${ddt.referenceNumber ? `\nRif. ${ddt.referenceNumber}` : ''}`)}
      <div class="notes-panel">
        <div class="panel-title">Riepilogo Trasporto</div>
        <table class="totals-table">
          <tbody>
            <tr><td>Aspetto esteriore dei beni</td><td class="text-right">PALLETTIZZATO</td></tr>
            <tr><td>Colli</td><td class="text-right">${items.length || 1}</td></tr>
            <tr><td>Peso Kg</td><td class="text-right">${formatQuantity(items.reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0))}</td></tr>
            <tr class="grand"><td>Documento</td><td class="text-right">DDT ${displayValue(ddt.number)}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
    ${renderSignatureRow(['Firma del Conducente', 'Firma del Vettore', 'Firma del Destinatario'])}
    <div class="footer">Stampa NEXORA | ${formatDate(new Date())}</div>
    <script>window.onload = function() { window.print(); }</script>
  </body></html>`
}

async function generateSupplierOrderHTML(id: string, tenantId: string): Promise<string> {
  const order = await prisma.supplierOrder.findFirst({
    where: { id, tenantId },
    include: {
      supplier: true,
      items: { include: { product: true } }
    }
  })
  if (!order) throw new Error('Ordine fornitore non trovato')

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })

  const itemsRows = order.items.map(item => `
    <tr>
      <td>${item.product?.code || item.product?.sku || ''}</td>
      <td>${item.description}</td>
      <td class="text-center">${formatQuantity(Number(item.quantity || 0))}</td>
      <td class="text-center">${item.unit || 'pz'}</td>
      <td class="text-right">${formatCurrency(item.unitPrice)}</td>
      <td class="text-center">${item.taxRate}%</td>
      <td class="text-right">${formatCurrency(item.totalPrice)}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ordine Fornitore ${order.number}</title>${baseStyles()}</head><body>
    <div class="document-heading">ORDINE FORNITORE</div>
    <div class="top-grid">
      <div>${companyHeader(tenant)}</div>
      <div class="recipient-card">
        <div class="party-name">Fornitore</div>
        <div class="party-lines">
          RAGIONE SOCIALE: ${displayValue(order.supplier?.name)}<br>
          SEDE: ${displayValue(order.supplier?.address)}<br>
          CAP/CITTÀ/PROV: ${displayValue([order.supplier?.postalCode, order.supplier?.city, order.supplier?.province].filter(Boolean).join(' '))}<br>
          P.IVA: ${displayValue(order.supplier?.vatNumber)}<br>
          COD FISCALE: ${displayValue(order.supplier?.fiscalCode)}<br>
          CONTATTO: ${displayValue(order.supplier?.email || order.supplier?.phone)}
        </div>
      </div>
    </div>
    ${renderMetaTable([
      { leftLabel: 'Numero Ordine', leftValue: order.number, rightLabel: 'Data Ordine', rightValue: formatDate(order.orderDate) },
      { leftLabel: 'Stato Carico', leftValue: translateStatusLabel(order.loadingStatus), rightLabel: 'Stato Pagamento', rightValue: translateStatusLabel(order.paymentStatus) },
      { leftLabel: 'Fornitore', leftValue: order.supplier?.name, rightLabel: 'Totale Documento', rightValue: formatCurrency(order.totalAmount) }
    ])}

    <table class="items-table">
      <thead><tr><th>Codice</th><th>Descrizione</th><th class="text-center">Q.tà</th><th class="text-center">U.M.</th><th class="text-right">Prezzo</th><th class="text-center">IVA</th><th class="text-right">Totale</th></tr></thead>
      <tbody>${itemsRows}</tbody>
    </table>
    <div class="bottom-grid">
      ${renderNotesPanel('Note Ordine', order.notes, 'Operatività', 'Verificare disponibilità articoli, tempi di consegna e condizioni di carico.')}

      ${renderTotalsPanel([
        { label: 'Totale Imponibile', value: formatCurrency(order.items.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0)) },
        { label: 'Totale Documento', value: formatCurrency(order.totalAmount), grand: true }
      ])}

    </div>
    <div class="legal-note">Ordine fornitore generato dal gestionale NEXORA. Validare quantità, prezzi e tempi di consegna prima dell'invio al fornitore.</div>
    ${renderSignatureRow(['Firma Ufficio Acquisti', 'Firma Fornitore'])}
    <div class="footer">Documento generato da NEXORA | ${formatDate(new Date())}</div>
    <script>window.onload = function() { window.print(); }</script>
  </body></html>`
}

async function generateOrderHTML(id: string, tenantId: string): Promise<string> {
  const order = await prisma.order.findFirst({
    where: { id, tenantId },
    include: {
      customer: true,
      items: { include: { product: true } }
    }
  })

  if (!order) throw new Error('Ordine cliente non trovato')

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
  const shippingAddress = formatShippingAddress(order.shippingAddress)
  const recipient = order.customer || {
    name: 'Cliente non associato',
    address: shippingAddress,
    postalCode: '',
    city: '',
    province: '',
    vatNumber: '',
    fiscalCode: '',
    code: ''
  }

  const subtotal = Number(order.subtotal || order.items.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0))
  const taxAmount = Number(order.taxAmount || 0)

  const itemsRows = order.items.map(item => `
    <tr>
      <td>${item.product?.code || item.product?.sku || ''}</td>
      <td>${item.description}</td>
      <td class="text-center">${formatQuantity(Number(item.quantity || 0))}</td>
      <td class="text-center">${item.taxRate}%</td>
      <td class="text-right">${formatCurrency(Number(item.unitPrice || 0))}</td>
      <td class="text-right">${formatCurrency(Number(item.totalPrice || 0))}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Ordine ${order.number || order.id}</title>${baseStyles()}</head><body>
    <div class="document-heading">ORDINE CLIENTE / VENDITA BANCO</div>
    <div class="top-grid">
      <div>${companyHeader(tenant)}</div>
      <div>${renderPartyCard('Cliente', recipient)}</div>
    </div>
    ${renderMetaTable([
      { leftLabel: 'Numero Ordine', leftValue: order.number || order.id, rightLabel: 'Data Ordine', rightValue: formatDate(order.orderDate) },
      { leftLabel: 'Stato Ordine', leftValue: translateStatusLabel(order.status), rightLabel: 'Priorità', rightValue: translatePriorityLabel(order.priority) },
      { leftLabel: 'Pagamento', leftValue: translateStatusLabel(order.paymentStatus), rightLabel: 'Tracking', rightValue: order.trackingNumber },
      { leftLabel: 'Consegna Prevista', leftValue: order.expectedDeliveryDate ? formatDate(order.expectedDeliveryDate) : '', rightLabel: 'Consegna Effettiva', rightValue: order.actualDeliveryDate ? formatDate(order.actualDeliveryDate) : '' }
    ])}

    <table class="items-table">
      <thead><tr><th>Codice</th><th>Descrizione</th><th class="text-center">Q.tà</th><th class="text-center">IVA</th><th class="text-right">Prezzo</th><th class="text-right">Totale</th></tr></thead>
      <tbody>${itemsRows || '<tr><td colspan="6" class="text-center">Nessun articolo presente</td></tr>'}</tbody>
    </table>

    <div class="bottom-grid">
      ${renderNotesPanel('Note Ordine', order.notes, 'Spedizione e Operatività', `${shippingAddress || 'Indirizzo spedizione non specificato'}${order.internalNotes ? `\n${order.internalNotes}` : ''}`)}
      ${renderTotalsPanel([
        { label: 'Totale Imponibile', value: formatCurrency(subtotal) },
        { label: 'IVA', value: formatCurrency(taxAmount) },
        { label: 'Totale Documento', value: formatCurrency(Number(order.totalAmount || 0)), grand: true }
      ])}
    </div>

    <div class="legal-note">Ordine cliente generato da NEXORA. Verificare stato spedizione, pagamento e note operative prima della consegna definitiva.</div>
    ${renderSignatureRow(['Firma Operatore', 'Firma Cliente'])}
    <div class="footer">Documento generato da NEXORA | ${formatDate(new Date())}</div>
    <script>window.onload = function() { window.print(); }</script>
  </body></html>`
}

async function generateRepairHTML(id: string, tenantId: string): Promise<string> {
  const repair = await prisma.repair.findFirst({
    where: { id, tenantId },
    include: { customer: true }
  })

  if (!repair) throw new Error('Riparazione non trovata')

  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
  const customer = repair.customer || {
    name: 'Cliente non associato',
    address: '',
    postalCode: '',
    city: '',
    province: '',
    vatNumber: '',
    fiscalCode: '',
    taxCode: '',
    code: ''
  }
  const deviceLabel = [repair.brand, repair.model].filter(Boolean).join(' ') || 'Dispositivo non specificato'
  const paymentSummary = [
    `Stato pagamento: ${translateStatusLabel(repair.paymentStatus)}`,
    `Acconto registrato: ${formatCurrency(Number(repair.depositAmount || 0))}`,
    `Importo incassato: ${formatCurrency(Number(repair.paidAmount || 0))}`
  ].join('\n')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Riparazione ${repair.number}</title>${baseStyles()}</head><body>
    <div class="document-heading">SCHEDA RIPARAZIONE</div>
    <div class="top-grid">
      <div>${companyHeader(tenant)}</div>
      <div>${renderPartyCard('Cliente', customer)}</div>
    </div>
    ${renderMetaTable([
      { leftLabel: 'Numero Riparazione', leftValue: repair.number, rightLabel: 'Data Entrata', rightValue: formatDate(repair.repairDate) },
      { leftLabel: 'Consegna Prevista', leftValue: repair.deliveryDate ? formatDate(repair.deliveryDate) : '', rightLabel: 'Stato Lavorazione', rightValue: translateStatusLabel(repair.status) },
      { leftLabel: 'Dispositivo', leftValue: deviceLabel, rightLabel: 'Stato Pagamento', rightValue: translateStatusLabel(repair.paymentStatus) },
      { leftLabel: 'Seriale', leftValue: repair.serialNumber, rightLabel: 'Saldo Residuo', rightValue: formatCurrency(Number(repair.balanceAmount || 0)) }
    ])}

    <div class="info-grid">
      <div class="info-card">
        <div class="panel-title">Descrizione Intervento</div>
        <div class="panel-body info-lines">${multilineValue(repair.description || 'Intervento tecnico da definire')}</div>
      </div>
      <div class="info-card">
        <div class="panel-title">Dati Tecnici</div>
        <div class="panel-body info-lines">
          MARCA ${displayValue(repair.brand)}<br>
          MODELLO ${displayValue(repair.model)}<br>
          NUMERO SERIALE ${displayValue(repair.serialNumber)}<br>
          DATA CONSEGNA ${displayValue(repair.deliveryDate ? formatDate(repair.deliveryDate) : '')}
        </div>
      </div>
    </div>

    <div class="bottom-grid">
      ${renderNotesPanel('Note Cliente', repair.notes, 'Note Tecniche', repair.internalNotes || paymentSummary)}
      ${renderTotalsPanel([
        { label: 'Totale Intervento (Euro)', value: formatCurrency(Number(repair.totalAmount || 0)) },
        { label: 'Acconto (Euro)', value: formatCurrency(Number(repair.depositAmount || 0)) },
        { label: 'Pagato (Euro)', value: formatCurrency(Number(repair.paidAmount || 0)) },
        { label: 'Saldo da Incassare (Euro)', value: formatCurrency(Number(repair.balanceAmount || 0)), grand: true }
      ])}
    </div>

    <div class="legal-note">Scheda intervento generata da NEXORA. Verificare descrizione, stato lavorazione e importi prima della consegna al cliente.</div>
    ${renderSignatureRow(['Firma Accettazione', 'Firma Tecnico', 'Firma Cliente'])}
    <div class="footer">Documento generato da NEXORA | ${formatDate(new Date())}</div>
    <script>window.onload = function() { window.print(); }</script>
  </body></html>`
}

async function generateWarehouseHTML(tenantId: string): Promise<string> {
  const [tenant, products, recentMovements] = await Promise.all([
    prisma.tenant.findUnique({ where: { id: tenantId } }),
    prisma.product.findMany({
      where: { tenantId, isActive: true },
      include: {
        category: true,
        supplier: true
      },
      orderBy: { name: 'asc' }
    }),
    prisma.stockMovement.findMany({
      where: { tenantId },
      include: {
        product: {
          select: {
            name: true,
            sku: true
          }
        }
      },
      orderBy: { movementDate: 'desc' },
      take: 12
    })
  ])

  const stats = products.reduce((accumulator, product) => {
    const stock = Number(product.stockQuantity || 0)
    const unitCost = Number(product.costPrice || product.unitPrice || 0)
    accumulator.totalItems += 1
    accumulator.totalStock += stock
    accumulator.totalValue += stock * unitCost
    if (stock <= 0) accumulator.outOfStock += 1
    else if (stock <= Number(product.minStockLevel || 0)) accumulator.lowStock += 1
    return accumulator
  }, {
    totalItems: 0,
    totalStock: 0,
    totalValue: 0,
    lowStock: 0,
    outOfStock: 0
  })

  const itemsRows = products.map(product => {
    const stock = Number(product.stockQuantity || 0)
    const unitCost = Number(product.costPrice || product.unitPrice || 0)
    const status = stock <= 0 ? 'Esaurito' : stock <= Number(product.minStockLevel || 0) ? 'Sotto scorta' : 'Disponibile'
    const location = [product.warehouseName, product.location].filter(Boolean).join(' - ')

    return `
      <tr>
        <td>${product.code || product.sku || ''}</td>
        <td>${product.name}</td>
        <td>${product.category?.name || '-'}</td>
        <td>${displayValue(location || '-')}</td>
        <td class="text-right">${formatQuantity(stock)} ${product.unitOfMeasure || 'pz'}</td>
        <td class="text-right">${formatQuantity(Number(product.minStockLevel || 0))}</td>
        <td class="text-right">${product.maxStockLevel ? formatQuantity(Number(product.maxStockLevel)) : '-'}</td>
        <td>${status}</td>
        <td class="text-right">${formatCurrency(stock * unitCost)}</td>
      </tr>
    `
  }).join('')

  const movementRows = recentMovements.map(movement => `
    <tr>
      <td>${formatDate(movement.movementDate)}</td>
      <td>${movement.product?.name || 'N/D'}${movement.product?.sku ? ` (${movement.product.sku})` : ''}</td>
      <td>${movement.movementType === 'IN' ? 'Carico' : movement.movementType === 'OUT' ? 'Scarico' : 'Rettifica'}</td>
      <td class="text-right">${formatQuantity(Number(movement.quantity || 0))}</td>
      <td>${movement.reference || movement.referenceNumber || '-'}</td>
      <td>${movement.notes || movement.reason || '-'}</td>
    </tr>
  `).join('')

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Report Magazzino</title>${baseStyles()}</head><body>
    <div class="document-heading">REPORT MAGAZZINO</div>
    <div class="top-grid">
      <div>${companyHeader(tenant)}</div>
      <div class="document-card">
        <div class="document-title">Snapshot Operativo</div>
        <div class="document-lines">
          DATA REPORT ${formatDate(new Date())}<br>
          ARTICOLI ATTIVI ${stats.totalItems}<br>
          PEZZI TOTALI ${formatQuantity(stats.totalStock)}<br>
          SCORTE BASSE ${stats.lowStock}<br>
          ARTICOLI ESAURITI ${stats.outOfStock}
        </div>
      </div>
    </div>
    ${renderMetaTable([
      { leftLabel: 'Articoli', leftValue: stats.totalItems, rightLabel: 'Pezzi Totali', rightValue: formatQuantity(stats.totalStock) },
      { leftLabel: 'Valore Magazzino', leftValue: formatCurrency(stats.totalValue), rightLabel: 'Sotto Scorta', rightValue: stats.lowStock },
      { leftLabel: 'Esauriti', leftValue: stats.outOfStock, rightLabel: 'Movimenti Recenti', rightValue: recentMovements.length }
    ])}

    <table class="items-table">
      <thead><tr><th>Codice</th><th>Prodotto</th><th>Categoria</th><th>Ubicazione</th><th class="text-right">Giacenza</th><th class="text-right">Min</th><th class="text-right">Max</th><th>Stato</th><th class="text-right">Valore</th></tr></thead>
      <tbody>${itemsRows || '<tr><td colspan="9" class="text-center">Nessun articolo presente a magazzino</td></tr>'}</tbody>
    </table>

    <div class="bottom-grid">
      ${renderNotesPanel('Operatività', 'Report utile per controllo scorte, priorità di riordino e verifica ubicazioni.', 'Focus immediato', `${stats.lowStock} prodotti sotto scorta\n${stats.outOfStock} prodotti esauriti`)}
      ${renderTotalsPanel([
        { label: 'Valore complessivo', value: formatCurrency(stats.totalValue) },
        { label: 'Articoli sotto scorta', value: String(stats.lowStock) },
        { label: 'Articoli esauriti', value: String(stats.outOfStock), grand: true }
      ])}

      <div class="notes-panel" style="margin-bottom: 10px;">
        <div class="panel-title">Movimenti Recenti</div>
        <div class="panel-body" style="padding: 0; min-height: auto;">
          <table class="items-table" style="margin-bottom: 0;">
            <thead><tr><th>Data</th><th>Prodotto</th><th>Tipo</th><th class="text-right">Q.tà</th><th>Riferimento</th><th>Note</th></tr></thead>
            <tbody>${movementRows || '<tr><td colspan="6" class="text-center">Nessun movimento recente disponibile</td></tr>'}</tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="footer">Documento generato da NEXORA | ${formatDate(new Date())}</div>
    <script>window.onload = function() { window.print(); }</script>
  </body></html>`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const id = searchParams.get('id')
    const format = searchParams.get('format') || 'html'
    const session = await getServerSession(authOptions)
    const tenantId = (session?.user as { tenantId?: string } | undefined)?.tenantId || searchParams.get('tenantId') || 'demo-tenant'
    const logo = searchParams.get('logo')

    if (!type || !id) {
      return NextResponse.json({ success: false, error: 'Parametro tipo o identificativo mancante' }, { status: 400 })
    }

    let html: string

    if (logo) {
      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } })
      if (tenant && tenant.logo !== logo) {
        await prisma.tenant.update({
          where: { id: tenantId },
          data: { logo }
        })
      }
    }

    switch (type) {
      case 'estimate':
        html = await generateEstimateHTML(id, tenantId)
        break
      case 'invoice':
        html = await generateInvoiceHTML(id, tenantId)
        break
      case 'repair':
        html = await generateRepairHTML(id, tenantId)
        break
      case 'order':
        html = await generateOrderHTML(id, tenantId)
        break
      case 'ddt':
        html = await generateDdtHTML(id, tenantId)
        break
      case 'warehouse':
        html = await generateWarehouseHTML(tenantId)
        break
      case 'supplier-order':
        html = await generateSupplierOrderHTML(id, tenantId)
        break
      default:
        return NextResponse.json({ success: false, error: 'Tipo documento non valido' }, { status: 400 })
    }

    if (format === 'pdf') {
      const pdf = await renderPdfFromHtml(html)
      return new NextResponse(Uint8Array.from(pdf), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${type}-${id}.pdf"`
        }
      })
    }

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    })
  } catch (error: any) {
    console.error('Error generating print:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Impossibile generare la stampa' },
      { status: 500 }
    )
  }
}

