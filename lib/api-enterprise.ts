// Enterprise API System with Validation, Permissions, Rate Limiting
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import jwt from 'jsonwebtoken'
import rateLimit from 'express-rate-limit'
import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

// JWT Secret
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key'

// Rate Limiting
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests' }
})

// Permission System
export const PERMISSIONS = {
  // Tenant Management
  TENANT_READ: 'tenant:read',
  TENANT_UPDATE: 'tenant:update',
  TENANT_DELETE: 'tenant:delete',
  TENANT_MANAGE: 'tenant:manage',
  TENANT_CREATE: 'tenant:create',
  
  // User Management
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  
  // Customer Management
  CUSTOMER_CREATE: 'customer:create',
  CUSTOMER_READ: 'customer:read',
  CUSTOMER_UPDATE: 'customer:update',
  CUSTOMER_DELETE: 'customer:delete',
  
  // Order Management
  ORDER_CREATE: 'order:create',
  ORDER_READ: 'order:read',
  ORDER_UPDATE: 'order:update',
  ORDER_DELETE: 'order:delete',
  
  // Payment Management
  PAYMENT_CREATE: 'payment:create',
  PAYMENT_READ: 'payment:read',
  PAYMENT_UPDATE: 'payment:update',
  PAYMENT_DELETE: 'payment:delete',
  
  // Invoice Management
  INVOICE_CREATE: 'invoice:create',
  INVOICE_READ: 'invoice:read',
  INVOICE_UPDATE: 'invoice:update',
  INVOICE_DELETE: 'invoice:delete',
  INVOICE_APPROVE: 'invoice:approve',
  INVOICE_SEND: 'invoice:send',
  
  // Product Management
  PRODUCT_CREATE: 'product:create',
  PRODUCT_READ: 'product:read',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',
  
  // Workflow Management
  WORKFLOW_CREATE: 'workflow:create',
  WORKFLOW_READ: 'workflow:read',
  WORKFLOW_UPDATE: 'workflow:update',
  WORKFLOW_DELETE: 'workflow:delete',
  WORKFLOW_EXECUTE: 'workflow:execute',
  
  // Integrations
  INTEGRATION_MANAGE: 'integration:manage',
  
  // Analytics
  ANALYTICS_VIEW: 'analytics:view',
  ANALYTICS_EXPORT: 'analytics:export',
  
  // System
  SYSTEM_ADMIN: 'system:admin',
  SYSTEM_AUDIT: 'system:audit'
}

// Role-Based Access Control
export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: Object.values(PERMISSIONS),
  ADMIN: [
    PERMISSIONS.TENANT_READ,
    PERMISSIONS.TENANT_UPDATE,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.CUSTOMER_UPDATE,
    PERMISSIONS.CUSTOMER_DELETE,
    PERMISSIONS.ORDER_CREATE,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.ORDER_DELETE,
    PERMISSIONS.PAYMENT_CREATE,
    PERMISSIONS.PAYMENT_READ,
    PERMISSIONS.PAYMENT_UPDATE,
    PERMISSIONS.PAYMENT_DELETE,
    PERMISSIONS.INVOICE_CREATE,
    PERMISSIONS.INVOICE_READ,
    PERMISSIONS.INVOICE_UPDATE,
    PERMISSIONS.INVOICE_DELETE,
    PERMISSIONS.INVOICE_APPROVE,
    PERMISSIONS.INVOICE_SEND,
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.PRODUCT_UPDATE,
    PERMISSIONS.PRODUCT_DELETE,
    PERMISSIONS.WORKFLOW_CREATE,
    PERMISSIONS.WORKFLOW_READ,
    PERMISSIONS.WORKFLOW_UPDATE,
    PERMISSIONS.WORKFLOW_DELETE,
    PERMISSIONS.WORKFLOW_EXECUTE,
    PERMISSIONS.INTEGRATION_MANAGE,
    PERMISSIONS.TENANT_MANAGE,
    PERMISSIONS.TENANT_CREATE,
    PERMISSIONS.ANALYTICS_VIEW,
    PERMISSIONS.ANALYTICS_EXPORT,
    PERMISSIONS.SYSTEM_AUDIT
  ],
  MANAGER: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.CUSTOMER_CREATE,
    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.CUSTOMER_UPDATE,
    PERMISSIONS.ORDER_CREATE,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.PAYMENT_CREATE,
    PERMISSIONS.PAYMENT_READ,
    PERMISSIONS.PAYMENT_UPDATE,
    PERMISSIONS.INVOICE_CREATE,
    PERMISSIONS.INVOICE_READ,
    PERMISSIONS.INVOICE_UPDATE,
    PERMISSIONS.INVOICE_SEND,
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.PRODUCT_UPDATE,
    PERMISSIONS.WORKFLOW_CREATE,
    PERMISSIONS.WORKFLOW_READ,
    PERMISSIONS.WORKFLOW_UPDATE,
    PERMISSIONS.WORKFLOW_EXECUTE,
    PERMISSIONS.ANALYTICS_VIEW
  ],
  USER: [
    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.PAYMENT_READ,
    PERMISSIONS.INVOICE_READ,
    PERMISSIONS.INVOICE_CREATE,
    PERMISSIONS.PRODUCT_READ
  ],
  VIEWER: [
    PERMISSIONS.CUSTOMER_READ,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.PAYMENT_READ,
    PERMISSIONS.INVOICE_READ,
    PERMISSIONS.PRODUCT_READ
  ]
}

