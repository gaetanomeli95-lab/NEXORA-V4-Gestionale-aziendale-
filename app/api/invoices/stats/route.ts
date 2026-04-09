import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId') || 'demo-tenant'

    // Get real statistics from database
    const [
      totalStats,
      statusStats,
      overdueInvoices
    ] = await Promise.all([
      // Total amounts
      prisma.invoice.aggregate({
        where: { tenantId },
        _sum: {
          totalAmount: true
        },
        _count: true
      }),
      
      // Stats by status
      prisma.invoice.groupBy({
        by: ['status'],
        where: { tenantId },
        _sum: {
          totalAmount: true
        },
        _count: true
      }),
      
      // Overdue invoices
      prisma.invoice.findMany({
        where: {
          tenantId,
          status: 'SENT',
          dueDate: {
            lt: new Date()
          }
        },
        include: {
          customer: true
        },
        orderBy: {
          dueDate: 'asc'
        },
        take: 10
      })
    ])

    // Calculate amounts by status
    const byStatus = statusStats.reduce((acc, stat) => {
      acc[stat.status] = {
        count: stat._count,
        amount: stat._sum.totalAmount || 0
      }
      return acc
    }, {} as any)

    // Calculate totals
    const totalAmount = totalStats._sum.totalAmount || 0
    const paidAmount = byStatus.PAID?.amount || 0
    const totalOutstanding = totalAmount - paidAmount
    const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0)
    const pendingAmount = totalOutstanding - overdueAmount

    // Format overdue invoices for response
    const topOverdueInvoices = overdueInvoices.map(inv => ({
      id: inv.id,
      number: inv.number,
      customer: inv.customer?.name || 'N/A',
      amount: inv.totalAmount || 0,
      daysOverdue: Math.floor((new Date().getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24))
    }))

    const realStats = {
      totalOutstanding,
      overdueAmount,
      pendingAmount,
      paidAmount,
      totalInvoices: totalStats._count,
      byStatus,
      topOverdueInvoices
    }

    return NextResponse.json({
      success: true,
      data: realStats
    })
  } catch (error) {
    console.error('Error fetching invoice stats:', error)
    
    // Return empty stats if database is not available
    return NextResponse.json({
      success: true,
      data: {
        totalOutstanding: 0,
        overdueAmount: 0,
        pendingAmount: 0,
        paidAmount: 0,
        totalInvoices: 0,
        byStatus: {},
        topOverdueInvoices: []
      }
    })
  }
}
