import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { parseDateTimeInput } from '@/lib/utils'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-tenant'
    const body = await request.json()

    const existing = await prisma.order.findFirst({
      where: { id: params.id, tenantId }
    })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Ordine non trovato' }, { status: 404 })
    }

    const updateData: any = {}
    if (body.status) updateData.status = body.status
    if (body.priority) updateData.priority = body.priority
    if (body.trackingNumber !== undefined) updateData.trackingNumber = body.trackingNumber
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.actualDeliveryDate !== undefined) {
      updateData.actualDeliveryDate = body.actualDeliveryDate ? (parseDateTimeInput(body.actualDeliveryDate, existing.actualDeliveryDate || new Date()) || existing.actualDeliveryDate) : null
    }

    const updated = await prisma.order.update({
      where: { id: params.id },
      data: updateData,
      include: {
        customer: { select: { id: true, name: true, email: true } },
        items: true
      }
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ success: false, error: 'Errore server' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-tenant'

    const existing = await prisma.order.findFirst({
      where: { id: params.id, tenantId }
    })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Ordine non trovato' }, { status: 404 })
    }

    await prisma.orderItem.deleteMany({ where: { orderId: params.id } })
    // Keep cash-book history: detach payments from the deleted order
    await prisma.payment.updateMany({
      where: { orderId: params.id, tenantId },
      data: {
        orderId: null,
        reference: existing.number ? `Ordine ${existing.number} (eliminato)` : 'Ordine eliminato',
        notes: existing.number ? `Pagamento precedentemente associato all'ordine ${existing.number} (eliminato)` : "Pagamento precedentemente associato a un ordine eliminato"
      }
    })
    await prisma.order.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true, message: 'Ordine eliminato' })
  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json({ success: false, error: 'Errore server' }, { status: 500 })
  }
}