// Authentication Middleware
export async function authenticate(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    let userId: string | undefined

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const decoded = jwt.verify(token, JWT_SECRET) as any
      userId = decoded.userId
    } else {
      const session = await getServerSession(authOptions)
      userId = (session?.user as { id?: string } | undefined)?.id
    }

    if (!userId) {
      throw new Error('User not authenticated')
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenant: true
      }
    })

    if (!user || !user.isActive) {
      throw new Error('User not found or inactive')
    }

    return user
  } catch (error) {
    throw new Error('Authentication failed')
  }
}

// Authorization Middleware
export function authorize(user: any, permission: string): boolean {
  if (!user || !user.role) return false

  const resolvedPermission = permission in PERMISSIONS
    ? PERMISSIONS[permission as keyof typeof PERMISSIONS]
    : permission

  const userPermissions = ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS] || []
  return userPermissions.includes(resolvedPermission)
}

// Validation Schemas
export const Schemas = {
  // Customer Validation
  customer: z.object({
    type: z.enum(['COMPANY', 'INDIVIDUAL', 'PRIVATE']).default('COMPANY'),
    businessName: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    vatNumber: z.string().optional(),
    fiscalCode: z.string().optional(),
    billingAddress: z.object({
      street: z.string(),
      city: z.string(),
      postalCode: z.string(),
      country: z.string().default('IT')
    }).optional(),
    paymentTerms: z.enum(['NET15', 'NET30', 'NET60', 'NET90', 'IMMEDIATE']).optional(),
    creditLimit: z.number().min(0).default(0),
    tags: z.array(z.string()).default([])
  }),

  // Invoice Validation
  invoice: z.object({
    customerId: z.string().min(1),
    issueDate: z.date(),
    dueDate: z.date(),
    paymentTerms: z.string().optional(),
    paymentMethod: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(z.object({
      productId: z.string().optional(),
      description: z.string().min(1),
      quantity: z.number().min(0),
      unitPrice: z.number().min(0),
      discount: z.number().min(0).default(0),
      taxRate: z.number().min(0).default(22)
    })).min(1)
  }),

  // Product Validation
  product: z.object({
    sku: z.string().optional(),
    name: z.string().min(1),
    description: z.string().optional(),
    unitPrice: z.number().min(0),
    costPrice: z.number().min(0).optional(),
    stockQuantity: z.number().min(0).default(0),
    minStockLevel: z.number().min(0).default(0),
    trackStock: z.boolean().default(true),
    taxRate: z.number().min(0).default(22),
    tags: z.array(z.string()).default([])
  })
}

// API Response Helper
export class ApiResponse {
  static success<T>(data: T, message?: string) {
    return NextResponse.json({
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    })
  }

  static error(message: string, status: number = 400, details?: any) {
    return NextResponse.json({
      success: false,
      error: message,
      details,
      timestamp: new Date().toISOString()
    }, { status })
  }

  static paginated<T>(data: T[], page: number, limit: number, total: number) {
    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      timestamp: new Date().toISOString()
    })
  }
}

// Audit Logging
export async function auditLog(
  tenantId: string,
  userId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  oldValues?: any,
  newValues?: any,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        action,
        entityType,
        entityId,
        oldValues: oldValues ? JSON.stringify(oldValues) : null,
        newValues: newValues ? JSON.stringify(newValues) : null,
        ipAddress,
        userAgent
      }
    })
  } catch (error) {
    console.error('Failed to create audit log:', error)
  }
}

