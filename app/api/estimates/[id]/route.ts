import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseDateTimeInput } from '@/lib/utils'

function normalizePaymentMethod(method?: string | null) {
  const value = (method || '').toUpperCase()

  if (value === 'CONTANTI' || value === 'CASH') return 'CASH'
  if (value === 'BONIFICO' || value === 'BANK_TRANSFER') return 'BANK_TRANSFER'
  if (value === 'CARTA' || value === 'CREDIT_CARD') return 'CREDIT_CARD'
  if (value === 'ASSEGNO' || value === 'CHECK') return 'CHECK'
  if (value === 'PAYPAL') return 'PAYPAL'

  return method || 'CASH'
}

async function syncEstimateCashBook(
  tenantId: string,
  estimate: {
    id: string
    totalAmount: number
    customerId?: string | null
    number?: string | null
    paymentMethod?: string | null
  },
  paymentStatus: string
) {
  const activePayments = await prisma.payment.findMany({
    where: {
      tenantId,
      estimateId: estimate.id,
      status: { not: 'CANCELLED' }
    }
  })

  const activePaidAmount = activePayments.reduce((sum, payment) => sum + payment.amount, 0)

  if (paymentStatus === 'PAGATO') {
    const remainingAmount = Math.max(0, estimate.totalAmount - activePaidAmount)

    if (remainingAmount > 0.009) {
      await prisma.payment.create({
        data: {
          tenantId,
          customerId: estimate.customerId || undefined,
          estimateId: estimate.id,
          amount: remainingAmount,
          paymentDate: new Date(),
          method: normalizePaymentMethod(estimate.paymentMethod),
          status: 'PAID',
          reference: estimate.number ? `Preventivo ${estimate.number}` : 'Preventivo',
          notes: estimate.number
            ? `Pagamento registrato dal preventivo ${estimate.number}`
            : 'Pagamento registrato dal preventivo'
        }
      })
    }
  }

  if (paymentStatus === 'NON PAGATO' && activePayments.length > 0) {
    await prisma.payment.updateMany({
      where: {
        id: {
          in: activePayments.map(payment => payment.id)
        }
      },
      data: {
        status: 'CANCELLED',
        notes: estimate.number
          ? `Pagamento annullato dal preventivo ${estimate.number}`
          : 'Pagamento annullato dal preventivo'
      }
    })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-tenant'

    const estimate = await prisma.estimate.findFirst({
      where: { id: params.id, tenantId },
      include: {
        customer: true,
        items: { include: { product: true }, orderBy: { sortOrder: 'asc' } },
        payments: true
      }
    })

    if (!estimate) {
      return NextResponse.json({ success: false, error: 'Preventivo non trovato' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: estimate })
  } catch (error) {
    console.error('Error fetching estimate:', error)
    return NextResponse.json({ success: false, error: 'Errore server' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-tenant'
    const body = await request.json()

    const existing = await prisma.estimate.findFirst({
      where: { id: params.id, tenantId }
    })

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Preventivo non trovato' }, { status: 404 })
    }

    const updateData: any = {}

    if (body.status) {
      const validStatuses = ['DRAFT', 'SENT', 'ACCEPTED', 'DELIVERED', 'REJECTED', 'EXPIRED', 'CONVERTED']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ success: false, error: 'Stato non valido' }, { status: 400 })
      }
      updateData.status = body.status

      if (body.status === 'DELIVERED') {
        updateData.deliveryDate = body.deliveryDate ? (parseDateTimeInput(body.deliveryDate, existing.deliveryDate || new Date()) || existing.deliveryDate || new Date()) : (existing.deliveryDate || new Date())
      }
    }

    if (body.paymentStatus !== undefined) {
      const validPaymentStatuses = ['NON PAGATO', 'PARZIALMENTE PAGATO', 'PAGATO']
      if (!validPaymentStatuses.includes(body.paymentStatus)) {
        return NextResponse.json({ success: false, error: 'Stato pagamento non valido' }, { status: 400 })
      }

      updateData.paymentStatus = body.paymentStatus

      if (body.paidAmount !== undefined) {
        updateData.paidAmount = Number(body.paidAmount) || 0
      }

      if (body.balanceAmount !== undefined) {
        updateData.balanceAmount = Number(body.balanceAmount) || 0
      }

      if (body.paidAmount === undefined && body.balanceAmount === undefined) {
        if (body.paymentStatus === 'PAGATO') {
          updateData.paidAmount = existing.totalAmount
          updateData.balanceAmount = 0
        } else if (body.paymentStatus === 'NON PAGATO') {
          updateData.paidAmount = 0
          updateData.balanceAmount = existing.totalAmount
        }
      }
    }

    if (body.dueDate !== undefined) updateData.dueDate = body.dueDate ? (parseDateTimeInput(body.dueDate, existing.dueDate || new Date()) || existing.dueDate) : null
    if (body.deliveryDate !== undefined) updateData.deliveryDate = body.deliveryDate ? (parseDateTimeInput(body.deliveryDate, existing.deliveryDate || new Date()) || existing.deliveryDate) : null

    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.internalNotes !== undefined) updateData.internalNotes = body.internalNotes

    // Calculate items totals if provided
    if (body.items) {
      let subtotal = 0
      let taxAmount = 0
      
      const processedItems = body.items.map((item: any, index: number) => {
        const qty = Number(item.quantity || 1)
        const price = Number(item.unitPrice || 0)
        const discount = Number(item.discount || 0)
        const vatRate = item.vatRate ?? item.taxRate ?? 22
        const lineTotal = qty * price * (1 - discount / 100)
        const lineTax = lineTotal * (vatRate / 100)

        subtotal += lineTotal
        taxAmount += lineTax

        return {
          id: item.id && !item.id.includes('.') ? item.id : undefined, // Ignore temp ids
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
      updateData.subtotal = subtotal
      updateData.taxAmount = taxAmount
      updateData.totalAmount = totalAmount

      // Handle payments if provided
      if (body.payments) {
        let paidAmount = 0
        const paymentRows: any[] = []
        body.payments.forEach((p: any) => {
          const amt = Number(p.amount) || 0
          if (amt > 0) {
            paidAmount += amt
            paymentRows.push({
              id: p.id && !p.id.includes('.') ? p.id : undefined,
              amount: amt,
              method: normalizePaymentMethod(p.method),
              paymentDate: parseDateTimeInput(p.date) || new Date(),
              notes: p.note || '',
              tenantId,
              status: 'PAID',
              reference: existing.number ? `Preventivo ${existing.number}` : 'Preventivo'
            })
          }
        })

        updateData.paidAmount = paidAmount
        updateData.balanceAmount = Math.max(0, totalAmount - paidAmount)
        
        let paymentStatus = 'NON PAGATO'
        if (paidAmount >= totalAmount && totalAmount > 0) paymentStatus = 'PAGATO'
        else if (paidAmount > 0) paymentStatus = 'PARZIALMENTE PAGATO'
        
        updateData.paymentStatus = paymentStatus

        // First delete all existing items and payments not in the current list
        const existingItemIds = processedItems.filter((i: any) => i.id).map((i: any) => i.id)
        const existingPaymentIds = paymentRows.filter((p: any) => p.id).map((p: any) => p.id)

        await prisma.$transaction([
          prisma.estimateItem.deleteMany({
            where: {
              estimateId: params.id,
              id: { notIn: existingItemIds }
            }
          }),
          prisma.payment.deleteMany({
            where: {
              estimateId: params.id,
              id: { notIn: existingPaymentIds }
            }
          })
        ])

        // Update items
        for (const item of processedItems) {
          if (item.id) {
            await prisma.estimateItem.update({
              where: { id: item.id },
              data: { ...item, id: undefined }
            })
          } else {
            await prisma.estimateItem.create({
              data: { ...item, estimateId: params.id }
            })
          }
        }

        // Update payments
        for (const payment of paymentRows) {
          if (payment.id) {
            await prisma.payment.update({
              where: { id: payment.id },
              data: { ...payment, id: undefined }
            })
          } else {
            await prisma.payment.create({
              data: { ...payment, estimateId: params.id }
            })
          }
        }
      }
    }

    const updated = await prisma.estimate.update({
      where: { id: params.id },
      data: updateData,
      include: { 
        customer: true, 
        items: { 
          include: { 
            product: true 
          } 
        },
        payments: true
      }
    })

    if (body.paymentStatus !== undefined && body.payments === undefined) {
      await syncEstimateCashBook(tenantId, updated, body.paymentStatus)
    }

    const refreshed = await prisma.estimate.findFirst({
      where: { id: params.id, tenantId },
      include: {
        customer: true,
        items: {
          include: {
            product: true
          }
        },
        payments: true
      }
    })

    return NextResponse.json({ success: true, data: refreshed || updated })
  } catch (error) {
    console.error('Error updating estimate:', error)
    return NextResponse.json({ success: false, error: 'Errore server' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-tenant'

    const existing = await prisma.estimate.findFirst({
      where: { id: params.id, tenantId }
    })

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Preventivo non trovato' }, { status: 404 })
    }

    // Delete all related records first to avoid FK constraint errors
    await prisma.estimateItem.deleteMany({ where: { estimateId: params.id } })
    await prisma.payment.deleteMany({ where: { estimateId: params.id, tenantId } })
    await prisma.document.deleteMany({ where: { estimateId: params.id } })
    await prisma.ddt.deleteMany({ where: { estimateId: params.id } })
    await prisma.estimate.deleteMany({ where: { id: params.id } })

    return NextResponse.json({ success: true, message: 'Preventivo eliminato' })
  } catch (error) {
    console.error('Error deleting estimate:', error)
    return NextResponse.json({ success: false, error: 'Errore server' }, { status: 500 })
  }
}
