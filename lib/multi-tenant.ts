export interface Tenant {
  id: string
  name: string
  domain?: string
  logo?: string
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'EXPIRED'
  subscription: {
    plan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'CUSTOM'
    status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED'
    startDate: Date
    endDate?: Date
    features: string[]
    limits: {
      users: number
      customers: number
      products: number
      orders: number
      storage: number // in GB
      apiCalls: number // per month
    }
  }
  settings: {
    timezone: string
    currency: string
    language: string
    dateFormat: string
    numberFormat: string
    theme: 'light' | 'dark' | 'auto'
    customBranding: {
      primaryColor: string
      secondaryColor: string
      logo?: string
      favicon?: string
    }
  }
  integrations: {
    quickbooks?: {
      connected: boolean
      realmId?: string
      lastSync?: Date
    }
    stripe?: {
      connected: boolean
      accountId?: string
      webhookSecret?: string
    }
    sendgrid?: {
      connected: boolean
      apiKey?: string
    }
    twilio?: {
      connected: boolean
      accountSid?: string
    }
    hubspot?: {
      connected: boolean
      apiKey?: string
    }
  }
  billing: {
    address: string
    city: string
    postalCode: string
    country: string
    vatNumber?: string
    paymentMethod: string
    invoices: Array<{
      id: string
      number: string
      amount: number
      status: 'PAID' | 'PENDING' | 'OVERDUE'
      dueDate: Date
      paidDate?: Date
    }>
  }
  createdAt: Date
  updatedAt: Date
}

export interface User {
  id: string
  tenantId: string
  email: string
  firstName: string
  lastName: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER' | 'VIEW_ONLY'
  permissions: string[]
  status: 'ACTIVE' | 'SUSPENDED' | 'INVITED'
  lastLogin?: Date
  preferences: {
    language: string
    timezone: string
    theme: string
    notifications: {
      email: boolean
      sms: boolean
      push: boolean
    }
  }
  createdAt: Date
  updatedAt: Date
}

export class MultiTenantManager {
  private static instance: MultiTenantManager
  private tenants: Map<string, Tenant> = new Map()
  private users: Map<string, User> = new Map()
  private currentTenant?: string

  static getInstance(): MultiTenantManager {
    if (!MultiTenantManager.instance) {
      MultiTenantManager.instance = new MultiTenantManager()
    }
    return MultiTenantManager.instance
  }

