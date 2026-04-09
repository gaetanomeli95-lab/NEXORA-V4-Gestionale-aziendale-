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

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = await resolveTenantId(request)
    const body = await request.json()

    const payment = await prisma.payment.findFirst({
      where: { id: params.id, tenantId },
      include: {
        invoice: true,
        estimate: true,
        order: true
      }
    })

    if (!payment) {
      return NextResponse.json({ success: false, error: 'Pagamento non trovato' }, { status: 404 })
    }

    if (body.status === 'CANCELLED' && payment.status !== 'CANCELLED') {
      // 1. Mark payment as cancelled
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'CANCELLED' }
      })

      // 2. Adjust parent document totals
      const amountToDeduct = payment.amount

      if (payment.invoiceId && payment.invoice) {
        const newPaid = Math.max(0, (payment.invoice.paidAmount || 0) - amountToDeduct)
        const newBalance = payment.invoice.totalAmount - newPaid
        const invoiceStatus = getInvoiceDocumentStatus(payment.invoice, newPaid, payment.invoice.totalAmount)
        const paymentStatus = getInvoicePaymentStatus(newPaid, payment.invoice.totalAmount)

        await prisma.invoice.update({
          where: { id: payment.invoiceId },
          data: {
            paidAmount: newPaid,
            balanceAmount: newBalance,
            paymentStatus,
            status: invoiceStatus,
            paymentDate: newPaid > 0 ? payment.invoice.paymentDate : null
          }
        })
      }

      if (payment.estimateId && payment.estimate) {
        const newPaid = Math.max(0, (payment.estimate.paidAmount || 0) - amountToDeduct)
        const newBalance = payment.estimate.totalAmount - newPaid
        const newStatus = newPaid <= 0 ? 'NON PAGATO' : (newPaid < payment.estimate.totalAmount ? 'PARZIALMENTE PAGATO' : 'PAGATO')

        await prisma.estimate.update({
          where: { id: payment.estimateId },
          data: {
            paidAmount: newPaid,
            balanceAmount: newBalance,
            paymentStatus: newStatus
          }
        })
      }

      if (payment.orderId && payment.order) {
        // Find total paid for this order excluding this cancelled payment
        const otherPayments = await prisma.payment.findMany({
          where: { orderId: payment.orderId, status: 'PAID' }
        })
        const newPaid = otherPayments.reduce((acc, p) => acc + p.amount, 0)
        const newStatus = newPaid <= 0 ? 'NON PAGATO' : (newPaid < payment.order.totalAmount ? 'PARZIALMENTE PAGATO' : 'PAGATO')

        await prisma.order.update({
          where: { id: payment.orderId },
          data: { paymentStatus: newStatus }
        })
      }
    }

    return NextResponse.json({ success: true, message: 'Pagamento annullato e totali aggiornati' })
  } catch (error) {
    console.error('Error cancelling payment:', error)
    return NextResponse.json({ success: false, error: 'Errore server' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = await resolveTenantId(request)

    const payment = await prisma.payment.findFirst({
      where: { id: params.id, tenantId },
      include: {
        invoice: true,
        estimate: true,
        order: true
      }
    })

    if (!payment) {
      return NextResponse.json({ success: false, error: 'Pagamento non trovato' }, { status: 404 })
    }

    // Only adjust totals if it wasn't already cancelled
    if (payment.status !== 'CANCELLED') {
      const amountToDeduct = payment.amount

      if (payment.invoiceId && payment.invoice) {
        const newPaid = Math.max(0, (payment.invoice.paidAmount || 0) - amountToDeduct)
        const newBalance = payment.invoice.totalAmount - newPaid
        const invoiceStatus = getInvoiceDocumentStatus(payment.invoice, newPaid, payment.invoice.totalAmount)
        const paymentStatus = getInvoicePaymentStatus(newPaid, payment.invoice.totalAmount)

        await prisma.invoice.update({
          where: { id: payment.invoiceId },
          data: {
            paidAmount: newPaid,
            balanceAmount: newBalance,
            paymentStatus,
            status: invoiceStatus,
            paymentDate: newPaid > 0 ? payment.invoice.paymentDate : null
          }
        })
      }

      if (payment.estimateId && payment.estimate) {
        const newPaid = Math.max(0, (payment.estimate.paidAmount || 0) - amountToDeduct)
        const newBalance = payment.estimate.totalAmount - newPaid
        const newStatus = newPaid <= 0 ? 'NON PAGATO' : (newPaid < payment.estimate.totalAmount ? 'PARZIALMENTE PAGATO' : 'PAGATO')

        await prisma.estimate.update({
          where: { id: payment.estimateId },
          data: {
            paidAmount: newPaid,
            balanceAmount: newBalance,
            paymentStatus: newStatus
          }
        })
      }

      if (payment.orderId && payment.order) {
        const otherPayments = await prisma.payment.findMany({
          where: { orderId: payment.orderId, id: { not: payment.id }, status: 'PAID' }
        })
        const newPaid = otherPayments.reduce((acc, p) => acc + p.amount, 0)
        const newStatus = newPaid <= 0 ? 'NON PAGATO' : (newPaid < payment.order.totalAmount ? 'PARZIALMENTE PAGATO' : 'PAGATO')

        await prisma.order.update({
          where: { id: payment.orderId },
          data: { paymentStatus: newStatus }
        })
      }
    }

    // Hard delete the payment
    await prisma.payment.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true, message: 'Pagamento eliminato definitivamente' })
  } catch (error) {
    console.error('Error deleting payment:', error)
    return NextResponse.json({ success: false, error: 'Errore server' }, { status: 500 })
  }
}
