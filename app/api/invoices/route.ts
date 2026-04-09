import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { parseDateTimeInput } from '@/lib/utils'

async function resolveTenantId(request: NextRequest) {
  const session = await getServerSession(authOptions)

  return (session?.user as { tenantId?: string } | undefined)?.tenantId ||
    new URL(request.url).searchParams.get('tenantId') ||
    'demo-tenant'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = await resolveTenantId(request)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = { tenantId }
    if (status) {
      where.status = status
    }

    // Get invoices with pagination
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          customer: true,
          items: {
            include: {
              product: true
            }
          }
        },
        orderBy: { issueDate: 'desc' },
        skip,
        take: limit
      }),
      prisma.invoice.count({ where })
    ])

    // Calculate statistics
    const stats = await prisma.invoice.groupBy({
      by: ['status'],
      where: { tenantId },
      _sum: {
        totalAmount: true
      },
      _count: true
    })

    return NextResponse.json({
      success: true,
      data: {
        invoices,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        stats: stats.reduce((acc, stat) => {
          acc[stat.status] = {
            count: stat._count,
            amount: stat._sum.totalAmount || 0
          }
          return acc
        }, {} as any)
      }
    })
  } catch (error) {
    console.error('Error fetching invoices:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch invoices' },
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
      items,
      issueDate = new Date(),
      dueDate,
      paymentMethod,
      notes,
      deductStock = true
    } = body

    // Calculate totals
    let subtotal = 0
    let taxAmount = 0

    const invoiceItems = items.map((item: any) => {
      const itemTotal = item.quantity * item.unitPrice
      const itemTax = itemTotal * (item.taxRate / 100)
      
      subtotal += itemTotal
      taxAmount += itemTax

      return {
        productId: item.productId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: itemTotal,
        taxRate: item.taxRate,
        taxAmount: itemTax
      }
    })

    const totalAmount = subtotal + taxAmount

    // Generate invoice number
    const lastInvoice = await prisma.invoice.findFirst({
      where: { tenantId },
      orderBy: { number: 'desc' }
    })

    let nextNum = 1
    if (lastInvoice?.number) {
      const parts = lastInvoice.number.split('-')
      if (parts.length >= 3) {
        nextNum = parseInt(parts[2]) + 1
      }
    }
    const invoiceNumber = `FAT-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        customerId,
        number: invoiceNumber,
        issueDate: parseDateTimeInput(issueDate) || new Date(),
        dueDate: parseDateTimeInput(dueDate) || new Date(),
        status: 'DRAFT',
        subtotal,
        taxAmount,
        totalAmount,
        paymentMethod,
        notes
      },
      include: {
        customer: true
      }
    })

    // Create invoice items
    for (const item of invoiceItems) {
      await prisma.invoiceItem.create({
        data: {
          invoiceId: invoice.id,
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount
        }
      })
    }

    if (deductStock) {
      for (const item of items) {
        if (item.productId) {
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
                reference: invoiceNumber,
                notes: `Vendita fattura ${invoiceNumber}`
              }
            })
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: invoice
    })
  } catch (error) {
    console.error('Error creating invoice:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create invoice' },
      { status: 500 }
    )
  }
}
