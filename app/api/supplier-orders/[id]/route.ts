import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseDateTimeInput } from '@/lib/utils'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-tenant'

    const order = await prisma.supplierOrder.findFirst({
      where: { id: params.id, tenantId },
      include: {
        supplier: true,
        items: { include: { product: true } }
      }
    })

    if (!order) {
      return NextResponse.json({ success: false, error: 'Ordine non trovato' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: order })
  } catch (error) {
    console.error('Error fetching supplier order:', error)
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

    const existing = await prisma.supplierOrder.findFirst({
      where: { id: params.id, tenantId }
    })

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Ordine non trovato' }, { status: 404 })
    }

    const updateData: any = {}

    if (body.supplierId !== undefined) {
      updateData.supplierId = body.supplierId
    }

    if (body.number !== undefined) {
      const normalizedNumber = String(body.number || '').trim()
      if (!normalizedNumber) {
        return NextResponse.json({ success: false, error: 'Numero ordine obbligatorio' }, { status: 400 })
      }

      const duplicate = await prisma.supplierOrder.findFirst({
        where: {
          tenantId,
          number: normalizedNumber,
          NOT: { id: params.id }
        }
      })

      if (duplicate) {
        return NextResponse.json({ success: false, error: 'Order number already exists' }, { status: 400 })
      }

      updateData.number = normalizedNumber
    }

    if (body.orderDate !== undefined) {
      updateData.orderDate = body.orderDate ? (parseDateTimeInput(body.orderDate, existing.orderDate) || existing.orderDate) : existing.orderDate
    }

    if (body.loadingStatus) {
      const validStatuses = ['DA CARICARE', 'PARZIALE', 'CARICATO', 'CANCELLED']
      if (!validStatuses.includes(body.loadingStatus)) {
        return NextResponse.json({ success: false, error: 'Stato carico non valido' }, { status: 400 })
      }
      
      // If status is changing to LOADED, update inventory stock
      if (body.loadingStatus === 'CARICATO' && existing.loadingStatus !== 'CARICATO') {
        const items = await prisma.supplierOrderItem.findMany({
          where: { supplierOrderId: params.id }
        });

        for (const item of items) {
          if (item.productId) {
            // Update product stock
            await prisma.product.update({
              where: { id: item.productId },
              data: {
                stockQuantity: {
                  increment: item.quantity
                }
              }
            });

            // Create stock movement record
            await prisma.stockMovement.create({
              data: {
                tenantId,
                productId: item.productId,
                movementType: 'IN',
                quantity: item.quantity,
                reference: existing.number,
                referenceType: 'SUPPLIER_ORDER',
                reason: `Carico da ordine fornitore ${existing.number}`,
                movementDate: new Date()
              }
            });
          }
        }
      }
      
      updateData.loadingStatus = body.loadingStatus
    }

    if (body.paymentStatus) {
      const validStatuses = ['NON PAGATO', 'PARZIALE', 'PAGATO']
      if (!validStatuses.includes(body.paymentStatus)) {
        return NextResponse.json({ success: false, error: 'Stato pagamento non valido' }, { status: 400 })
      }
      updateData.paymentStatus = body.paymentStatus
    }

    if (body.notes !== undefined) updateData.notes = body.notes

    if (body.items !== undefined) {
      if (existing.loadingStatus === 'CARICATO') {
        return NextResponse.json({ success: false, error: 'Non puoi modificare le righe di un ordine già caricato a magazzino' }, { status: 400 })
      }

      let totalAmount = 0
      const processedItems = Array.isArray(body.items)
        ? body.items.map((item: any) => {
            const quantity = Number(item.quantity || 1)
            const unitPrice = Number(item.unitPrice || 0)
            const totalPrice = quantity * unitPrice
            totalAmount += totalPrice

            return {
              id: typeof item.id === 'string' && !item.id.startsWith('temp-') ? item.id : undefined,
              productId: item.productId || undefined,
              description: item.description || '',
              quantity,
              unit: item.unit || 'pz',
              unitPrice,
              totalPrice,
              taxRate: Number(item.taxRate || 22),
              notes: item.notes || undefined
            }
          })
        : []

      updateData.totalAmount = totalAmount

      const existingItemIds = processedItems
        .filter((item: any) => item.id)
        .map((item: any) => item.id)

      await prisma.supplierOrderItem.deleteMany({
        where: existingItemIds.length > 0
          ? {
              supplierOrderId: params.id,
              id: { notIn: existingItemIds }
            }
          : {
              supplierOrderId: params.id
            }
      })

      for (const item of processedItems) {
        if (item.id) {
          await prisma.supplierOrderItem.update({
            where: { id: item.id },
            data: {
              productId: item.productId,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              taxRate: item.taxRate,
              notes: item.notes
            }
          })
        } else {
          await prisma.supplierOrderItem.create({
            data: {
              supplierOrderId: params.id,
              productId: item.productId,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              taxRate: item.taxRate,
              notes: item.notes
            }
          })
        }
      }
    }

    const updated = await prisma.supplierOrder.update({
      where: { id: params.id },
      data: updateData,
      include: { supplier: true, items: { include: { product: true } } }
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error updating supplier order:', error)
    return NextResponse.json({ success: false, error: 'Errore server' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-tenant'

    const existing = await prisma.supplierOrder.findFirst({
      where: { id: params.id, tenantId }
    })

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Ordine non trovato' }, { status: 404 })
    }

    await prisma.supplierOrderItem.deleteMany({ where: { supplierOrderId: params.id } })
    await prisma.supplierOrder.deleteMany({ where: { id: params.id } })

    return NextResponse.json({ success: true, message: 'Ordine eliminato' })
  } catch (error) {
    console.error('Error deleting supplier order:', error)
    return NextResponse.json({ success: false, error: 'Errore server' }, { status: 500 })
  }
}
