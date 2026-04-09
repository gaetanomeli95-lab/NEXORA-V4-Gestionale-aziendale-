import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

async function resolveTenantId(request: NextRequest) {
  const session = await getServerSession(authOptions)

  return (session?.user as { tenantId?: string } | undefined)?.tenantId ||
    new URL(request.url).searchParams.get('tenantId') ||
    'demo-tenant'
}

const formatCurrency = (amount: number) => new Intl.NumberFormat('it-IT', {
  style: 'currency',
  currency: 'EUR'
}).format(amount)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = await resolveTenantId(request)
    const period = searchParams.get('period') || 'month'

    // Calculate date range based on period
    const now = new Date()
    let startDate = new Date()
    
    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
    }

    // Get revenue stats
    const revenueStats = await prisma.invoice.aggregate({
      where: {
        tenantId,
        issueDate: {
          gte: startDate,
          lte: now
        }
      },
      _sum: {
        totalAmount: true,
        taxAmount: true,
        subtotal: true
      },
      _count: true
    })

    // Get revenue by status
    const revenueByStatus = await prisma.invoice.groupBy({
      by: ['status'],
      where: {
        tenantId,
        issueDate: {
          gte: startDate,
          lte: now
        }
      },
      _sum: {
        totalAmount: true
      },
      _count: true
    })

    // Get customer stats
    const customerStats = await prisma.customer.aggregate({
      where: { tenantId, isActive: true },
      _count: true
    })

    // Get product stats
    const productStats = await prisma.product.aggregate({
      where: { tenantId, isActive: true },
      _count: true,
      _sum: {
        stockQuantity: true
      }
    })

    const overdueInvoices = await prisma.invoice.findMany({
      where: {
        tenantId,
        dueDate: { lt: now },
        paymentStatus: { not: 'PAID' },
        status: { not: 'CANCELLED' }
      },
      take: 5,
      orderBy: { dueDate: 'asc' },
      select: {
        id: true,
        number: true,
        dueDate: true,
        balanceAmount: true,
        customer: {
          select: {
            name: true
          }
        }
      }
    })

    const readyRepairs = await prisma.repair.findMany({
      where: {
        tenantId,
        status: 'PRONTO'
      },
      take: 5,
      orderBy: { deliveryDate: 'asc' },
      select: {
        id: true,
        number: true,
        model: true,
        deliveryDate: true,
        customer: {
          select: {
            name: true
          }
        }
      }
    })

    const trackedProducts = await prisma.product.findMany({
      where: {
        tenantId,
        isActive: true,
        trackStock: true
      },
      select: {
        id: true,
        name: true,
        stockQuantity: true,
        minStockLevel: true,
        reorderQty: true,
        supplier: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        stockQuantity: 'asc'
      }
    })

    const lowStockProductsList = trackedProducts
      .filter((product) => Number(product.stockQuantity) <= Number(product.minStockLevel || 0))
      .slice(0, 5)

    const lowStockProducts = lowStockProductsList.length

    // Get recent invoices
    const recentInvoices = await prisma.invoice.findMany({
      where: { tenantId },
      take: 5,
      orderBy: { issueDate: 'desc' },
      include: {
        customer: {
          select: {
            name: true
          }
        }
      }
    })

    // Get top products by sales
    const topProducts = await prisma.invoiceItem.groupBy({
      by: ['productId'],
      where: {
        invoice: {
          tenantId,
          issueDate: {
            gte: startDate,
            lte: now
          }
        }
      },
      _sum: {
        quantity: true,
        totalPrice: true
      },
      orderBy: {
        _sum: {
          totalPrice: 'desc'
        }
      },
      take: 5
    })

    // Get product details for top products
    const topProductIds = topProducts
      .map(p => p.productId)
      .filter((productId): productId is string => Boolean(productId))
    const topProductDetails = await prisma.product.findMany({
      where: {
        id: { in: topProductIds },
        tenantId
      },
      select: {
        id: true,
        name: true,
        sku: true
      }
    })

    const topProductsWithDetails = topProducts.map(product => {
      const details = topProductDetails.find(d => d.id === product.productId)
      return {
        ...product,
        product: details
      }
    })

    // Get monthly revenue trend (last 6 months)
    const monthlyTrend = []
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date()
      monthDate.setMonth(monthDate.getMonth() - i)
      monthDate.setDate(1)
      const monthEnd = new Date(monthDate)
      monthEnd.setMonth(monthEnd.getMonth() + 1)
      monthEnd.setDate(0)

      const monthRevenue = await prisma.invoice.aggregate({
        where: {
          tenantId,
          issueDate: {
            gte: monthDate,
            lte: monthEnd
          }
        },
        _sum: {
          totalAmount: true
        },
        _count: true
      })

      monthlyTrend.push({
        month: monthDate.toLocaleDateString('it-IT', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue._sum.totalAmount || 0,
        invoices: monthRevenue._count
      })
    }

    const latestMonth = monthlyTrend[monthlyTrend.length - 1]
    const previousMonth = monthlyTrend[monthlyTrend.length - 2]
    const revenueDelta = latestMonth && previousMonth
      ? latestMonth.revenue - previousMonth.revenue
      : 0
    const overdueAmount = overdueInvoices.reduce((sum, invoice) => sum + Number(invoice.balanceAmount || 0), 0)
    const currentHour = now.getHours()
    const greeting = currentHour < 12
      ? 'Buongiorno'
      : currentHour < 18
        ? 'Buon pomeriggio'
        : 'Buonasera'

    const briefingAlerts = [
      {
        id: 'overdue-invoices',
        severity: overdueInvoices.length > 0 ? 'high' : 'info',
        title: overdueInvoices.length > 0 ? 'Incassi da recuperare oggi' : 'Incassi sotto controllo',
        description: overdueInvoices.length > 0
          ? `${overdueInvoices.length} fatture scadute per ${formatCurrency(overdueAmount)}`
          : 'Nessuna fattura scaduta da gestire oggi.',
        actionLabel: 'Apri pagamenti',
        actionHref: '/payments'
      },
      {
        id: 'low-stock',
        severity: lowStockProducts > 0 ? 'medium' : 'info',
        title: lowStockProducts > 0 ? 'Scorte basse da riordinare' : 'Magazzino stabile',
        description: lowStockProducts > 0
          ? `${lowStockProducts} prodotti hanno raggiunto la soglia minima di stock.`
          : 'Nessun prodotto critico nel magazzino principale.',
        actionLabel: 'Apri prodotti',
        actionHref: '/products'
      },
      {
        id: 'ready-repairs',
        severity: readyRepairs.length > 0 ? 'medium' : 'info',
        title: readyRepairs.length > 0 ? 'Riparazioni pronte per il ritiro' : 'Riparazioni in linea',
        description: readyRepairs.length > 0
          ? `${readyRepairs.length} interventi pronti da consegnare o notificare.`
          : 'Nessuna riparazione pronta in attesa di consegna.',
        actionLabel: 'Apri riparazioni',
        actionHref: '/repairs'
      },
      {
        id: 'revenue-trend',
        severity: revenueDelta >= 0 ? 'positive' : 'medium',
        title: revenueDelta >= 0 ? 'Trend mensile in crescita' : 'Trend mensile da monitorare',
        description: latestMonth && previousMonth
          ? `${latestMonth.month} vs ${previousMonth.month}: ${revenueDelta >= 0 ? '+' : ''}${formatCurrency(revenueDelta)}`
          : 'Trend mensile non ancora disponibile.',
        actionLabel: 'Apri report',
        actionHref: '/reports'
      }
    ]

    return NextResponse.json({
      success: true,
      data: {
        revenue: {
          total: revenueStats._sum.totalAmount || 0,
          tax: revenueStats._sum.taxAmount || 0,
          subtotal: revenueStats._sum.subtotal || 0,
          count: revenueStats._count,
          byStatus: revenueByStatus.reduce((acc: any, stat: any) => {
            acc[stat.status] = {
              amount: stat._sum.totalAmount || 0,
              count: stat._count
            }
            return acc
          }, {})
        },
        customers: {
          total: customerStats._count
        },
        products: {
          total: productStats._count,
          totalStock: productStats._sum.stockQuantity || 0,
          lowStock: lowStockProducts
        },
        briefing: {
          greeting,
          headline: `${greeting}, ecco le priorità operative di NEXORA`,
          generatedAt: now.toISOString(),
          alerts: briefingAlerts,
          overdueInvoices,
          lowStockProducts: lowStockProductsList,
          readyRepairs,
          quickActions: [
            { label: 'Nuovo preventivo', href: '/estimates' },
            { label: 'Riordini fornitore', href: '/supplier-orders' },
            { label: 'Controlla riparazioni', href: '/repairs' },
            { label: 'Apri Copilot', href: '/ai-assistant' }
          ]
        },
        recentInvoices,
        topProducts: topProductsWithDetails,
        monthlyTrend
      }
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}

