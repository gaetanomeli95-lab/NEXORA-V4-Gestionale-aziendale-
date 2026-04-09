import { Template, Company } from '@prisma/client'
import puppeteer from 'puppeteer'
import Handlebars from 'handlebars'
import fs from 'fs/promises'
import path from 'path'
import { formatDateTime } from '@/lib/utils'

interface TemplateCustomer {
  id: string
  tenantId?: string
  companyId?: string | null
  code?: string | null
  name: string
  legalName?: string | null
  businessName?: string | null
  firstName?: string | null
  lastName?: string | null
  taxCode?: string | null
  vatNumber?: string | null
  address?: string | null
  city?: string | null
  province?: string | null
  postalCode?: string | null
  country?: string | null
  phone?: string | null
  mobile?: string | null
  email?: string | null
  website?: string | null
  type?: string | null
  paymentTerms?: string | null
  creditLimit?: number | null
  notes?: string | null
  isActive?: boolean
  createdAt: Date
  updatedAt: Date
}

interface TemplateDocumentItem {
  id: string
  invoiceId?: string | null
  productId?: string | null
  code?: string | null
  description: string
  quantity: number
  unit?: string | null
  price?: number | null
  discount?: number | null
  vatRate?: number | null
  total: number
  order?: number | null
}

interface TemplateDocument {
  id: string
  tenantId?: string
  companyId?: string | null
  customerId: string
  number: string
  year?: number | null
  date?: Date
  issueDate?: Date
  dueDate?: Date | null
  status: string
  type: string
  paymentMethod?: string | null
  bankAccount?: string | null
  subtotal: number
  vatTotal: number
  total: number
  discount?: number | null
  discountTotal: number
  notes?: string | null
  internalNotes?: string | null
  template?: string | null
  electronicData?: string | null
  items: TemplateDocumentItem[]
  payments: unknown[]
  createdAt: Date
  updatedAt: Date
}

interface TemplateData {
  company: Company & { logo?: string | null }
  customer: TemplateCustomer
  document: TemplateDocument
  settings: {
    currency: string
    dateFormat: string
    language: string
    decimals: number
  }
}

export class TemplateEngine {
  private templatesDir = path.join(process.cwd(), 'templates')
  private outputDir = path.join(process.cwd(), 'output')

  constructor() {
    this.ensureDirectories()
    this.registerHelpers()
  }

  private async ensureDirectories() {
    try {
      await fs.access(this.templatesDir)
    } catch {
      await fs.mkdir(this.templatesDir, { recursive: true })
    }

    try {
      await fs.access(this.outputDir)
    } catch {
      await fs.mkdir(this.outputDir, { recursive: true })
    }
  }

  private registerHelpers() {
    // Date formatting helper
    Handlebars.registerHelper('formatDate', (date: Date, format: string) => {
      if (!date) return ''
      
      const d = new Date(date)
      const day = d.getDate().toString().padStart(2, '0')
      const month = (d.getMonth() + 1).toString().padStart(2, '0')
      const year = d.getFullYear()
      
      switch (format) {
        case 'DD/MM/YYYY':
          return `${day}/${month}/${year}`
        case 'MM/DD/YYYY':
          return `${month}/${day}/${year}`
        case 'YYYY-MM-DD':
          return `${year}-${month}-${day}`
        default:
          return formatDateTime(d)
      }
    })

    // Currency formatting helper
    Handlebars.registerHelper('formatCurrency', (amount: number, currency: string = 'EUR') => {
      if (typeof amount !== 'number') return '€0,00'
      
      return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount)
    })

