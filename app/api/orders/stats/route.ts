import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiResponse, authenticate, authorize } from '@/lib/api-enterprise'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    let tenantId = searchParams.get('tenantId') || 'demo-tenant'
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const user = await authenticate(request)
        if (!authorize(user, 'ORDER_READ')) return ApiResponse.error('Unauthorized', 403)
        tenantId = user.tenantId
      } catch { /* use demo-tenant */ }
    }

    // Get order statistics
    const [
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      totalRevenue,
      overdueOrders
    ] = await Promise.all([
      prisma.order.count({
        where: { tenantId }
      }),
      prisma.order.count({
        where: { tenantId, status: 'PENDING' }
      }),
      prisma.order.count({
        where: { tenantId, status: 'PROCESSING' }
      }),
      prisma.order.count({
        where: { tenantId, status: 'SHIPPED' }
      }),
      prisma.order.count({
        where: { tenantId, status: 'DELIVERED' }
      }),
      prisma.order.aggregate({
        where: { tenantId },
        _sum: { totalAmount: true }
      }),
      prisma.order.count({
        where: {
          tenantId,
          status: { notIn: ['DELIVERED', 'CANCELLED'] },
          expectedDeliveryDate: {
            lt: new Date()
          }
        }
      })
    ])

    // Calculate average order value
    const orderStats = await prisma.order.aggregate({
      where: { tenantId },
      _avg: { totalAmount: true },
      _count: true
    })

    // Get top customers by orders
    const topCustomers = await prisma.customer.findMany({
      where: { tenantId, isActive: true },
      take: 5,
      orderBy: {
        orders: {
          _count: 'desc'
        }
      },
      include: {
        orders: {
          select: {
            totalAmount: true
          }
        }
      }
    })

    const topCustomersWithStats = topCustomers.map(customer => ({
      customerId: customer.id,
      customerName: customer.name,
      orderCount: customer.orders.length,
      totalRevenue: customer.orders.reduce((sum, order) => sum + order.totalAmount, 0)
    }))

    // Get status distribution
    const statusDistribution = await prisma.order.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: true,
      _sum: { totalAmount: true }
    })

    const statusDist = statusDistribution.reduce((acc, stat) => {
      acc[stat.status] = {
        count: stat._count,
        revenue: stat._sum.totalAmount || 0
      }
      return acc
    }, {} as Record<string, { count: number; revenue: number }>)

    const stats = {
      totalOrders,
      pendingOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      averageOrderValue: orderStats._avg.totalAmount || 0,
      overdueOrders,
      topCustomers: topCustomersWithStats,
      statusDistribution: statusDist
    }

    return ApiResponse.success(stats)
  } catch (error) {
    console.error('Error fetching order stats:', error)
    return ApiResponse.error('Failed to fetch order stats', 500)
  }
}
