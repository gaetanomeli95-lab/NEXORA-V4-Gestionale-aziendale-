import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { ApiResponse, authenticate, authorize } from '@/lib/api-enterprise'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

async function resolveTenantId(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (authorize(user, 'PAYMENT_READ')) {
      return user.tenantId
    }
  } catch {
    // Fallback to session/query resolution below
  }

  const session = await getServerSession(authOptions)

  return (session?.user as { tenantId?: string } | undefined)?.tenantId ||
    new URL(request.url).searchParams.get('tenantId') ||
    'demo-tenant'
}

export async function GET(request: NextRequest) {
  try {
    const tenantId = await resolveTenantId(request)
    const activePaymentWhere = {
      tenantId,
      status: { not: 'CANCELLED' }
    }

    // Get payment statistics
    const [
      totalPayments,
      totalRevenue,
      pendingPayments,
      overduePayments,
      averagePayment
    ] = await Promise.all([
      prisma.payment.count({
        where: activePaymentWhere
      }),
      prisma.payment.aggregate({
        where: activePaymentWhere,
        _sum: { amount: true }
      }),
      prisma.invoice.count({
        where: {
          tenantId,
          status: { not: 'CANCELLED' },
          dueDate: { gte: new Date() },
          paidAmount: { lt: prisma.invoice.fields.totalAmount }
        }
      }),
      prisma.invoice.count({
        where: {
          tenantId,
          status: { notIn: ['PAID', 'CANCELLED'] },
          dueDate: { lt: new Date() }
        }
      }),
      prisma.payment.aggregate({
        where: activePaymentWhere,
        _avg: { amount: true }
      })
    ])

    // Get payment methods distribution
    const paymentMethods = await prisma.payment.groupBy({
      by: ['method'],
      where: activePaymentWhere,
      _count: true,
      _sum: { amount: true }
    })

    const methodDistribution = paymentMethods.reduce((acc, stat) => {
      acc[stat.method] = {
        count: stat._count,
        amount: stat._sum.amount || 0
      }
      return acc
    }, {} as Record<string, { count: number; amount: number }>)

    // Get monthly trend
    const monthlyTrend = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date()
      monthDate.setMonth(monthDate.getMonth() - i)
      monthDate.setDate(1)
      const monthEnd = new Date(monthDate)
      monthEnd.setMonth(monthEnd.getMonth() + 1)
      monthEnd.setDate(0)

      const monthPayments = await prisma.payment.aggregate({
        where: {
          ...activePaymentWhere,
          paymentDate: {
            gte: monthDate,
            lte: monthEnd
          }
        },
        _sum: { amount: true },
        _count: true
      })

      monthlyTrend.push({
        month: monthDate.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' }),
        revenue: monthPayments._sum.amount || 0,
        payments: monthPayments._count
      })
    }

    // Get upcoming payments (next 30 days)
    const upcomingDate = new Date()
    upcomingDate.setDate(upcomingDate.getDate() + 30)

    const upcomingPayments = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: { not: 'CANCELLED' },
        paidAmount: { lt: prisma.invoice.fields.totalAmount },
        dueDate: { 
          gte: new Date(),
          lte: upcomingDate
        }
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { dueDate: 'asc' },
      take: 10
    })

    const upcomingPaymentsData = upcomingPayments.map(invoice => {
      const daysUntilDue = Math.ceil((invoice.dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      const remainingAmount = invoice.totalAmount - invoice.paidAmount

      return {
        invoiceId: invoice.id,
        invoiceNumber: invoice.number,
        customerName: invoice.customer.name,
        amount: remainingAmount,
        dueDate: invoice.dueDate.toISOString(),
        daysUntilDue
      }
    })

    // Get overdue invoices
    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        status: { notIn: ['PAID', 'CANCELLED'] },
        dueDate: { lt: new Date() },
        paidAmount: { lt: prisma.invoice.fields.totalAmount }
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { dueDate: 'asc' },
      take: 10
    })

    const overdueInvoicesData = overdueInvoices.map(invoice => {
      const daysOverdue = Math.ceil((new Date().getTime() - invoice.dueDate.getTime()) / (1000 * 60 * 60 * 24))
      const remainingAmount = invoice.totalAmount - invoice.paidAmount

      return {
        invoiceId: invoice.id,
        invoiceNumber: invoice.number,
        customerName: invoice.customer.name,
        amount: remainingAmount,
        daysOverdue
      }
    })

    const stats = {
      totalPayments,
      totalRevenue: totalRevenue._sum.amount || 0,
      pendingPayments,
      overduePayments,
      averagePayment: averagePayment._avg.amount || 0,
      paymentMethods: methodDistribution,
      monthlyTrend,
      upcomingPayments: upcomingPaymentsData,
      overdueInvoices: overdueInvoicesData
    }

    return ApiResponse.success(stats)
  } catch (error) {
    console.error('Error fetching payment stats:', error)
    return ApiResponse.error('Failed to fetch payment stats', 500)
  }
}
