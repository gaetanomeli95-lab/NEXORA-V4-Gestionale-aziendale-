import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-tenant'
    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ success: false, error: 'Il nome è obbligatorio' }, { status: 400 })
    }

    const existing = await prisma.productCategory.findFirst({
      where: { 
        tenantId, 
        name,
        id: { not: params.id } 
      }
    })

    if (existing) {
      return NextResponse.json({ success: false, error: 'Categoria già esistente' }, { status: 400 })
    }

    const category = await prisma.productCategory.update({
      where: { id: params.id },
      data: { name, description }
    })

    return NextResponse.json({ success: true, data: category })
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json({ success: false, error: 'Failed to update category' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-tenant'
    
    const activeProductsCount = await prisma.product.count({
      where: { categoryId: params.id, tenantId, isActive: true }
    })

    if (activeProductsCount > 0) {
      return NextResponse.json({ 
        success: false, 
        error: `Impossibile eliminare: ci sono ${activeProductsCount} prodotti attivi in questa categoria` 
      }, { status: 400 })
    }

    await prisma.product.updateMany({
      where: {
        categoryId: params.id,
        tenantId,
        isActive: false
      },
      data: {
        categoryId: null
      }
    })

    await prisma.productCategory.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true, message: 'Categoria eliminata' })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete category' }, { status: 500 })
  }
}
