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
      include: { items: { include: { product: true } } }
    })

    if (!estimate) {
      return NextResponse.json({ success: false, error: 'Preventivo non trovato' }, { status: 404 })
    }

    if (estimate.stockStatus === 'SCARICATO') {
      return NextResponse.json({ success: false, error: 'Il preventivo è già stato scaricato' }, { status: 400 })
    }

    // Decrement stock for each item
    await Promise.all(
      estimate.items
        .filter(item => item.productId && item.product)
        .map(async (item) => {
          await prisma.product.update({
            where: { id: item.productId! },
            data: { stockQuantity: { decrement: item.quantity } }
          })
          await prisma.stockMovement.create({
            data: {
              tenantId,
              productId: item.productId!,
              movementType: 'OUT',
              quantity: item.quantity,
              reference: estimate.number,
              referenceType: 'SCARICO',
              referenceId: estimate.id,
              notes: `Scarico per preventivo ${estimate.number}`
            }
          })
        })
    )

    // Update estimate status
    const updated = await prisma.estimate.update({
      where: { id: params.id },
      data: {
        stockStatus: 'SCARICATO',
      },
      include: {
        customer: true,
        items: { include: { product: true } },
        payments: true
      }
    })

    return NextResponse.json({
      success: true,
      data: updated,
      message: `Scarico effettuato per ${estimate.items.length} articoli.`
    })
  } catch (error) {
    console.error('Error processing scarico:', error)
    return NextResponse.json({ success: false, error: 'Errore nello scarico magazzino' }, { status: 500 })
  }
}
