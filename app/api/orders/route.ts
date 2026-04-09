import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiResponse, authenticate, authorize, auditLog } from '@/lib/api-enterprise'
import { parseDateTimeInput } from '@/lib/utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    let tenantId = searchParams.get('tenantId') || 'demo-tenant'
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const user = await authenticate(request)
        if (!authorize(user, 'ORDER_READ')) return ApiResponse.error('Unauthorized', 403)
        tenantId = user.tenantId
      } catch { /* use demo-tenant fallback */ }
    }
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    const sortBy = searchParams.get('sortBy') || 'orderDate'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build where clause
    const where: any = { tenantId }
    
    if (search) {
      where.OR = [
        { number: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { customer: { email: { contains: search, mode: 'insensitive' } } },
        { trackingNumber: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status) {
      where.status = status
    }

    if (priority) {
      where.priority = priority
    }

    // Build order by
    const orderBy: any = {}
    if (sortBy === 'orderDate') {
      orderBy.orderDate = sortOrder
    } else if (sortBy === 'totalAmount') {
      orderBy.totalAmount = sortOrder
    } else if (sortBy === 'customer') {
      orderBy.customer = { name: sortOrder }
    } else {
      orderBy[sortBy] = sortOrder
    }

    // Get orders with pagination
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          items: true,
          payments: true
        }
      }),
      prisma.order.count({ where })
    ])

    // Format orders for the frontend
    const transformedOrders = orders.map(order => ({
      ...order,
      itemCount: order.items.length,
      totalQuantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
      items: order.items.length > 0 ? order.items : [],
      shippingAddress: order.shippingAddress || {
        street: '',
        city: '',
        postalCode: '',
        country: 'IT'
      },
      paymentStatus: order.paymentStatus || 'NON PAGATO'
    }))

    return ApiResponse.paginated(transformedOrders, page, limit, total)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return ApiResponse.error('Failed to fetch orders', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    let tenantId = 'demo-tenant'
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const user = await authenticate(request)
        if (!authorize(user, 'ORDER_CREATE')) return ApiResponse.error('Unauthorized', 403)
        tenantId = user.tenantId
      } catch { /* use demo-tenant */ }
    }

    const body = await request.json()
    const {
      customerId,
      items,
      expectedDeliveryDate,
      priority = 'MEDIUM',
      shippingAddress,
      notes,
      internalNotes,
      deductStock = true
    } = body

    // Validate required fields
    if (!customerId || !items || items.length === 0) {
      return NextResponse.json({ success: false, error: 'Cliente e articoli obbligatori' }, { status: 400 })
    }

    // Generate order number
    const lastOrder = await prisma.order.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' }
    })

    const lastNumber = lastOrder?.number
      ? parseInt(lastOrder.number.split('-').pop() || '0', 10) || 0
      : 0
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(lastNumber + 1).padStart(4, '0')}`

    // Calculate totals
    let totalAmount = 0
    const orderItems = items.map((item: any) => {
      const itemTotal = item.quantity * item.unitPrice
      totalAmount += itemTotal

      return {
        productId: item.productId,
        description: item.description || item.productName || 'Order item',
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: itemTotal
      }
    })

    // Create order
    const order = await prisma.order.create({
      data: {
        tenantId,
        customerId,
        number: orderNumber,
        orderDate: new Date(),
        expectedDeliveryDate: parseDateTimeInput(expectedDeliveryDate) || null,
        status: 'PENDING',
        paymentStatus: 'NON PAGATO',
        priority,
        totalAmount,
        shippingAddress,
        notes,
        internalNotes
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Create order items
    for (const item of orderItems) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice
        }
      })

      if (deductStock && item.productId) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId }
        })

        if (product && product.trackStock) {
          const newQuantity = product.stockQuantity - item.quantity
          
          await prisma.product.update({
            where: { id: item.productId },
            data: { stockQuantity: newQuantity }
          })

          await prisma.stockMovement.create({
            data: {
              tenantId,
              productId: item.productId,
              movementType: 'OUT',
              quantity: item.quantity,
              referenceType: 'ORDER',
              referenceId: order.id,
              referenceNumber: orderNumber,
              notes: `Ordine ${orderNumber}`
            }
          })
        }
      }
    }

    return NextResponse.json({ success: true, data: order })
  } catch (error) {
    console.error('Error creating order:', error)
    return ApiResponse.error('Failed to create order', 500)
  }
}
