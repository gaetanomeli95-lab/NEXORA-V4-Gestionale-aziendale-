import { NextRequest } from 'next/server'
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

    // Get product statistics
    const [totalProducts, activeProducts, averagePrice] = await Promise.all([
      prisma.product.count({
        where: { tenantId, isActive: true }
      }),
      prisma.product.count({
        where: { tenantId, isActive: true, status: 'ACTIVE' }
      }),
      prisma.product.aggregate({
        where: { tenantId, isActive: true },
        _avg: { unitPrice: true }
      })
    ])

    // Get low stock products
    const lowStockProducts = await prisma.product.count({
      where: {
        tenantId,
        isActive: true,
        trackStock: true,
        stockQuantity: { lte: prisma.product.fields.minStockLevel }
      }
    })

    // Calculate total stock value
    const productsWithValue = await prisma.product.findMany({
      where: { tenantId, isActive: true, trackStock: true },
      select: {
        stockQuantity: true,
        unitPrice: true
      }
    })

    const totalValue = productsWithValue.reduce((sum, product) => {
      return sum + (product.stockQuantity * product.unitPrice)
    }, 0)

    // Get top products by revenue
    const topProducts = await prisma.product.findMany({
      where: { tenantId, isActive: true },
      orderBy: { revenue: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        sku: true,
        status: true,
        revenue: true,
        soldCount: true
      }
    })

    // Get category distribution
    const categoryDistribution: Record<string, { count: number; value: number }> = {}
    const productsByCategory = await prisma.product.findMany({
      where: { tenantId, isActive: true },
      select: {
        revenue: true,
        category: {
          select: {
            name: true
          }
        }
      }
    })

    productsByCategory.forEach(product => {
      const category = product.category?.name || 'Senza categoria'
      if (!categoryDistribution[category]) {
        categoryDistribution[category] = { count: 0, value: 0 }
      }
      categoryDistribution[category].count++
      categoryDistribution[category].value += product.revenue
    })

    // Get stock alerts
    const stockAlerts = await prisma.product.findMany({
      where: {
        tenantId,
        isActive: true,
        trackStock: true,
        stockQuantity: { lte: prisma.product.fields.minStockLevel }
      },
      take: 10,
      select: {
        id: true,
        name: true,
        sku: true,
        stockQuantity: true,
        minStockLevel: true,
        unitPrice: true
      }
    })

    // Get recent products
    const recentProducts = await prisma.product.findMany({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        name: true,
        sku: true,
        createdAt: true,
        status: true
      }
    })

    const stats = {
      totalProducts,
      activeProducts,
      lowStockProducts,
      totalStockValue: totalValue,
      averagePrice: averagePrice._avg.unitPrice || 0,
      topProducts,
      categoryDistribution,
      stockAlerts,
      recentProducts
    }

    return ApiResponse.success(stats)
  } catch (error) {
    console.error('Error fetching product stats:', error)
    return ApiResponse.error('Failed to fetch product stats', 500)
  }
}
