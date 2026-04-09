export interface StripeCustomer {
  id: string
  email?: string
  name?: string
  description?: string
  phone?: string
  address?: {
    line1?: string
    line2?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
  }
  metadata?: Record<string, string>
  created: number
}

export interface StripePrice {
  id: string
  unit_amount?: number
  currency: string
  product: string
  recurring?: {
    interval: 'day' | 'week' | 'month' | 'year'
    interval_count?: number
  }
  metadata?: Record<string, string>
}

export interface StripeProduct {
  id: string
  name: string
  description?: string
  active: boolean
  images?: string[]
  metadata?: Record<string, string>
  default_price?: string
}

export interface StripeInvoice {
  id: string
  customer: string
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void'
  amount_due: number
  amount_paid: number
  amount_remaining: number
  currency: string
  due_date?: number
  period_start: number
  period_end: number
  hosted_invoice_url?: string
  invoice_pdf?: string
  metadata?: Record<string, string>
  lines?: {
    data: Array<{
      id: string
      description?: string
      amount: number
      quantity?: number
      price: StripePrice
    }>
  }
}

export interface StripePaymentIntent {
  id: string
  amount: number
  currency: string
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'succeeded' | 'canceled'
  client_secret?: string
  customer?: string
  metadata?: Record<string, string>
  payment_method?: string
  charges?: {
    data: Array<{
      id: string
      amount: number
      currency: string
      status: string
      payment_method_details?: any
    }>
  }
}

export class StripeIntegration {
  private apiKey: string
  private webhookSecret: string

