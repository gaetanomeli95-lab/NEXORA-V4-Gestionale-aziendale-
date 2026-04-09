import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiResponse, authenticate, authorize } from '@/lib/api-enterprise'
import { parseDateTimeInput } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const authHeader = request.headers.get('authorization')
    let tenantId = searchParams.get('tenantId') || 'demo-tenant'

    if (authHeader?.startsWith('Bearer ')) {
      const user = await authenticate(request)
      if (!authorize(user, 'INVOICE_READ')) {
        return ApiResponse.error('Unauthorized', 403)
      }
      tenantId = user.tenantId
    }

    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const paymentStatus = searchParams.get('paymentStatus')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit
    const sortBy = searchParams.get('sortBy') || 'issueDate'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const where: any = { tenantId }

    if (search) {
      where.OR = [
        { number: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { notes: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status) {
      where.status = status
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus
    }

    const orderBy: any = {}
    if (['number', 'issueDate', 'dueDate', 'totalAmount', 'status', 'createdAt'].includes(sortBy)) {
      orderBy[sortBy] = sortOrder
    } else {
      orderBy.issueDate = 'desc'
    }

    const [estimates, total] = await Promise.all([
      prisma.estimate.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              vatNumber: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true
                }
              }
            },
            orderBy: { sortOrder: 'asc' }
          },
          payments: {
            select: {
              id: true,
              amount: true,
              paymentDate: true,
              method: true,
              status: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.estimate.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: {
        estimates,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching estimates:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch estimates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      tenantId = 'demo-tenant',
      customerId,
      number,
      issueDate,
      dueDate,
      deliveryDate,
      notes,
      internalNotes,
      paymentMethod,
      items = [],
      payments = []
    } = body

    if (!customerId || !number) {
      return NextResponse.json(
        { success: false, error: 'Customer and number are required' },
        { status: 400 }
      )
    }

    // Check duplicate number
    const existing = await prisma.estimate.findFirst({
      where: { tenantId, number }
    })
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Estimate number already exists' },
        { status: 400 }
      )
    }

    // Calculate totals
    let subtotal = 0
    let taxAmount = 0

    const processedItems = items.map((item: any, index: number) => {
      const qty = Number(item.quantity || 1)
      const price = Number(item.unitPrice || 0)
      const discount = Number(item.discount || 0)
      const vatRate = item.vatRate ?? item.taxRate ?? 22
      const lineTotal = qty * price * (1 - discount / 100)
      const lineTax = lineTotal * (vatRate / 100)

      subtotal += lineTotal
      taxAmount += lineTax

      return {
        productId: item.productId || undefined,
        code: item.code || undefined,
        description: item.description || '',
        quantity: qty,
        unit: item.unit || 'pz',
        unitPrice: price,
        price: price,
        totalPrice: lineTotal,
        total: lineTotal,
        discount: discount,
        taxRate: vatRate,
        vatRate: vatRate,
        taxAmount: lineTax,
        sortOrder: index,
        order: index,
        notes: item.notes || undefined
      }
    })

    const totalAmount = subtotal + taxAmount
    
    let paidAmount = 0
    let paymentRows: any[] = []
    
    if (Array.isArray(payments)) {
      payments.forEach(p => {
        const amt = Number(p.amount) || 0
        if (amt > 0) {
          paidAmount += amt
          paymentRows.push({
            amount: amt,
            method: p.method || 'CONTANTI',
            paymentDate: parseDateTimeInput(p.date) || new Date(),
            notes: p.note || '',
            tenantId,
            status: 'COMPLETED'
          })
        }
      })
    }
    
    const balanceAmount = Math.max(0, totalAmount - paidAmount)
    let paymentStatus = 'NON PAGATO'
    if (paidAmount >= totalAmount && totalAmount > 0) paymentStatus = 'PAGATO'
    else if (paidAmount > 0) paymentStatus = 'PARZIALMENTE PAGATO'

    const estimate = await prisma.estimate.create({
      data: {
        tenantId,
        customerId,
        number,
        issueDate: parseDateTimeInput(issueDate) || new Date(),
        dueDate: parseDateTimeInput(dueDate),
        deliveryDate: parseDateTimeInput(deliveryDate),
        status: 'DRAFT',
        paymentStatus,
        stockStatus: 'DA SCARICARE',
        invoiceStatus: 'NON FATTURATO',
        returnStatus: 'NON RESO',
        subtotal,
        taxAmount,
        totalAmount,
        paidAmount,
        balanceAmount,
        paymentMethod: paymentMethod || undefined,
        notes: notes || undefined,
        internalNotes: internalNotes || undefined,
        items: {
          create: processedItems
        },
        payments: paymentRows.length > 0 ? { create: paymentRows } : undefined
      },
      include: {
        customer: { select: { id: true, name: true } },
        items: true
      }
    })

    return NextResponse.json({
      success: true,
      data: estimate
    })
  } catch (error) {
    console.error('Error creating estimate:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create estimate' },
      { status: 500 }
    )
  }
}
