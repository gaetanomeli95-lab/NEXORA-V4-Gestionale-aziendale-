import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'

import { authOptions } from '@/lib/auth'

const prisma = new PrismaClient()

async function resolveTenantId(request: NextRequest) {
  const session = await getServerSession(authOptions)

  return (session?.user as { tenantId?: string } | undefined)?.tenantId ||
    request.headers.get('x-tenant-id') ||
    'demo-tenant'
}

function toNumber(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = await resolveTenantId(request)

    const invoice = await prisma.invoice.findFirst({
      where: { id: params.id, tenantId },
      include: {
        customer: true,
        items: { include: { product: true } }
      }
    })

    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Fattura non trovata' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: invoice })
  } catch (error) {
    console.error('Error fetching invoice:', error)
    return NextResponse.json({ success: false, error: 'Errore server' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = await resolveTenantId(request)
    const body = await request.json()

    const existing = await prisma.invoice.findFirst({
      where: { id: params.id, tenantId }
    })

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Fattura non trovata' }, { status: 404 })
    }

    const updateData: any = {}

    if (body.status) {
      const validStatuses = ['DRAFT', 'SENT', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED']
      if (!validStatuses.includes(body.status)) {
        return NextResponse.json({ success: false, error: 'Stato non valido' }, { status: 400 })
      }
      updateData.status = body.status

      if (body.status === 'PAID') {
        updateData.paidAmount = existing.totalAmount
        updateData.balanceAmount = 0
        updateData.paymentStatus = 'PAID'
        updateData.paymentDate = new Date()
      } else if (body.status === 'PARTIAL') {
        updateData.paymentStatus = 'PARTIAL'
      } else if (body.status === 'SENT' || body.status === 'DRAFT' || body.status === 'OVERDUE') {
        updateData.paymentStatus = existing.paidAmount > 0 ? 'PARTIAL' : 'UNPAID'
      }
    }

    if (body.paidAmount !== undefined) {
      const nextPaidAmount = Math.max(0, toNumber(body.paidAmount))
      updateData.paidAmount = nextPaidAmount
      updateData.balanceAmount = Math.max(existing.totalAmount - nextPaidAmount, 0)
      if (nextPaidAmount >= existing.totalAmount) {
        updateData.status = 'PAID'
        updateData.paymentStatus = 'PAID'
        updateData.paymentDate = new Date()
      } else if (nextPaidAmount > 0) {
        updateData.status = 'PARTIAL'
        updateData.paymentStatus = 'PARTIAL'
        updateData.paymentDate = existing.paymentDate || new Date()
      } else {
        updateData.status = existing.dueDate.getTime() < Date.now() ? 'OVERDUE' : 'SENT'
        updateData.paymentStatus = 'UNPAID'
        updateData.paymentDate = null
      }
    }

    if (body.notes !== undefined) updateData.notes = body.notes

    const updated = await prisma.invoice.update({
      where: { id: params.id },
      data: updateData,
      include: { customer: true, items: { include: { product: true } } }
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error updating invoice:', error)
    return NextResponse.json({ success: false, error: 'Errore server' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = await resolveTenantId(request)

    const existing = await prisma.invoice.findFirst({
      where: { id: params.id, tenantId }
    })

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Fattura non trovata' }, { status: 404 })
    }

    await prisma.invoiceItem.deleteMany({ where: { invoiceId: params.id } })
    await prisma.payment.deleteMany({ where: { invoiceId: params.id } })
    await prisma.document.deleteMany({ where: { invoiceId: params.id } })
    await prisma.ddt.deleteMany({ where: { invoiceId: params.id } })
    await prisma.invoice.deleteMany({ where: { id: params.id } })

    return NextResponse.json({ success: true, message: 'Fattura eliminata' })
  } catch (error) {
    console.error('Error deleting invoice:', error)
    return NextResponse.json({ success: false, error: 'Errore server' }, { status: 500 })
  }
}
