import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiResponse, authenticate, authorize } from '@/lib/api-enterprise'

const normalizeOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

const normalizeNumber = (value: unknown, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      return fallback
    }

    const parsed = Number(trimmed)
    return Number.isFinite(parsed) ? parsed : fallback
  }

  return fallback
}

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
    const status = searchParams.get('status')
    const category = searchParams.get('category')
    const lowStock = searchParams.get('lowStock') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit
    const sortBy = searchParams.get('sortBy') || 'name'
    const sortOrder = searchParams.get('sortOrder') || 'asc'

    // Build where clause
    const where: any = { tenantId, isActive: true }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (status) {
      where.status = status
    }

    if (category) {
      where.category = {
        is: {
          name: category
        }
      }
    }

    if (lowStock) {
      where.trackStock = true
      where.stockQuantity = { lte: prisma.product.fields.minStockLevel }
    }

    const orderBy: any = {}
    if (sortBy === 'category') {
      orderBy.category = { name: sortOrder }
    } else if (['name', 'unitPrice', 'stockQuantity', 'soldCount', 'revenue', 'createdAt', 'updatedAt', 'status'].includes(sortBy)) {
      orderBy[sortBy] = sortOrder
    } else {
      orderBy.name = 'asc'
    }

    // Get products with pagination
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          },
          supplier: {
            select: {
              id: true,
              name: true
            }
          },
          invoiceItems: {
            select: {
              quantity: true,
              totalPrice: true
            }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.product.count({ where })
    ])

    const normalizedProducts = products.map((product) => ({
      ...product,
      categoryName: product.category?.name ?? null,
      supplierName: product.supplier?.name ?? null
    }))

    // Calculate statistics
    const stats = await prisma.product.aggregate({
      where: { tenantId, isActive: true },
      _count: true,
      _sum: {
        stockQuantity: true,
        unitPrice: true
      },
      _avg: {
        unitPrice: true
      }
    })

    // Get low stock products
    const lowStockProducts = await prisma.product.count({
      where: {
        tenantId,
        isActive: true,
        trackStock: true,
        stockQuantity: { lte: prisma.product.fields.minStockLevel }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        products: normalizedProducts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        stats: {
          totalProducts: stats._count,
          totalStockValue: stats._sum.stockQuantity || 0,
          averagePrice: stats._avg.unitPrice || 0,
          lowStockProducts
        }
      }
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      tenantId = 'demo-tenant',
      sku, name, description, brand, code, barcode,
      size, color,
      unitPrice, costPrice, markupRate = 0, taxRate = 22,
      unitOfMeasure = 'pz',
      stockQuantity = 0, minStockLevel = 0, maxStockLevel,
      trackStock = true,
      categoryId, supplierId
    } = body

    const normalizedTenantId = normalizeOptionalString(tenantId) || 'demo-tenant'
    const normalizedSku = normalizeOptionalString(sku)
    const normalizedName = normalizeOptionalString(name)
    const normalizedDescription = normalizeOptionalString(description)
    const normalizedBrand = normalizeOptionalString(brand)
    const normalizedCode = normalizeOptionalString(code)
    const normalizedBarcode = normalizeOptionalString(barcode)
    const normalizedSize = normalizeOptionalString(size)
    const normalizedColor = normalizeOptionalString(color)
    const normalizedUnitOfMeasure = normalizeOptionalString(unitOfMeasure) || 'pz'
    const normalizedCategoryId = typeof categoryId === 'string' ? categoryId.trim() : categoryId
    const normalizedSupplierId = typeof supplierId === 'string' ? supplierId.trim() : supplierId
    const normalizedUnitPrice = normalizeNumber(unitPrice)
    const normalizedCostPrice = normalizeNumber(costPrice)
    const normalizedMarkupRate = normalizeNumber(markupRate)
    const normalizedTaxRate = normalizeNumber(taxRate, 22)
    const normalizedStockQuantity = normalizeNumber(stockQuantity)
    const normalizedMinStockLevel = normalizeNumber(minStockLevel)
    const normalizedMaxStockLevel = maxStockLevel === null || maxStockLevel === undefined || String(maxStockLevel).trim() === ''
      ? undefined
      : normalizeNumber(maxStockLevel)

    if (!normalizedName) {
      return NextResponse.json(
        { success: false, error: 'Product name is required' },
        { status: 400 }
      )
    }

    // Check if product with same SKU already exists
    if (normalizedSku) {
      const existingProduct = await prisma.product.findFirst({
        where: { tenantId: normalizedTenantId, sku: normalizedSku }
      })

      if (existingProduct) {
        return NextResponse.json(
          { success: false, error: 'Product with this SKU already exists' },
          { status: 400 }
        )
      }
    }

    const product = await prisma.product.create({
      data: {
        tenantId: normalizedTenantId,
        sku: normalizedSku,
        name: normalizedName,
        description: normalizedDescription,
        brand: normalizedBrand,
        code: normalizedCode,
        barcode: normalizedBarcode,
        size: normalizedSize,
        color: normalizedColor,
        unitPrice: normalizedUnitPrice,
        costPrice: normalizedCostPrice,
        markupRate: normalizedMarkupRate,
        taxRate: normalizedTaxRate,
        unitOfMeasure: normalizedUnitOfMeasure,
        stockQuantity: normalizedStockQuantity,
        minStockLevel: normalizedMinStockLevel,
        maxStockLevel: normalizedMaxStockLevel,
        trackStock: Boolean(trackStock),
        ...(normalizedCategoryId ? { categoryId: normalizedCategoryId } : {}),
        ...(normalizedSupplierId ? { supplierId: normalizedSupplierId } : {})
      }
    })

    // Create initial stock movement if stock > 0
    if (normalizedStockQuantity > 0) {
      await prisma.stockMovement.create({
        data: {
          tenantId: normalizedTenantId,
          productId: product.id,
          movementType: 'IN',
          quantity: normalizedStockQuantity,
          reference: 'INITIAL_STOCK',
          notes: 'Stock iniziale'
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: product
    })
  } catch (error) {
    console.error('Error creating product:', error)

    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    ) {
      return NextResponse.json(
        { success: false, error: 'Esiste già un prodotto con gli stessi dati univoci (controlla SKU).' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