// Business Logic Validators
export class BusinessValidators {
  static async validateCustomerVatNumber(tenantId: string, vatNumber: string, excludeId?: string) {
    if (!vatNumber) return true
    
    const existing = await prisma.customer.findFirst({
      where: {
        tenantId,
        vatNumber,
        ...(excludeId && { id: { not: excludeId } })
      }
    })
    
    return !existing
  }

  static async validateProductSku(tenantId: string, sku: string, excludeId?: string) {
    if (!sku) return true
    
    const existing = await prisma.product.findFirst({
      where: {
        tenantId,
        sku,
        ...(excludeId && { id: { not: excludeId } })
      }
    })
    
    return !existing
  }

  static async validateInvoiceNumber(tenantId: string, number: string, excludeId?: string) {
    const existing = await prisma.invoice.findFirst({
      where: {
        tenantId,
        number,
        ...(excludeId && { id: { not: excludeId } })
      }
    })
    
    return !existing
  }

  static async validateCreditLimit(tenantId: string, customerId: string, newAmount: number) {
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
      include: {
        invoices: {
          where: { status: { not: 'PAID' } }
        }
      }
    })

    if (!customer) return false

    const currentDebt = customer.invoices.reduce((sum, invoice) => {
      return sum + (invoice.totalAmount - invoice.paidAmount)
    }, 0)

    return (currentDebt + newAmount) <= customer.creditLimit
  }

  static async validateStockAvailability(productId: string, quantity: number) {
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product || !product.trackStock) return true

    return product.stockQuantity >= quantity
  }
}

// Advanced Search & Filtering
export class QueryBuilder {
  static buildWhereClause(filters: any, tenantId: string) {
    const where: any = { tenantId }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } }
      ]
    }

    if (filters.status) {
      where.status = filters.status
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {}
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom)
      }
      if (filters.dateTo) {
        where.createdAt.lte = new Date(filters.dateTo)
      }
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags }
    }

    return where
  }

  static buildOrderBy(sortBy: string, sortOrder: 'asc' | 'desc' = 'desc') {
    const order: any = {}
    order[sortBy] = sortOrder
    return order
  }
}

// Cache System
export class CacheManager {
  private static cache = new Map<string, { data: any, expiry: number }>()

  static set(key: string, data: any, ttl: number = 300000) { // 5 minutes default
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    })
  }

  static get(key: string): any | null {
    const item = this.cache.get(key)
    if (!item) return null

    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }

    return item.data
  }

  static delete(key: string) {
    this.cache.delete(key)
  }

  static clear() {
    this.cache.clear()
  }
}

// Notification System
export class NotificationManager {
  static async create(
    tenantId: string,
    userId: string | null,
    type: string,
    title: string,
    message: string,
    channels: string[] = ['IN_APP'],
    metadata?: any
  ) {
    const notification = await prisma.notification.create({
      data: {
        tenantId,
        userId,
        type,
        title,
        message,
        channels: JSON.stringify(channels),
        metadata: metadata ? JSON.stringify(metadata) : null
      }
    })

    // Send notifications based on channels
    if (channels.includes('EMAIL')) {
      // TODO: Send email
    }

    if (channels.includes('SMS')) {
      // TODO: Send SMS
    }

    return notification
  }

  static async sendInvoiceCreated(tenantId: string, invoiceId: string) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true }
    })

    if (!invoice) return

    await this.create(
      tenantId,
      null,
      'INFO',
      'Nuova Fattura Creata',
      `Fattura ${invoice.number} creata per ${invoice.customer.name}`,
      ['IN_APP'],
      { invoiceId }
    )
  }

  static async sendLowStockAlert(tenantId: string, productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId }
    })

    if (!product) return

    await this.create(
      tenantId,
      null,
      'WARNING',
      'Scorte in Esaurimento',
      `Prodotto ${product.name} con scorte basse (${product.stockQuantity} unità)`,
      ['IN_APP', 'EMAIL'],
      { productId }
    )
  }
}

// Export Utilities
export class ExportManager {
  static async exportToCsv(data: any[], filename: string) {
    // TODO: Implement CSV export
  }

  static async exportToPdf(data: any, filename: string) {
    // TODO: Implement PDF export
  }

  static async exportToExcel(data: any[], filename: string) {
    // TODO: Implement Excel export
  }
}

// Integration System
export class IntegrationManager {
  static async syncWithQuickbooks(tenantId: string) {
    // TODO: Implement QuickBooks sync
  }

  static async syncWithStripe(tenantId: string) {
    // TODO: Implement Stripe sync
  }

  static async sendToSdi(invoiceId: string) {
    // TODO: Implement SDI electronic invoicing
  }
}
