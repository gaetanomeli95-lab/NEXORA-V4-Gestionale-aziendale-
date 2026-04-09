export interface QuickBooksCustomer {
  Id?: string
  DisplayName: string
  PrimaryEmailAddr?: {
    Address: string
  }
  PrimaryPhone?: {
    FreeFormNumber: string
  }
  BillAddr?: {
    Line1?: string
    City?: string
    PostalCode?: string
    Country?: string
  }
  Taxable?: boolean
  Balance?: number
}

export interface QuickBooksInvoice {
  Id?: string
  DocNumber?: string
  TxnDate?: string
  DueDate?: string
  TotalAmt?: number
  Balance?: number
  CustomerRef?: {
    value: string
    name: string
  }
  Line?: Array<{
    Id?: string
    Description?: string
    Amount?: number
    Qty?: number
    UnitPrice?: number
    SalesItemRef?: {
      value: string
      name: string
    }
  }>
  EmailStatus?: string
  status?: string
}

export interface QuickBooksItem {
  Id?: string
  Name?: string
  Description?: string
  Active?: boolean
  FullyQualifiedName?: string
  Taxable?: boolean
  UnitPrice?: number
  Type?: string
  IncomeAccountRef?: {
    value: string
    name: string
  }
  ExpenseAccountRef?: {
    value: string
    name: string
  }
  AssetAccountRef?: {
    value: string
    name: string
  }
}

export class QuickBooksIntegration {
  private clientId: string
  private clientSecret: string
  private environment: 'sandbox' | 'production'
  private realmId?: string
  private accessToken?: string
  private refreshToken?: string

  constructor(config: {
    clientId: string
    clientSecret: string
    environment?: 'sandbox' | 'production'
  }) {
    this.clientId = config.clientId
    this.clientSecret = config.clientSecret
    this.environment = config.environment || 'sandbox'
  }

  // Authentication
  async authenticate(): Promise<{ authUrl: string }> {
    const authUrl = `https://appcenter.intuit.com/connect/oauth2?client_id=${this.clientId}&response_type=code&scope=com.intuit.quickbooks.accounting&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_QUICKBOOKS_REDIRECT_URI || 'http://localhost:3000/api/integrations/quickbooks/callback')}&state=${Math.random().toString(36).substr(2, 9)}`
    
    return { authUrl }
  }

