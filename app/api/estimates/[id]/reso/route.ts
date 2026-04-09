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

    if (estimate.stockStatus !== 'SCARICATO') {
      return NextResponse.json({ success: false, error: 'Il preventivo non è stato scaricato, reso non applicabile' }, { status: 400 })
    }

    if (estimate.returnStatus === 'RESO') {
      return NextResponse.json({ success: false, error: 'Reso già effettuato' }, { status: 400 })
    }

    // Restore stock for each item
    await Promise.all(
      estimate.items
        .filter(item => item.productId && item.product)
        .map(async (item) => {
          await prisma.product.update({
            where: { id: item.productId! },
            data: { stockQuantity: { increment: item.quantity } }
          })
          await prisma.stockMovement.create({
            data: {
              tenantId,
              productId: item.productId!,
              movementType: 'IN',
              quantity: item.quantity,
              reference: estimate.number,
              referenceType: 'RESO',
              referenceId: estimate.id,
              notes: `Reso da preventivo ${estimate.number}`
            }
          })
        })
    )

    // Update estimate statuses
    await prisma.estimate.update({
      where: { id: params.id },
      data: {
        stockStatus: 'DA SCARICARE',
        returnStatus: 'RESO',
        status: 'CANCELLED'
      }
    })

    return NextResponse.json({
      success: true,
      message: `Reso effettuato. Quantità ripristinate in magazzino per ${estimate.items.length} articoli.`
    })
  } catch (error) {
    console.error('Error processing reso:', error)
    return NextResponse.json({ success: false, error: 'Errore nel reso' }, { status: 500 })
  }
}
