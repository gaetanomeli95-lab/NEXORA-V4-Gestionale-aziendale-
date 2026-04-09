import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiResponse, authenticate, authorize } from '@/lib/api-enterprise'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const authHeader = request.headers.get('authorization')
    let tenantId = searchParams.get('tenantId') || 'demo-tenant'

    if (authHeader?.startsWith('Bearer ')) {
      const user = await authenticate(request)
      if (!authorize(user, 'PRODUCT_READ')) {
        return ApiResponse.error('Unauthorized', 403)
      }
      tenantId = user.tenantId
    }

    const search = searchParams.get('search')
    const filter = searchParams.get('filter') // 'all' | 'lowStock' | 'outOfStock'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    const where: any = { tenantId, isActive: true, trackStock: true }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (filter === 'lowStock') {
      where.stockQuantity = { gt: 0, lte: prisma.product.fields.minStockLevel }
    } else if (filter === 'outOfStock') {
      where.stockQuantity = { lte: 0 }
    }

    const orderBy: any = {}
    if (['name', 'stockQuantity', 'unitPrice', 'sku', 'code'].includes(sortBy)) {
      orderBy[sortBy] = sortOrder
    } else {
      orderBy.name = 'asc'
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        select: {
          id: true,
          name: true,
          sku: true,
          code: true,
          barcode: true,
          unitOfMeasure: true,
          warehouseName: true,
          location: true,
          stockQuantity: true,
          minStockLevel: true,
          maxStockLevel: true,
          reorderPoint: true,
          reorderQty: true,
          unitPrice: true,
          costPrice: true,
          category: { select: { id: true, name: true } },
          supplier: { select: { id: true, name: true } }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.product.count({ where })
    ])

    // Stock summary stats
    const allTracked = await prisma.product.findMany({
      where: { tenantId, isActive: true, trackStock: true },
      select: { stockQuantity: true, unitPrice: true, costPrice: true, minStockLevel: true }
    })

    const totalItems = allTracked.length
    const totalStock = allTracked.reduce((sum, p) => sum + p.stockQuantity, 0)
    const totalValue = allTracked.reduce((sum, p) => sum + (p.stockQuantity * (p.costPrice || p.unitPrice)), 0)
    const lowStockCount = allTracked.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.minStockLevel).length
    const outOfStockCount = allTracked.filter(p => p.stockQuantity <= 0).length

    // Recent movements
    const recentMovements = await prisma.stockMovement.findMany({
      where: { tenantId },
      include: {
        product: { select: { id: true, name: true, sku: true } }
      },
      orderBy: { movementDate: 'desc' },
      take: 20
    })

    return NextResponse.json({
      success: true,
      data: {
        products,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        stats: {
          totalItems,
          totalStock,
          totalValue,
          lowStockCount,
          outOfStockCount
        },
        recentMovements
      }
    })
  } catch (error) {
    console.error('Error fetching warehouse data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch warehouse data' },
      { status: 500 }
    )
  }
}
