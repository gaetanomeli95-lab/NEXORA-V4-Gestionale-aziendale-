import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-tenant'
    const body = await request.json()
    const { amount, method, notes, isPartial } = body

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Importo non valido' },
        { status: 400 }
      )
    }

    const order = await prisma.order.findFirst({
      where: { id: params.id, tenantId }
    })

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Ordine non trovato' },
        { status: 404 }
      )
    }

    // Crea record pagamento
    const payment = await prisma.payment.create({
      data: {
        tenantId,
        customerId: order.customerId || undefined,
        orderId: order.id,
        amount,
        method: method || 'Contanti',
        reference: order.number ? `Ordine ${order.number}` : 'Ordine Cliente',
        notes: notes || `Pagamento ordine ${order.number || 'Cliente'}`
      }
    })

    // Aggiorna stato pagamento dell'ordine
    const newStatus = isPartial ? 'PARZIALMENTE PAGATO' : 'PAGATO'
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: newStatus }
    })

    return NextResponse.json({
      success: true,
      message: 'Pagamento registrato con successo',
      data: payment
    })

  } catch (error: any) {
    console.error('Error recording payment for order:', error)
    return NextResponse.json(
      { success: false, error: 'Errore durante la registrazione del pagamento' },
      { status: 500 }
    )
  }
}
