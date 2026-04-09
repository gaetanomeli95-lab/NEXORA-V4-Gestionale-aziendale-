import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const normalizeOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

const normalizeNumber = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      return undefined
    }

    const parsed = Number(trimmed)
    return Number.isFinite(parsed) ? parsed : undefined
  }

  return undefined
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-tenant'

    const product = await prisma.product.findFirst({
      where: { id: params.id, tenantId },
      include: { category: true, supplier: true }
    })

    if (!product) {
      return NextResponse.json({ success: false, error: 'Prodotto non trovato' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: product })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json({ success: false, error: 'Errore server' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-tenant'
    const body = await request.json()

    const existing = await prisma.product.findFirst({
      where: { id: params.id, tenantId }
    })

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Prodotto non trovato' }, { status: 404 })
    }

    const updateData: any = {}
    const optionalStringFields = ['code', 'sku', 'barcode', 'description', 'brand', 'size', 'color']
    const requiredNumberFields = ['unitPrice', 'markupRate', 'taxRate', 'stockQuantity', 'minStockLevel']
    const optionalNumberFields = ['costPrice', 'maxStockLevel']

    if (body.name !== undefined) {
      const normalizedName = normalizeOptionalString(body.name)
      if (!normalizedName) {
        return NextResponse.json({ success: false, error: 'Product name is required' }, { status: 400 })
      }

      updateData.name = normalizedName
    }

    if (body.unitOfMeasure !== undefined) {
      updateData.unitOfMeasure = normalizeOptionalString(body.unitOfMeasure) || 'pz'
    }

    for (const field of optionalStringFields) {
      if (body[field] !== undefined) {
        const normalizedValue = normalizeOptionalString(body[field])
        updateData[field] = normalizedValue ?? null
      }
    }

    for (const field of requiredNumberFields) {
      if (body[field] !== undefined) {
        const normalizedValue = normalizeNumber(body[field])
        if (normalizedValue === undefined) {
          return NextResponse.json({ success: false, error: `Valore non valido per ${field}` }, { status: 400 })
        }

        updateData[field] = normalizedValue
      }
    }

    for (const field of optionalNumberFields) {
      if (body[field] !== undefined) {
        const normalizedValue = normalizeNumber(body[field])
        updateData[field] = normalizedValue ?? null
      }
    }

    if (body.trackStock !== undefined) {
      updateData.trackStock = Boolean(body.trackStock)
    }

    if (updateData.sku) {
      const duplicateSku = await prisma.product.findFirst({
        where: {
          tenantId,
          sku: updateData.sku,
          id: { not: params.id }
        }
      })

      if (duplicateSku) {
        return NextResponse.json({ success: false, error: 'Product with this SKU already exists' }, { status: 400 })
      }
    }

    if (body.categoryId !== undefined) {
      const categoryId = typeof body.categoryId === 'string' ? body.categoryId.trim() : body.categoryId
      updateData.categoryId = categoryId ? categoryId : null
    }

    if (body.supplierId !== undefined) {
      const supplierId = typeof body.supplierId === 'string' ? body.supplierId.trim() : body.supplierId
      updateData.supplierId = supplierId ? supplierId : null
    }

    const updated = await prisma.product.update({
      where: { id: params.id },
      data: updateData,
      include: { category: true, supplier: true }
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error updating product:', error)

    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return NextResponse.json({ success: false, error: 'Esiste già un prodotto con lo stesso SKU.' }, { status: 400 })
    }

    return NextResponse.json({ success: false, error: 'Errore server' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-tenant'

    const existing = await prisma.product.findFirst({
      where: { id: params.id, tenantId }
    })

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Prodotto non trovato' }, { status: 404 })
    }

    await prisma.product.update({
      where: { id: params.id },
      data: { isActive: false, status: 'DISCONTINUED' }
    })

    return NextResponse.json({ success: true, message: 'Prodotto eliminato' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ success: false, error: 'Errore server' }, { status: 500 })
  }
}
