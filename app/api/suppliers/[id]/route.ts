import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-tenant'
    const body = await request.json()

    const existingSupplier = await prisma.supplier.findFirst({
      where: { id: params.id, tenantId }
    })

    if (!existingSupplier) {
      return NextResponse.json({ success: false, error: 'Fornitore non trovato' }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}
    const fields = [
      'name', 'contactName', 'phone', 'email', 'address', 'city', 'vatNumber',
      'fiscalCode', 'province', 'postalCode', 'country', 'notes', 'isActive'
    ]

    for (const field of fields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (typeof updateData.name === 'string') {
      updateData.name = updateData.name.trim()
    }

    if (!updateData.name && !existingSupplier.name?.trim()) {
      return NextResponse.json({ success: false, error: 'Il nome è obbligatorio' }, { status: 400 })
    }

    const updatedSupplier = await prisma.supplier.update({
      where: { id: params.id },
      data: updateData
    })

    return NextResponse.json({ success: true, data: updatedSupplier })
  } catch (error) {
    console.error('Error updating supplier:', error)
    return NextResponse.json({ success: false, error: 'Errore server' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-tenant'

    const existingSupplier = await prisma.supplier.findFirst({
      where: { id: params.id, tenantId }
    })

    if (!existingSupplier) {
      return NextResponse.json({ success: false, error: 'Fornitore non trovato' }, { status: 404 })
    }

    const supplierOrdersCount = await prisma.supplierOrder.count({
      where: { supplierId: params.id, tenantId }
    })

    if (supplierOrdersCount > 0) {
      return NextResponse.json(
        { success: false, error: 'Impossibile eliminare: il fornitore è collegato a ordini fornitore esistenti' },
        { status: 400 }
      )
    }

    await prisma.$transaction(async (tx) => {
      await tx.product.updateMany({
        where: { supplierId: params.id, tenantId },
        data: { supplierId: null }
      })

      await tx.supplier.delete({
        where: { id: params.id }
      })
    })

    return NextResponse.json({ success: true, message: 'Fornitore eliminato' })
  } catch (error) {
    console.error('Error deleting supplier:', error)
    return NextResponse.json({ success: false, error: 'Errore server' }, { status: 500 })
  }
}