    // Number formatting helper
    Handlebars.registerHelper('formatNumber', (number: number, decimals: number = 2) => {
      if (typeof number !== 'number') return '0'
      
      return new Intl.NumberFormat('it-IT', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      }).format(number)
    })

    // Uppercase helper
    Handlebars.registerHelper('uppercase', (str: string) => {
      return str ? str.toUpperCase() : ''
    })

    // Conditional helper
    Handlebars.registerHelper('ifEquals', function(this: unknown, arg1: unknown, arg2: unknown, options: Handlebars.HelperOptions) {
      return (arg1 == arg2) ? options.fn(this) : options.inverse(this)
    })

    // Math helpers
    Handlebars.registerHelper('multiply', (a: number, b: number) => {
      return (a || 0) * (b || 0)
    })

    Handlebars.registerHelper('add', (a: number, b: number) => {
      return (a || 0) + (b || 0)
    })

    Handlebars.registerHelper('subtract', (a: number, b: number) => {
      return (a || 0) - (b || 0)
    })

    // Percentage helper
    Handlebars.registerHelper('percentage', (value: number, total: number) => {
      if (!total || total === 0) return 0
      return ((value / total) * 100).toFixed(1)
    })

    // Status badge helper
    Handlebars.registerHelper('statusBadge', (status: string) => {
      const statusConfig = {
        DRAFT: { class: 'bg-gray-100 text-gray-800', label: 'Bozza' },
        SENT: { class: 'bg-blue-100 text-blue-800', label: 'Inviata' },
        PAID: { class: 'bg-green-100 text-green-800', label: 'Pagata' },
        OVERDUE: { class: 'bg-red-100 text-red-800', label: 'Scaduta' },
        CANCELLED: { class: 'bg-red-100 text-red-800', label: 'Annullata' }
      }
      
      const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT
      return `<span class="px-2 py-1 text-xs font-medium rounded-full ${config.class}">${config.label}</span>`
    })

    // QR Code helper (placeholder - would need QR code library)
    Handlebars.registerHelper('qrCode', (data: string) => {
      return `<div class="qr-code" data-qr="${data}"></div>`
    })
  }

  async generatePDF(
    template: Template,
    data: TemplateData,
    options: {
      filename?: string
      format?: 'A4' | 'Letter'
      orientation?: 'portrait' | 'landscape'
      margin?: string
    } = {}
  ): Promise<Buffer> {
    const {
      filename = `document-${Date.now()}.pdf`,
      format = 'A4',
      orientation = 'portrait',
      margin = '20mm'
    } = options

    try {
      // Compile template
      const compiledTemplate = Handlebars.compile(template.html)
      const html = compiledTemplate(data)

      // Add CSS styles
      const htmlWithStyles = this.addStylesToHTML(html, template.css)

      // Launch Puppeteer
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      })

      const page = await browser.newPage()

      // Set content and wait for network
      await page.setContent(htmlWithStyles, {
        waitUntil: ['networkidle0', 'domcontentloaded']
      })

      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: format as any,
        landscape: orientation === 'landscape',
        margin: {
          top: margin,
          right: margin,
          bottom: margin,
          left: margin
        },
        printBackground: true,
        preferCSSPageSize: true,
        displayHeaderFooter: true,
        headerTemplate: `
          <div style="font-size:10px; color:#666; width:100%; text-align:center; padding:5px 0;">
            Generato da NEXORA v4 il ${formatDateTime(new Date())}
          </div>
        `,
        footerTemplate: `
          <div style="font-size:10px; color:#666; width:100%; text-align:center; padding:5px 0;">
            Pagina <span class="pageNumber"></span> di <span class="totalPages"></span>
          </div>
        `
      })

      await browser.close()

      // Save PDF file
      const filePath = path.join(this.outputDir, filename)
      await fs.writeFile(filePath, pdfBuffer)

      return pdfBuffer
    } catch (error) {
      console.error('Error generating PDF:', error)
      throw new Error('Impossibile generare il PDF')
    }
  }

  async generateHTML(
    template: Template,
    data: TemplateData
  ): Promise<string> {
    try {
      const compiledTemplate = Handlebars.compile(template.html)
      const html = compiledTemplate(data)
      return this.addStylesToHTML(html, template.css)
    } catch (error) {
      console.error('Error generating HTML:', error)
      throw new Error('Impossibile generare l\'HTML')
    }
  }

  async generateEmailHTML(
    template: Template,
    data: TemplateData
  ): Promise<string> {
    try {
      const compiledTemplate = Handlebars.compile(template.html)
      const html = compiledTemplate(data)
      
      // Wrap in email-friendly HTML structure
      return this.wrapForEmail(html, template.css)
    } catch (error) {
      console.error('Error generating email HTML:', error)
      throw new Error('Impossibile generare l\'HTML per email')
    }
  }

  async createTemplate(
    name: string,
    type: string,
    html: string,
    css?: string,
    variables?: any
  ): Promise<Template> {
    // This would interact with the database
    // For now, return a mock template
    return {
      id: Date.now().toString(),
      tenantId: 'demo-tenant',
      name,
      type,
      html,
      css: css || null,
      isDefault: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  async updateTemplate(
    id: string,
    updates: Partial<Template>
  ): Promise<Template> {
    // This would update the template in the database
    throw new Error('Not implemented')
  }

  async deleteTemplate(id: string): Promise<void> {
    // This would delete the template from the database
    throw new Error('Not implemented')
  }

  async getTemplate(id: string): Promise<Template> {
    // This would retrieve the template from the database
    throw new Error('Not implemented')
  }

  async listTemplates(
    companyId: string,
    type?: string
  ): Promise<Template[]> {
    // This would list templates from the database
    throw new Error('Not implemented')
  }

  private addStylesToHTML(html: string, css?: string | null): string {
    const defaultCSS = `
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          background: white;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 20px;
        }
        
        .logo {
          max-width: 200px;
          max-height: 80px;
          margin-bottom: 10px;
        }
        
        .company-info {
          text-align: left;
          margin-bottom: 20px;
        }
        
        .customer-info {
          text-align: right;
          margin-bottom: 20px;
        }
        
        .document-info {
          background: #f9fafb;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        
        .items-table th,
        .items-table td {
          border: 1px solid #e5e7eb;
          padding: 12px;
          text-align: left;
        }
        
        .items-table th {
          background: #f3f4f6;
          font-weight: 600;
        }
        
        .items-table .text-right {
          text-align: right;
        }
        
        .totals {
          text-align: right;
          margin-bottom: 20px;
        }
        
        .totals-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
        }
        
        .totals-row.grand-total {
          font-weight: bold;
          font-size: 1.2em;
          border-top: 2px solid #e5e7eb;
          padding-top: 10px;
        }
        
        .notes {
          margin-top: 30px;
          padding: 15px;
          background: #f9fafb;
          border-radius: 8px;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          font-size: 0.9em;
          color: #666;
        }
        
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          
          .container {
            max-width: 100%;
            margin: 0;
            padding: 0;
          }
          
          .no-print {
            display: none !important;
          }
        }
      </style>
    `

    const customCSS = css ? `<style>${css}</style>` : ''
    
    return html.replace('</head>', `${defaultCSS}${customCSS}</head>`)
  }

  private wrapForEmail(html: string, css?: string | null): string {
    const emailCSS = `
      <style>
        body {
          font-family: Arial, sans-serif;
        }
        
        .email-container {
          max-width: 600px;
          margin: 0 auto;
        }
        
        .email-header {
          background: #f8f9fa;
          padding: 20px;
          text-align: center;
        }
        
        .email-body {
          padding: 20px;
          background: white;
        }
        
        .email-footer {
          background: #f8f9fa;
          padding: 20px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
        
        @media only screen and (max-width: 480px) {
          .email-container {
            width: 100% !important;
          }
        }
      </style>
    `

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Documento</title>
        ${emailCSS}
        ${css ? `<style>${css}</style>` : ''}
      </head>
      <body>
        <div class="email-container">
          <div class="email-header">
            <h2>NEXORA v4</h2>
          </div>
          <div class="email-body">
            ${html}
          </div>
          <div class="email-footer">
            <p>Questo documento è stato generato da NEXORA v4</p>
            <p>© 2024 NEXORA v4. Tutti i diritti riservati.</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  // Template validation
  validateTemplate(html: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    try {
      // Check if HTML is valid
      Handlebars.compile(html)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Errore sconosciuto'
      errors.push(`Template HTML non valido: ${message}`)
    }

    // Check for required variables
    const requiredVars = ['company', 'customer', 'document']
    const missingVars = requiredVars.filter(varName => 
      !html.includes(`{{${varName}}`) && !html.includes(`{{ ${varName}}`)
    )
    
    if (missingVars.length > 0) {
      errors.push(`Variabili richieste mancanti: ${missingVars.join(', ')}`)
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  // Preview template with sample data
  async previewTemplate(template: Template): Promise<string> {
    const sampleData: TemplateData = {
      company: {
        id: '1',
        tenantId: '1',
        name: 'Azienda Demo Srl',
        legalName: 'Azienda Demo Srl',
        taxCode: 'DEMOST12345',
        vatNumber: 'IT12345678901',
        address: 'Via Roma 123',
        city: 'Milano',
        province: 'MI',
        postalCode: '20121',
        country: 'IT',
        phone: '+39 02 12345678',
        email: 'info@demo.it',
        website: 'www.demo.it',
        logo: '/api/placeholder/200/80',
        type: 'COMPANY',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      customer: {
        id: '1',
        companyId: '1',
        code: 'CLI001',
        name: 'Mario Rossi',
        legalName: 'Mario Rossi',
        taxCode: 'RSSMRA85A01H501Z',
        vatNumber: 'IT01234567890',
        address: 'Via Milano 456',
        city: 'Roma',
        province: 'RM',
        postalCode: '00187',
        country: 'IT',
        phone: '+39 06 87654321',
        mobile: '+39 345 1234567',
        email: 'mario.rossi@email.com',
        website: '',
        type: 'INDIVIDUAL',
        paymentTerms: '30 giorni',
        creditLimit: 10000,
        notes: '',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      document: {
        id: '1',
        tenantId: '1',
        companyId: '1',
        customerId: '1',
        number: '2024-001',
        year: 2024,
        date: new Date(),
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'DRAFT',
        type: 'INVOICE',
        paymentMethod: 'BANK_TRANSFER',
        bankAccount: 'IT60 X054 2811 1010 0000 0123 456',
        subtotal: 1000,
        vatTotal: 220,
        total: 1220,
        discount: 0,
        discountTotal: 0,
        notes: 'Grazie per il vostro business',
        internalNotes: '',
        template: 'standard',
        electronicData: null,
        items: [
          {
            id: '1',
            invoiceId: '1',
            productId: '1',
            code: 'PROD001',
            description: 'Prodotto Demo',
            quantity: 2,
            unit: 'pz',
            price: 500,
            discount: 0,
            vatRate: 22,
            total: 1000,
            order: 1
          }
        ],
        payments: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      settings: {
        currency: 'EUR',
        dateFormat: 'DD/MM/YYYY',
        language: 'it',
        decimals: 2
      }
    }

    return this.generateHTML(template, sampleData)
  }
}

export const templateEngine = new TemplateEngine()
