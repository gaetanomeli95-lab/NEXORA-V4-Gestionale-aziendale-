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
        if (!authorize(user, 'CUSTOMER_READ')) return ApiResponse.error('Unauthorized', 403)
        tenantId = user.tenantId
      } catch { /* use demo-tenant */ }
    }

    // Get customer statistics
    const [totalCustomers, activeCustomers, totalRevenue, outstandingBalance] = await Promise.all([
      prisma.customer.count({
        where: { tenantId, isActive: true }
      }),
      prisma.customer.count({
        where: { tenantId, isActive: true, status: 'ACTIVE' }
      }),
      prisma.invoice.aggregate({
        where: { tenantId },
        _sum: { totalAmount: true }
      }),
      prisma.invoice.aggregate({
        where: { 
          tenantId,
          status: { not: 'PAID' }
        },
        _sum: { totalAmount: true }
      })
    ])

    // Get new customers this month
    const firstDayOfMonth = new Date()
    firstDayOfMonth.setDate(1)
    firstDayOfMonth.setHours(0, 0, 0, 0)

    const newCustomersThisMonth = await prisma.customer.count({
      where: {
        tenantId,
        isActive: true,
        createdAt: { gte: firstDayOfMonth }
      }
    })

    // Get average order value
    const invoiceStats = await prisma.invoice.aggregate({
      where: { tenantId },
      _avg: { totalAmount: true },
      _count: true
    })

    // Get top customers
    const topCustomers = await prisma.customer.findMany({
      where: { tenantId, isActive: true },
      include: {
        invoices: {
          select: {
            totalAmount: true
          }
        }
      }
    })

    const topCustomersWithStats = topCustomers
      .map(customer => ({
        id: customer.id,
        name: customer.name,
        email: customer.email,
        totalRevenue: customer.invoices.reduce((sum: number, inv: { totalAmount: number }) => sum + inv.totalAmount, 0),
        totalInvoices: customer.invoices.length
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5)

    const stats = {
      totalCustomers,
      activeCustomers,
      newCustomersThisMonth,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      averageOrderValue: invoiceStats._avg.totalAmount || 0,
      outstandingBalance: outstandingBalance._sum.totalAmount || 0,
      topCustomers: topCustomersWithStats
    }

    return ApiResponse.success(stats)
  } catch (error) {
    console.error('Error fetching customer stats:', error)
    return ApiResponse.error('Failed to fetch customer stats', 500)
  }
}