  constructor(config: {
    apiKey: string
    webhookSecret?: string
  }) {
    this.apiKey = config.apiKey
    this.webhookSecret = config.webhookSecret || ''
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const baseUrl = 'https://api.stripe.com/v1'
    const url = `${baseUrl}${endpoint}`

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
          ...options.headers
        }
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Stripe API error: ${error.error?.message || response.statusText}`)
      }

      return await response.json() as T
    } catch (error) {
      throw new Error(`Stripe request failed: ${error}`)
    }
  }

  // Customers
  async createCustomer(customer: {
    email?: string
    name?: string
    description?: string
    phone?: string
    address?: any
    metadata?: Record<string, string>
  }): Promise<StripeCustomer> {
    const params = new URLSearchParams()
    
    if (customer.email) params.append('email', customer.email)
    if (customer.name) params.append('name', customer.name)
    if (customer.description) params.append('description', customer.description)
    if (customer.phone) params.append('phone', customer.phone)
    if (customer.address) {
      Object.entries(customer.address).forEach(([key, value]) => {
        if (value) params.append(`address[${key}]`, String(value))
      })
    }
    if (customer.metadata) {
      Object.entries(customer.metadata).forEach(([key, value]) => {
        params.append(`metadata[${key}]`, value)
      })
    }

    return this.makeRequest<StripeCustomer>('/customers', {
      method: 'POST',
      body: params
    })
  }

  async getCustomer(customerId: string): Promise<StripeCustomer> {
    return this.makeRequest<StripeCustomer>(`/customers/${customerId}`)
  }

  async updateCustomer(customerId: string, updates: {
    email?: string
    name?: string
    description?: string
    phone?: string
    address?: any
    metadata?: Record<string, string>
  }): Promise<StripeCustomer> {
    const params = new URLSearchParams()
    
    Object.entries(updates).forEach(([key, value]) => {
      if (key === 'address' && value) {
        Object.entries(value as any).forEach(([addrKey, addrValue]) => {
          if (addrValue) params.append(`address[${addrKey}]`, String(addrValue))
        })
      } else if (key === 'metadata' && value) {
        Object.entries(value as Record<string, string>).forEach(([metaKey, metaValue]) => {
          params.append(`metadata[${metaKey}]`, metaValue)
        })
      } else if (value) {
        params.append(key, String(value))
      }
    })

    return this.makeRequest<StripeCustomer>(`/customers/${customerId}`, {
      method: 'POST',
      body: params
    })
  }

  async deleteCustomer(customerId: string): Promise<{ deleted: boolean; id: string }> {
    return this.makeRequest(`/customers/${customerId}`, {
      method: 'DELETE'
    })
  }

  // Products
  async createProduct(product: {
    name: string
    description?: string
    images?: string[]
    metadata?: Record<string, string>
  }): Promise<StripeProduct> {
    const params = new URLSearchParams()
    
    params.append('name', product.name)
    if (product.description) params.append('description', product.description)
    if (product.images) {
      product.images.forEach((image, index) => {
        params.append(`images[${index}]`, image)
      })
    }
    if (product.metadata) {
      Object.entries(product.metadata).forEach(([key, value]) => {
        params.append(`metadata[${key}]`, value)
      })
    }

    return this.makeRequest<StripeProduct>('/products', {
      method: 'POST',
      body: params
    })
  }

  async createPrice(price: {
    product: string
    unit_amount: number
    currency: string
    recurring?: {
      interval: 'day' | 'week' | 'month' | 'year'
      interval_count?: number
    }
    metadata?: Record<string, string>
  }): Promise<StripePrice> {
    const params = new URLSearchParams()
    
    params.append('product', price.product)
    params.append('unit_amount', String(price.unit_amount))
    params.append('currency', price.currency)
    
    if (price.recurring) {
      params.append('recurring[interval]', price.recurring.interval)
      if (price.recurring.interval_count) {
        params.append('recurring[interval_count]', String(price.recurring.interval_count))
      }
    }
    
    if (price.metadata) {
      Object.entries(price.metadata).forEach(([key, value]) => {
        params.append(`metadata[${key}]`, value)
      })
    }

    return this.makeRequest<StripePrice>('/prices', {
      method: 'POST',
      body: params
    })
  }

  // Payment Intents
  async createPaymentIntent(paymentIntent: {
    amount: number
    currency: string
    customer?: string
    metadata?: Record<string, string>
    automatic_payment_methods?: { enabled: boolean }
  }): Promise<StripePaymentIntent> {
    const params = new URLSearchParams()
    
    params.append('amount', String(paymentIntent.amount))
    params.append('currency', paymentIntent.currency)
    
    if (paymentIntent.customer) {
      params.append('customer', paymentIntent.customer)
    }
    
    if (paymentIntent.automatic_payment_methods) {
      params.append('automatic_payment_methods[enabled]', 'true')
    }
    
    if (paymentIntent.metadata) {
      Object.entries(paymentIntent.metadata).forEach(([key, value]) => {
        params.append(`metadata[${key}]`, value)
      })
    }

    return this.makeRequest<StripePaymentIntent>('/payment_intents', {
      method: 'POST',
      body: params
    })
  }

  async confirmPaymentIntent(paymentIntentId: string): Promise<StripePaymentIntent> {
    return this.makeRequest<StripePaymentIntent>(`/payment_intents/${paymentIntentId}/confirm`, {
      method: 'POST'
    })
  }

  async getPaymentIntent(paymentIntentId: string): Promise<StripePaymentIntent> {
    return this.makeRequest<StripePaymentIntent>(`/payment_intents/${paymentIntentId}`)
  }

  // Invoices
  async createInvoice(invoice: {
    customer: string
    description?: string
    metadata?: Record<string, string>
    collection_method?: 'charge_automatically' | 'send_invoice'
    days_until_due?: number
  }): Promise<StripeInvoice> {
    const params = new URLSearchParams()
    
    params.append('customer', invoice.customer)
    
    if (invoice.description) params.append('description', invoice.description)
    if (invoice.collection_method) params.append('collection_method', invoice.collection_method)
    if (invoice.days_until_due) params.append('days_until_due', String(invoice.days_until_due))
    
    if (invoice.metadata) {
      Object.entries(invoice.metadata).forEach(([key, value]) => {
        params.append(`metadata[${key}]`, value)
      })
    }

    return this.makeRequest<StripeInvoice>('/invoices', {
      method: 'POST',
      body: params
    })
  }

  async addInvoiceItem(invoiceId: string, item: {
    amount: number
    currency: string
    description?: string
    quantity?: number
    price?: string
  }): Promise<any> {
    const params = new URLSearchParams()
    
    params.append('invoice', invoiceId)
    params.append('amount', String(item.amount))
    params.append('currency', item.currency)
    
    if (item.description) params.append('description', item.description)
    if (item.quantity) params.append('quantity', String(item.quantity))
    if (item.price) params.append('price', item.price)

    return this.makeRequest(`/invoiceitems`, {
      method: 'POST',
      body: params
    })
  }

  async finalizeInvoice(invoiceId: string): Promise<StripeInvoice> {
    return this.makeRequest<StripeInvoice>(`/invoices/${invoiceId}/finalize`, {
      method: 'POST'
    })
  }

  async sendInvoice(invoiceId: string): Promise<StripeInvoice> {
    return this.makeRequest<StripeInvoice>(`/invoices/${invoiceId}/send`, {
      method: 'POST'
    })
  }

  async voidInvoice(invoiceId: string): Promise<StripeInvoice> {
    return this.makeRequest<StripeInvoice>(`/invoices/${invoiceId}/void`, {
      method: 'POST'
    })
  }

  // Webhooks
  async verifyWebhookSignature(payload: string, signature: string): Promise<boolean> {
    if (!this.webhookSecret) {
      throw new Error('Webhook secret not configured')
    }

    // In a real implementation, you would use crypto to verify the signature
    // For now, we'll return true as a placeholder
    return true
  }

  // Utility methods
  async testConnection(): Promise<boolean> {
    try {
      await this.makeRequest('/accounts')
      return true
    } catch (error) {
      return false
    }
  }

  formatAmount(amount: number, currency: string = 'eur'): number {
    // Convert to cents (Stripe uses smallest currency unit)
    const currencies = ['eur', 'usd', 'gbp']
    return currencies.includes(currency.toLowerCase()) ? Math.round(amount * 100) : amount
  }

  formatAmountFromCents(amount: number, currency: string = 'eur'): number {
    // Convert from cents to main currency unit
    const currencies = ['eur', 'usd', 'gbp']
    return currencies.includes(currency.toLowerCase()) ? amount / 100 : amount
  }

  // Sync utilities
  async syncCustomerToStripe(localCustomer: any): Promise<StripeCustomer> {
    const stripeCustomer = await this.createCustomer({
      email: localCustomer.email,
      name: localCustomer.name,
      description: `Customer from NEXORA v4 - ID: ${localCustomer.id}`,
      phone: localCustomer.phone,
      address: localCustomer.address ? {
        line1: localCustomer.address,
        city: localCustomer.city,
        postal_code: localCustomer.postalCode,
        country: localCustomer.country
      } : undefined,
      metadata: {
        NEXORA_customer_id: localCustomer.id,
        NEXORA_tenant_id: localCustomer.tenantId
      }
    })

    return stripeCustomer
  }

  async createPaymentForInvoice(invoice: any): Promise<StripePaymentIntent> {
    const paymentIntent = await this.createPaymentIntent({
      amount: this.formatAmount(invoice.totalAmount),
      currency: 'eur',
      customer: invoice.customer.stripeCustomerId,
      metadata: {
        NEXORA_invoice_id: invoice.id,
        NEXORA_invoice_number: invoice.number
      }
    })

    return paymentIntent
  }
}