  async exchangeCodeForTokens(code: string, realmId: string): Promise<void> {
    try {
      const response = await fetch('https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: process.env.NEXT_PUBLIC_QUICKBOOKS_REDIRECT_URI || 'http://localhost:3000/api/integrations/quickbooks/callback'
        })
      })

      const tokens = await response.json()
      this.accessToken = tokens.access_token
      this.refreshToken = tokens.refresh_token
      this.realmId = realmId
    } catch (error) {
      throw new Error('QuickBooks authentication failed')
    }
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.accessToken || !this.realmId) {
      throw new Error('Not authenticated with QuickBooks')
    }

    const baseUrl = this.environment === 'sandbox' 
      ? 'https://sandbox-quickbooks.api.intuit.com/v3/company'
      : 'https://quickbooks.api.intuit.com/v3/company'

    const url = `${baseUrl}/${this.realmId}${endpoint}`

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers
        }
      })

      if (!response.ok) {
        throw new Error(`QuickBooks API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      throw new Error(`QuickBooks request failed: ${error}`)
    }
  }

  // Customers
  async getCustomers(): Promise<{ Customer: QuickBooksCustomer[] }> {
    return this.makeRequest<{ Customer: QuickBooksCustomer[] }>('/query?query=select * from Customer')
  }

  async createCustomer(customer: Partial<QuickBooksCustomer>): Promise<QuickBooksCustomer> {
    const response = await this.makeRequest<{ Customer: QuickBooksCustomer }>('/customer', {
      method: 'POST',
      body: JSON.stringify(customer)
    })
    return response.Customer
  }

  async updateCustomer(customerId: string, customer: Partial<QuickBooksCustomer>): Promise<QuickBooksCustomer> {
    const response = await this.makeRequest<{ Customer: QuickBooksCustomer }>(`/customer?operation=update`, {
      method: 'POST',
      body: JSON.stringify({ ...customer, Id: customerId })
    })
    return response.Customer
  }

  // Invoices
  async getInvoices(): Promise<{ Invoice: QuickBooksInvoice[] }> {
    return this.makeRequest<{ Invoice: QuickBooksInvoice[] }>('/query?query=select * from Invoice')
  }

  async createInvoice(invoice: Partial<QuickBooksInvoice>): Promise<QuickBooksInvoice> {
    const response = await this.makeRequest<{ Invoice: QuickBooksInvoice }>('/invoice', {
      method: 'POST',
      body: JSON.stringify(invoice)
    })
    return response.Invoice
  }

  async updateInvoice(invoiceId: string, invoice: Partial<QuickBooksInvoice>): Promise<QuickBooksInvoice> {
    const response = await this.makeRequest<{ Invoice: QuickBooksInvoice }>(`/invoice?operation=update`, {
      method: 'POST',
      body: JSON.stringify({ ...invoice, Id: invoiceId })
    })
    return response.Invoice
  }

  async sendInvoice(invoiceId: string, email: string): Promise<void> {
    await this.makeRequest(`/invoice/${invoiceId}/send`, {
      method: 'POST',
      body: JSON.stringify({
        SendToCustomer: true,
        EmailAddress: email
      })
    })
  }

  // Items/Products
  async getItems(): Promise<{ Item: QuickBooksItem[] }> {
    return this.makeRequest<{ Item: QuickBooksItem[] }>('/query?query=select * from Item where Type = \'Service\' or Type = \'Inventory\'')
  }

  async createItem(item: Partial<QuickBooksItem>): Promise<QuickBooksItem> {
    const response = await this.makeRequest<{ Item: QuickBooksItem }>('/item', {
      method: 'POST',
      body: JSON.stringify(item)
    })
    return response.Item
  }

  // Reports
  async getProfitAndLoss(startDate: string, endDate: string): Promise<any> {
    return this.makeRequest(`/reports/ProfitAndLoss?start_date=${startDate}&end_date=${endDate}`)
  }

  async getBalanceSheet(startDate: string, endDate: string): Promise<any> {
    return this.makeRequest(`/reports/BalanceSheet?start_date=${startDate}&end_date=${endDate}`)
  }

  async getCashFlow(startDate: string, endDate: string): Promise<any> {
    return this.makeRequest(`/reports/CashFlow?start_date=${startDate}&end_date=${endDate}`)
  }

  // Sync utilities
  async syncCustomersToQuickBooks(localCustomers: any[]): Promise<QuickBooksCustomer[]> {
    const syncedCustomers: QuickBooksCustomer[] = []
    
    for (const customer of localCustomers) {
      try {
        const qbCustomer: Partial<QuickBooksCustomer> = {
          DisplayName: customer.name,
          PrimaryEmailAddr: customer.email ? { Address: customer.email } : undefined,
          PrimaryPhone: customer.phone ? { FreeFormNumber: customer.phone } : undefined,
          BillAddr: customer.address ? {
            Line1: customer.address,
            City: customer.city,
            PostalCode: customer.postalCode,
            Country: customer.country
          } : undefined,
          Taxable: true,
          Balance: customer.outstandingBalance || 0
        }

        const created = await this.createCustomer(qbCustomer)
        syncedCustomers.push(created)
      } catch (error) {
        console.error(`Failed to sync customer ${customer.name}:`, error)
      }
    }

    return syncedCustomers
  }

  async syncInvoicesToQuickBooks(localInvoices: any[]): Promise<QuickBooksInvoice[]> {
    const syncedInvoices: QuickBooksInvoice[] = []
    
    for (const invoice of localInvoices) {
      try {
        const qbInvoice: Partial<QuickBooksInvoice> = {
          DocNumber: invoice.number,
          TxnDate: invoice.issueDate,
          DueDate: invoice.dueDate,
          TotalAmt: invoice.totalAmount,
          Balance: invoice.paidAmount ? invoice.totalAmount - invoice.paidAmount : invoice.totalAmount,
          CustomerRef: {
            value: invoice.customer.quickBooksId,
            name: invoice.customer.name
          },
          Line: invoice.items.map((item: any) => ({
            Description: item.description,
            Amount: item.totalPrice,
            Qty: item.quantity,
            UnitPrice: item.unitPrice,
            SalesItemRef: {
              value: item.product.quickBooksId,
              name: item.product.name
            }
          }))
        }

        const created = await this.createInvoice(qbInvoice)
        syncedInvoices.push(created)
      } catch (error) {
        console.error(`Failed to sync invoice ${invoice.number}:`, error)
      }
    }

    return syncedInvoices
  }

  // Webhooks
  async setupWebhook(webhookUrl: string): Promise<void> {
    await this.makeRequest('/webhooks', {
      method: 'POST',
      body: JSON.stringify({
        webhookUrl,
        events: ['CREATE', 'UPDATE', 'DELETE']
      })
    })
  }

  // Utility methods
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.makeRequest<{ Company?: unknown }>('/companyinfo/{realmId}')
      return !!response.Company
    } catch (error) {
      return false
    }
  }

  getAuthStatus(): boolean {
    return !!(this.accessToken && this.realmId)
  }

  async disconnect(): Promise<void> {
    this.accessToken = undefined
    this.refreshToken = undefined
    this.realmId = undefined
  }
}