  // Tenant Management
  async createTenant(tenantData: Omit<Tenant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Tenant> {
    const tenant: Tenant = {
      ...tenantData,
      id: `tenant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.tenants.set(tenant.id, tenant)
    
    // Initialize default settings and data for new tenant
    await this.initializeTenantData(tenant.id)
    
    return tenant
  }

  async updateTenant(tenantId: string, updates: Partial<Tenant>): Promise<Tenant | null> {
    const tenant = this.tenants.get(tenantId)
    if (!tenant) return null

    const updatedTenant: Tenant = {
      ...tenant,
      ...updates,
      updatedAt: new Date()
    }

    this.tenants.set(tenantId, updatedTenant)
    return updatedTenant
  }

  async deleteTenant(tenantId: string): Promise<boolean> {
    const deleted = this.tenants.delete(tenantId)
    if (deleted) {
      // Clean up tenant data
      await this.cleanupTenantData(tenantId)
    }
    return deleted
  }

  getTenant(tenantId: string): Tenant | undefined {
    return this.tenants.get(tenantId)
  }

  getAllTenants(): Tenant[] {
    return Array.from(this.tenants.values())
  }

  // User Management
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const user: User = {
      ...userData,
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    this.users.set(user.id, user)
    return user
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    const user = this.users.get(userId)
    if (!user) return null

    const updatedUser: User = {
      ...user,
      ...updates,
      updatedAt: new Date()
    }

    this.users.set(userId, updatedUser)
    return updatedUser
  }

  async deleteUser(userId: string): Promise<boolean> {
    return this.users.delete(userId)
  }

  getUser(userId: string): User | undefined {
    return this.users.get(userId)
  }

  getUsersByTenant(tenantId: string): User[] {
    return Array.from(this.users.values()).filter(user => user.tenantId === tenantId)
  }

  // Authentication & Authorization
  async authenticateUser(email: string, password: string, domain?: string): Promise<{ user: User; tenant: Tenant } | null> {
    // Find user by email
    const user = Array.from(this.users.values()).find(u => u.email === email)
    if (!user) return null

    // Get tenant
    const tenant = this.tenants.get(user.tenantId)
    if (!tenant) return null

    // Check domain if provided
    if (domain && tenant.domain !== domain) return null

    // Check tenant status
    if (tenant.status !== 'ACTIVE') return null

    // Check subscription
    if (tenant.subscription.status !== 'ACTIVE') return null

    // In a real implementation, verify password hash
    // For now, we'll assume password is correct
    
    // Update last login
    await this.updateUser(user.id, { lastLogin: new Date() })

    return { user, tenant }
  }

  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const user = this.users.get(userId)
    if (!user) return false

    // Super admin has all permissions
    if (user.role === 'SUPER_ADMIN') return true

    // Check explicit permissions
    return user.permissions.includes(permission)
  }

  async hasRole(userId: string, role: string): Promise<boolean> {
    const user = this.users.get(userId)
    if (!user) return false

    return user.role === role
  }

  // Subscription Management
  async upgradeSubscription(tenantId: string, plan: Tenant['subscription']['plan']): Promise<Tenant | null> {
    const tenant = this.tenants.get(tenantId)
    if (!tenant) return null

    const planFeatures = this.getPlanFeatures(plan)
    const planLimits = this.getPlanLimits(plan)

    const updatedTenant: Tenant = {
      ...tenant,
      subscription: {
        ...tenant.subscription,
        plan,
        status: 'ACTIVE',
        startDate: new Date(),
        features: planFeatures,
        limits: planLimits
      },
      updatedAt: new Date()
    }

    this.tenants.set(tenantId, updatedTenant)
    return updatedTenant
  }

  async checkSubscriptionLimits(tenantId: string): Promise<{ withinLimits: boolean; warnings: string[] }> {
    const tenant = this.tenants.get(tenantId)
    if (!tenant) return { withinLimits: false, warnings: ['Tenant not found'] }

    const warnings: string[] = []
    const users = this.getUsersByTenant(tenantId)
    let withinLimits = true

    // Check user limit
    if (users.length >= tenant.subscription.limits.users) {
      warnings.push(`User limit reached: ${users.length}/${tenant.subscription.limits.users}`)
      withinLimits = false
    }

    // Check other limits (in a real implementation, query actual data)
    // For now, we'll use mock data
    const mockData = {
      customers: 150,
      products: 80,
      orders: 450,
      storage: 2.5 // GB
    }

    if (mockData.customers >= tenant.subscription.limits.customers) {
      warnings.push(`Customer limit reached: ${mockData.customers}/${tenant.subscription.limits.customers}`)
    }

    if (mockData.products >= tenant.subscription.limits.products) {
      warnings.push(`Product limit reached: ${mockData.products}/${tenant.subscription.limits.products}`)
    }

    if (mockData.orders >= tenant.subscription.limits.orders) {
      warnings.push(`Order limit reached: ${mockData.orders}/${tenant.subscription.limits.orders}`)
    }

    if (mockData.storage >= tenant.subscription.limits.storage) {
      warnings.push(`Storage limit reached: ${mockData.storage}GB/${tenant.subscription.limits.storage}GB`)
    }

    return { withinLimits, warnings }
  }

  // Data Isolation
  async getTenantData(tenantId: string, dataType: 'customers' | 'products' | 'orders' | 'invoices'): Promise<any[]> {
    // In a real implementation, query database with tenant filter
    // For now, return mock data
    const mockData = {
      customers: [
        { id: '1', name: 'Customer 1', tenantId },
        { id: '2', name: 'Customer 2', tenantId }
      ],
      products: [
        { id: '1', name: 'Product 1', tenantId },
        { id: '2', name: 'Product 2', tenantId }
      ],
      orders: [
        { id: '1', number: 'ORD-001', tenantId },
        { id: '2', number: 'ORD-002', tenantId }
      ],
      invoices: [
        { id: '1', number: 'INV-001', tenantId },
        { id: '2', number: 'INV-002', tenantId }
      ]
    }

    return mockData[dataType] || []
  }

  // Theme and Branding
  async getTenantTheme(tenantId: string): Promise<Tenant['settings']['customBranding']> {
    const tenant = this.tenants.get(tenantId)
    return tenant?.settings.customBranding || {
      primaryColor: '#2563eb',
      secondaryColor: '#64748b',
      logo: undefined,
      favicon: undefined
    }
  }

  async updateTenantTheme(tenantId: string, theme: Partial<Tenant['settings']['customBranding']>): Promise<void> {
    const tenant = this.tenants.get(tenantId)
    if (!tenant) return

    const updatedTenant: Tenant = {
      ...tenant,
      settings: {
        ...tenant.settings,
        customBranding: {
          ...tenant.settings.customBranding,
          ...theme
        }
      },
      updatedAt: new Date()
    }

    this.tenants.set(tenantId, updatedTenant)
  }

  // Utility Methods
  getPlanFeatures(plan: Tenant['subscription']['plan']): string[] {
    const features = {
      STARTER: [
        'basic_crud',
        'dashboard',
        'reports_basic',
        'email_support',
        '1_user'
      ],
      PROFESSIONAL: [
        'basic_crud',
        'dashboard',
        'reports_advanced',
        'ai_insights',
        'workflows',
        'integrations_basic',
        'email_support',
        '10_users'
      ],
      ENTERPRISE: [
        'basic_crud',
        'dashboard',
        'reports_advanced',
        'ai_insights',
        'workflows',
        'integrations_full',
        'api_access',
        'white_label',
        'priority_support',
        'unlimited_users',
        'custom_domain'
      ],
      CUSTOM: [
        'basic_crud',
        'dashboard',
        'reports_advanced',
        'ai_insights',
        'workflows',
        'integrations_full',
        'api_access',
        'white_label',
        'priority_support',
        'unlimited_users',
        'custom_domain',
        'custom_features'
      ]
    }

    return features[plan] || features.STARTER
  }

  getPlanLimits(plan: Tenant['subscription']['plan']): Tenant['subscription']['limits'] {
    const limits = {
      STARTER: {
        users: 1,
        customers: 100,
        products: 50,
        orders: 200,
        storage: 1,
        apiCalls: 1000
      },
      PROFESSIONAL: {
        users: 10,
        customers: 1000,
        products: 500,
        orders: 2000,
        storage: 10,
        apiCalls: 10000
      },
      ENTERPRISE: {
        users: 100,
        customers: 10000,
        products: 5000,
        orders: 20000,
        storage: 100,
        apiCalls: 100000
      },
      CUSTOM: {
        users: 999999,
        customers: 999999,
        products: 999999,
        orders: 999999,
        storage: 1000,
        apiCalls: 1000000
      }
    }

    return limits[plan] || limits.STARTER
  }

  private async initializeTenantData(tenantId: string): Promise<void> {
    // Initialize default data for new tenant
    console.log(`Initializing data for tenant: ${tenantId}`)
    
    // In a real implementation, create default categories, settings, etc.
    // For now, we'll just log the initialization
  }

  private async cleanupTenantData(tenantId: string): Promise<void> {
    // Clean up all data associated with tenant
    console.log(`Cleaning up data for tenant: ${tenantId}`)
    
    // In a real implementation, delete all tenant data from database
    // For now, we'll just log the cleanup
  }

  // Current Context
  setCurrentTenant(tenantId: string): void {
    this.currentTenant = tenantId
  }

  getCurrentTenant(): string | undefined {
    return this.currentTenant
  }

  // Analytics and Monitoring
  async getTenantAnalytics(tenantId: string): Promise<{
    users: number
    customers: number
    products: number
    orders: number
    revenue: number
    storage: number
    apiCalls: number
  }> {
    const users = this.getUsersByTenant(tenantId)
    
    // In a real implementation, query actual data
    return {
      users: users.length,
      customers: 150,
      products: 80,
      orders: 450,
      revenue: 3371.64,
      storage: 2.5,
      apiCalls: 5420
    }
  }

  async getTenantUsageStats(tenantId: string): Promise<{
    users: { current: number; limit: number; percentage: number }
    customers: { current: number; limit: number; percentage: number }
    products: { current: number; limit: number; percentage: number }
    orders: { current: number; limit: number; percentage: number }
    storage: { current: number; limit: number; percentage: number }
    apiCalls: { current: number; limit: number; percentage: number }
  }> {
    const tenant = this.tenants.get(tenantId)
    if (!tenant) throw new Error('Tenant not found')

    const limits = tenant.subscription.limits
    const analytics = await this.getTenantAnalytics(tenantId)

    return {
      users: {
        current: analytics.users,
        limit: limits.users,
        percentage: (analytics.users / limits.users) * 100
      },
      customers: {
        current: analytics.customers,
        limit: limits.customers,
        percentage: (analytics.customers / limits.customers) * 100
      },
      products: {
        current: analytics.products,
        limit: limits.products,
        percentage: (analytics.products / limits.products) * 100
      },
      orders: {
        current: analytics.orders,
        limit: limits.orders,
        percentage: (analytics.orders / limits.orders) * 100
      },
      storage: {
        current: analytics.storage,
        limit: limits.storage,
        percentage: (analytics.storage / limits.storage) * 100
      },
      apiCalls: {
        current: analytics.apiCalls,
        limit: limits.apiCalls,
        percentage: (analytics.apiCalls / limits.apiCalls) * 100
      }
    }
  }
}
