import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { ApiResponse, authenticate, authorize, auditLog } from '@/lib/api-enterprise'
import { authOptions } from '@/lib/auth'
import { parseDateTimeInput } from '@/lib/utils'

export const dynamic = 'force-dynamic'

async function resolveTenantId(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (authorize(user, 'PAYMENT_READ') || authorize(user, 'PAYMENT_CREATE')) {
      return user.tenantId
    }
  } catch {
    // Fallback to session/query/header resolution below
  }

  const session = await getServerSession(authOptions)

  return (session?.user as { tenantId?: string } | undefined)?.tenantId ||
    request.headers.get('x-tenant-id') ||
    new URL(request.url).searchParams.get('tenantId') ||
    'demo-tenant'
}

function getInvoiceDocumentStatus(invoice: { dueDate: Date }, paidAmount: number, totalAmount: number) {
  if (paidAmount >= totalAmount) {
    return 'PAID'
  }

  if (invoice.dueDate.getTime() < Date.now()) {
    return 'OVERDUE'
  }

  return paidAmount > 0 ? 'PARTIAL' : 'SENT'
}

function getInvoicePaymentStatus(paidAmount: number, totalAmount: number) {
  if (paidAmount >= totalAmount) {
    return 'PAID'
  }

  return paidAmount > 0 ? 'PARTIAL' : 'UNPAID'
}

function buildPeriodFilter(period: string | null) {
  if (!period) return null

  const now = new Date()
  let startDate = new Date()
  let endDate = now

  switch (period) {
    case 'today':
      startDate.setHours(0, 0, 0, 0)
      break
    case 'week':
      startDate.setDate(now.getDate() - 7)
      break
    case 'month':
      startDate.setMonth(now.getMonth() - 1)
      break
    case 'quarter':
      startDate.setMonth(now.getMonth() - 3)
      break
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1)
      break
    default:
      return null
  }

  return period === 'today'
    ? { gte: startDate }
    : { gte: startDate, lte: endDate }
}

