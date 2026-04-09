import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { ApiResponse, authenticate, authorize } from '@/lib/api-enterprise'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const user = await authenticate(request)
        if (!authorize(user, 'PRODUCT_READ')) return ApiResponse.error('Unauthorized', 403)
      } catch { /* use demo-tenant */ }
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const movementType = searchParams.get('type')
    const skip = (page - 1) * limit

    const where: any = { productId: params.id }
    if (movementType) {
      where.movementType = movementType
    }

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        orderBy: { movementDate: 'desc' },
        skip,
        take: limit
      }),
      prisma.stockMovement.count({ where })
    ])

    return ApiResponse.paginated(movements, page, limit, total)
  } catch (error) {
    console.error('Error fetching stock movements:', error)
    return ApiResponse.error('Failed to fetch stock movements', 500)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let tenantId = 'demo-tenant'
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const user = await authenticate(request)
        if (!authorize(user, 'PRODUCT_UPDATE')) return ApiResponse.error('Unauthorized', 403)
        tenantId = user.tenantId
      } catch { /* use demo-tenant */ }
    }

    const body = await request.json()
    const {
      movementType,
      quantity,
      referenceType,
      referenceId,
      referenceNumber,
      fromLocation,
      toLocation,
      reason,
      notes
    } = body

    // Get current product
    const product = await prisma.product.findUnique({
      where: { id: params.id }
    })

    if (!product) {
      return ApiResponse.error('Product not found', 404)
    }

    // Validate stock quantity for OUT movements
    if (movementType === 'OUT' && product.trackStock) {
      if (quantity > product.stockQuantity) {
        return ApiResponse.error('Insufficient stock quantity', 400)
      }
    }

    // Create stock movement
    const movement = await prisma.stockMovement.create({
      data: {
        tenantId,
        productId: params.id,
        movementType,
        quantity,
        referenceType,
        referenceId,
        referenceNumber,
        fromLocation,
        toLocation,
        reason,
        notes
      }
    })

    // Update product stock quantity
    let newStockQuantity = product.stockQuantity
    if (movementType === 'IN') {
      newStockQuantity += quantity
    } else if (movementType === 'OUT') {
      newStockQuantity -= quantity
    } else if (movementType === 'ADJUSTMENT') {
      newStockQuantity = quantity
    }

    await prisma.product.update({
      where: { id: params.id },
      data: { stockQuantity: newStockQuantity }
    })

    // Create notification for low stock
    if (newStockQuantity <= product.minStockLevel) {
      // TODO: Implement notification system
      console.log(`Low stock alert for product ${product.name}: ${newStockQuantity} units`)
    }

    return ApiResponse.success(movement)
  } catch (error) {
    console.error('Error creating stock movement:', error)
    return ApiResponse.error('Failed to create stock movement', 500)
  }
}
