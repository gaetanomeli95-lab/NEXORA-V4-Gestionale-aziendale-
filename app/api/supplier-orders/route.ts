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
      if (!authorize(user, 'PRODUCT_READ')) {
        return ApiResponse.error('Unauthorized', 403)
      }
      tenantId = user.tenantId
    }

    const search = searchParams.get('search')
    const loadingStatus = searchParams.get('loadingStatus')
    const paymentStatus = searchParams.get('paymentStatus')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit
    const sortBy = searchParams.get('sortBy') || 'orderDate'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const where: any = { tenantId }

    if (search) {
      where.OR = [
        { number: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
        { notes: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (loadingStatus) where.loadingStatus = loadingStatus
    if (paymentStatus) where.paymentStatus = paymentStatus

    const orderBy: any = {}
    if (['number', 'orderDate', 'totalAmount', 'createdAt'].includes(sortBy)) {
      orderBy[sortBy] = sortOrder
    } else {
      orderBy.orderDate = 'desc'
    }

    const [orders, total] = await Promise.all([
      prisma.supplierOrder.findMany({
        where,
        include: {
          supplier: {
            select: { id: true, name: true, email: true, phone: true }
          },
          items: {
            include: {
              product: {
                select: { id: true, name: true, sku: true }
              }
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.supplierOrder.count({ where })
    ])

    // Stats
    const [totalOrders, toLoadCount, partialCount, loadedCount, unpaidCount, totals] = await Promise.all([
      prisma.supplierOrder.count({ where: { tenantId } }),
      prisma.supplierOrder.count({ where: { tenantId, loadingStatus: 'DA CARICARE' } }),
      prisma.supplierOrder.count({ where: { tenantId, loadingStatus: 'PARZIALE' } }),
      prisma.supplierOrder.count({ where: { tenantId, loadingStatus: 'CARICATO' } }),
      prisma.supplierOrder.count({ where: { tenantId, paymentStatus: 'NON PAGATO' } }),
      prisma.supplierOrder.aggregate({
        where: { tenantId },
        _sum: { totalAmount: true }
      })
    ])

    return NextResponse.json({
      success: true,
      data: {
        orders,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        stats: {
          totalOrders,
          toLoadCount,
          partialCount,
          loadedCount,
          unpaidCount,
          totalValue: totals._sum.totalAmount || 0
        }
      }
    })
  } catch (error) {
    console.error('Error fetching supplier orders:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch supplier orders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      tenantId = 'demo-tenant',
      supplierId,
      number,
      orderDate,
      notes,
      items = []
    } = body

    if (!supplierId) {
      return NextResponse.json(
        { success: false, error: 'Supplier is required' },
        { status: 400 }
      )
    }

    let orderNumber = typeof number === 'string' && number.trim().length > 0 ? number.trim() : ''

    if (!orderNumber) {
      const now = parseDateTimeInput(orderDate) || new Date()
      const year = now.getFullYear()
      const prefix = `ORD-FOR-${year}-`

      const latestOrder = await prisma.supplierOrder.findFirst({
        where: {
          tenantId,
          number: {
            startsWith: prefix
          }
        },
        orderBy: {
          number: 'desc'
        },
        select: {
          number: true
        }
      })

      const latestSequence = latestOrder?.number
        ? Number(latestOrder.number.slice(prefix.length))
        : 0

      orderNumber = `${prefix}${String((Number.isFinite(latestSequence) ? latestSequence : 0) + 1).padStart(3, '0')}`
    }

    const existing = await prisma.supplierOrder.findFirst({
      where: { tenantId, number: orderNumber }
    })
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Order number already exists' },
        { status: 400 }
      )
    }

    let totalAmount = 0
    const processedItems = items.map((item: any) => {
      const qty = Number(item.quantity || 1)
      const price = Number(item.unitPrice || 0)
      const lineTotal = qty * price
      totalAmount += lineTotal

      return {
        productId: item.productId || undefined,
        description: item.description || '',
        quantity: qty,
        unit: item.unit || 'pz',
        unitPrice: price,
        totalPrice: lineTotal,
        taxRate: Number(item.taxRate || 22),
        notes: item.notes || undefined
      }
    })

    const order = await prisma.supplierOrder.create({
      data: {
        tenantId,
        supplierId,
        number: orderNumber,
        orderDate: parseDateTimeInput(orderDate) || new Date(),
        loadingStatus: 'DA CARICARE',
        paymentStatus: 'NON PAGATO',
        totalAmount,
        notes: notes || undefined,
        items: { create: processedItems }
      },
      include: {
        supplier: { select: { id: true, name: true } },
        items: true
      }
    })

    return NextResponse.json({ success: true, data: order })
  } catch (error) {
    console.error('Error creating supplier order:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create supplier order' },
      { status: 500 }
    )
  }
}