function normalizeMethod(method?: string | null) {
  const value = (method || '').toUpperCase()

  if (value === 'CONTANTI') return 'CASH'
  if (value === 'BONIFICO') return 'BANK_TRANSFER'
  if (value === 'CARTA') return 'CREDIT_CARD'
  if (value === 'ASSEGNO') return 'CHECK'
  return method || 'ALTRO'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = await resolveTenantId(request)
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const method = searchParams.get('method')
    const period = searchParams.get('period')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    const sortBy = searchParams.get('sortBy') || 'paymentDate'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const periodFilter = buildPeriodFilter(period)

    const paymentWhere: any = { tenantId }
    const expenseWhere: any = { tenantId }
    
    if (search) {
      paymentWhere.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { invoice: { number: { contains: search, mode: 'insensitive' } } },
        { invoice: { customer: { name: { contains: search, mode: 'insensitive' } } } },
        { invoice: { customer: { email: { contains: search, mode: 'insensitive' } } } },
        { estimate: { number: { contains: search, mode: 'insensitive' } } },
        { order: { number: { contains: search, mode: 'insensitive' } } },
        { customer: { name: { contains: search, mode: 'insensitive' } } }
      ]

      expenseWhere.OR = [
        { category: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status) {
      paymentWhere.status = status

      if (status !== 'PAID') {
        expenseWhere.id = '__no_expense_match__'
      }
    }

    if (method) {
      paymentWhere.method = method
      expenseWhere.paymentMethod = method === 'CASH'
        ? 'CONTANTI'
        : method === 'BANK_TRANSFER'
        ? 'BONIFICO'
        : method === 'CREDIT_CARD'
        ? 'CARTA'
        : method === 'CHECK'
        ? 'ASSEGNO'
        : method
    }

    if (periodFilter) {
      paymentWhere.paymentDate = periodFilter
      expenseWhere.expenseDate = periodFilter
    }

    const [payments, expenses] = await Promise.all([
      prisma.payment.findMany({
        where: paymentWhere,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          invoice: {
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          estimate: {
            select: {
              id: true,
              number: true
            }
          },
          order: {
            select: {
              id: true,
              number: true
            }
          }
        },
      }),
      prisma.expense.findMany({
        where: expenseWhere
      })
    ])

    const ledgerEntries = [
      ...payments.map(payment => ({
        ...payment,
        entryType: 'PAYMENT' as const,
        category: null
      })),
      ...expenses.map(expense => ({
        id: expense.id,
        invoiceId: null,
        invoice: null,
        amount: expense.amount,
        paymentDate: expense.expenseDate,
        method: normalizeMethod(expense.paymentMethod),
        status: 'PAID',
        reference: expense.description || expense.category || 'Spesa',
        notes: expense.notes,
        createdAt: expense.createdAt,
        updatedAt: expense.updatedAt,
        entryType: 'EXPENSE' as const,
        category: expense.category || 'Spesa'
      }))
    ]

    const sortedEntries = ledgerEntries.sort((a: any, b: any) => {
      const direction = sortOrder === 'asc' ? 1 : -1

      if (sortBy === 'amount') {
        return (a.amount - b.amount) * direction
      }

      if (sortBy === 'createdAt') {
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction
      }

      const aDate = new Date(a.paymentDate || a.createdAt).getTime()
      const bDate = new Date(b.paymentDate || b.createdAt).getTime()
      return (aDate - bDate) * direction
    })

    const paginatedEntries = sortedEntries.slice(skip, skip + limit)

    return ApiResponse.paginated(paginatedEntries, page, limit, sortedEntries.length)
  } catch (error) {
    console.error('Error fetching payments:', error)
    return ApiResponse.error('Failed to fetch payments', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = await resolveTenantId(request)
    const body = await request.json()
    
    const { 
      invoiceId, 
      amount, 
      paymentDate = new Date(), 
      method, 
      reference, 
      notes 
    } = body

    // Validate required fields (invoiceId is now optional for free payments)
    if (!amount || !method) {
      return ApiResponse.error('Amount and method are required', 400)
    }

    let paymentStatus = 'PAID'

    // Se c'è un invoiceId, gestiamo la logica legata alla fattura
    if (invoiceId) {
      const invoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: {
          customer: true,
          payments: {
            where: { status: { not: 'CANCELLED' } },
            select: { amount: true }
          }
        }
      })

      if (!invoice || invoice.tenantId !== tenantId) {
        return ApiResponse.error('Invoice not found', 404)
      }

      // Calculate total paid amount
      const totalPaid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0)
      const newTotalPaid = totalPaid + amount
      
      // Check if payment exceeds invoice amount
      if (newTotalPaid > invoice.totalAmount) {
        return ApiResponse.error('Payment amount exceeds invoice total', 400)
      }

      const paymentEntryStatus = newTotalPaid < invoice.totalAmount ? 'PARTIAL' : 'PAID'

      // Create payment linked to invoice
      const payment = await prisma.payment.create({
        data: {
          tenantId,
          invoiceId,
          amount,
          paymentDate: parseDateTimeInput(paymentDate) || new Date(),
          method,
          reference,
          notes,
          status: paymentEntryStatus
        },
        include: {
          invoice: {
            include: {
              customer: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      })

      // Update invoice status and paid amount
      const invoiceStatus = getInvoiceDocumentStatus(invoice, newTotalPaid, invoice.totalAmount)
      const paymentStatus = getInvoicePaymentStatus(newTotalPaid, invoice.totalAmount)

      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: invoiceStatus,
          paymentStatus,
          paidAmount: newTotalPaid,
          balanceAmount: Math.max(0, invoice.totalAmount - newTotalPaid),
          paymentDate: newTotalPaid >= invoice.totalAmount ? (parseDateTimeInput(paymentDate, invoice.paymentDate || new Date()) || invoice.paymentDate) : invoice.paymentDate
        }
      })

      return NextResponse.json({ success: true, data: payment })
    } else {
      // Logica per pagamenti liberi (senza fattura)
      const payment = await prisma.payment.create({
        data: {
          tenantId,
          amount,
          paymentDate: parseDateTimeInput(paymentDate) || new Date(),
          method,
          reference,
          notes,
          status: 'PAID' // I pagamenti liberi sono sempre considerati pagati interamente per quell'importo
        }
      })

      return NextResponse.json({ success: true, data: payment })
    }
  } catch (error) {
    console.error('Error creating payment:', error)
    return ApiResponse.error('Failed to create payment', 500)
  }
}
