import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-tenant'

    const estimate = await prisma.estimate.findFirst({
      where: { id: params.id, tenantId },
      include: {
        customer: true,
        items: { include: { product: true }, orderBy: { sortOrder: 'asc' } }
      }
    })

    if (!estimate) {
      return NextResponse.json({ success: false, error: 'Preventivo non trovato' }, { status: 404 })
    }

    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        tenantId,
        OR: [
          { estimateId: params.id },
          { notes: { contains: estimate.number } }
        ]
      },
      include: {
        customer: true,
        items: { include: { product: true } }
      }
    })

    if (existingInvoice || estimate.invoiceStatus === 'FATTURATO') {
      return NextResponse.json({
        success: true,
        data: existingInvoice,
        message: `Il preventivo ${estimate.number} risulta già convertito in fattura.`
      })
    }

    const lastInvoice = await prisma.invoice.findFirst({
      where: { tenantId },
      orderBy: { number: 'desc' }
    })

    const year = new Date().getFullYear()
    let nextNum = 1
    if (lastInvoice?.number) {
      const match = lastInvoice.number.match(/(\d+)$/)
      if (match) nextNum = parseInt(match[1]) + 1
    }
    const invoiceNumber = `FAT-${year}-${String(nextNum).padStart(3, '0')}`

    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
        companyId: estimate.companyId,
        customerId: estimate.customerId,
        estimateId: estimate.id,
        number: invoiceNumber,
        date: new Date(),
        issueDate: new Date(),
        dueDate: estimate.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'DRAFT',
        type: 'INVOICE',
        subtotal: estimate.subtotal,
        discountAmount: estimate.discountAmount,
        taxAmount: estimate.taxAmount,
        vatTotal: estimate.taxAmount,
        totalAmount: estimate.totalAmount,
        total: estimate.totalAmount,
        paymentStatus: 'UNPAID',
        paidAmount: 0,
        balanceAmount: estimate.totalAmount,
        paymentMethod: estimate.paymentMethod || 'BANK_TRANSFER',
        notes: estimate.notes ? `Generata da preventivo ${estimate.number}. ${estimate.notes}` : `Generata da preventivo ${estimate.number}`,
        items: {
          create: estimate.items.map(item => ({
            tenantId,
            productId: item.productId,
            code: item.code || '',
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            discount: item.discount,
            taxRate: item.vatRate,
            taxAmount: item.totalPrice * (item.vatRate / 100),
            totalPrice: item.totalPrice,
            price: item.unitPrice,
            total: item.totalPrice,
            order: item.order,
            sortOrder: item.sortOrder,
          }))
        }
      },
      include: {
        customer: true,
        items: { include: { product: true } }
      }
    })

    await prisma.estimate.update({
      where: { id: params.id },
      data: { status: 'CONVERTED', invoiceStatus: 'FATTURATO' }
    })

    return NextResponse.json({
      success: true,
      data: invoice,
      message: `Fattura ${invoiceNumber} creata da preventivo ${estimate.number}`
    })
  } catch (error) {
    console.error('Error converting estimate to invoice:', error)
    return NextResponse.json(
      { success: false, error: 'Errore nella conversione' },
      { status: 500 }
    )
  }
}
