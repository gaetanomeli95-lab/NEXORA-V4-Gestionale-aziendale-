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
      if (!authorize(user, 'INVOICE_READ')) {
        return ApiResponse.error('Unauthorized', 403)
      }
      tenantId = user.tenantId
    }

    const [
      totalEstimates,
      draftCount,
      sentCount,
      acceptedCount,
      rejectedCount,
      totals,
      recentEstimates,
      unpaidEstimates
    ] = await Promise.all([
      prisma.estimate.count({ where: { tenantId } }),
      prisma.estimate.count({ where: { tenantId, status: 'DRAFT' } }),
      prisma.estimate.count({ where: { tenantId, status: 'SENT' } }),
      prisma.estimate.count({ where: { tenantId, status: 'ACCEPTED' } }),
      prisma.estimate.count({ where: { tenantId, status: 'REJECTED' } }),
      prisma.estimate.aggregate({
        where: { tenantId },
        _sum: { totalAmount: true, paidAmount: true, balanceAmount: true },
        _avg: { totalAmount: true }
      }),
      prisma.estimate.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          customer: { select: { id: true, name: true } }
        }
      }),
      prisma.estimate.findMany({
        where: { tenantId, paymentStatus: 'NON PAGATO', status: { not: 'REJECTED' } },
        orderBy: { totalAmount: 'desc' },
        take: 10,
        include: {
          customer: { select: { id: true, name: true } }
        }
      })
    ])

    const stats = {
      totalEstimates,
      byStatus: {
        DRAFT: draftCount,
        SENT: sentCount,
        ACCEPTED: acceptedCount,
        REJECTED: rejectedCount
      },
      totalValue: totals._sum.totalAmount || 0,
      totalPaid: totals._sum.paidAmount || 0,
      totalBalance: totals._sum.balanceAmount || 0,
      averageValue: totals._avg.totalAmount || 0,
      recentEstimates,
      unpaidEstimates
    }

    return ApiResponse.success(stats)
  } catch (error) {
    console.error('Error fetching estimate stats:', error)
    return ApiResponse.error('Failed to fetch estimate stats', 500)
  }
}
