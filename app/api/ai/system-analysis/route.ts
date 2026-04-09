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

export async function GET(request: NextRequest) {
  try {
    const tenantId = await resolveTenantId(request)

    // COMPREHENSIVE SYSTEM ANALYSIS - AI reads everything
    const [
      invoicesStats,
      customersCount,
      productsCount,
      suppliersCount,
      ordersCount,
      estimatesCount,
      repairsCount,
      warehouseStats,
      paymentsSum,
      expensesSum,
      supplierOrdersSum
    ] = await Promise.all([
      // Invoices data
      prisma.invoice.aggregate({
        where: { tenantId },
        _sum: { totalAmount: true },
        _count: true
      }),
      
      // Customers data
      prisma.customer.count({ where: { tenantId, isActive: true } }),
      
      // Products data
      prisma.product.count({ where: { tenantId, isActive: true } }),
      
      // Suppliers data
      prisma.supplier.count({ where: { tenantId, isActive: true } }),
      
      // Orders data
      prisma.order.count({ where: { tenantId } }),
      
      // Estimates data
      prisma.estimate.count({ where: { tenantId } }),
      
      // Repairs data
      prisma.repair.count({ where: { tenantId } }),
      
      // Warehouse data
      prisma.product.aggregate({
        where: { tenantId },
        _sum: { stockQuantity: true },
        _count: true
      }),
      
      prisma.payment.aggregate({
        where: { tenantId },
        _sum: { amount: true },
        _count: true
      }),

      prisma.expense.aggregate({
        where: { tenantId },
        _sum: { amount: true },
        _count: true
      }),

      prisma.supplierOrder.aggregate({
        where: { tenantId, paymentStatus: 'PAGATO' },
        _sum: { totalAmount: true },
        _count: true
      })
    ])

    const [recentPayments, recentExpenses, recentSupplierOrders] = await Promise.all([
      prisma.payment.findMany({
        where: { tenantId },
        include: {
          customer: { select: { name: true } },
          invoice: { select: { number: true } },
          estimate: { select: { number: true } }
        },
        orderBy: { paymentDate: 'desc' },
        take: 10
      }),
      prisma.expense.findMany({
        where: { tenantId },
        orderBy: { expenseDate: 'desc' },
        take: 10
      }),
      prisma.supplierOrder.findMany({
        where: { tenantId, paymentStatus: 'PAGATO' },
        include: { supplier: { select: { name: true } } },
        orderBy: { updatedAt: 'desc' },
        take: 10
      })
    ])

    // Get recent invoices for analysis
    const recentInvoices = await prisma.invoice.findMany({
      where: { tenantId },
      include: { customer: true },
      orderBy: { issueDate: 'desc' },
      take: 20
    })

    // Calculate comprehensive financial metrics
    const totalRevenue = invoicesStats._sum.totalAmount || 0
    const totalIn = paymentsSum._sum.amount || 0
    const totalOutExpenses = expensesSum._sum.amount || 0
    const totalOutSupplierOrders = supplierOrdersSum._sum.totalAmount || 0
    const cashBookTotal = totalIn - (totalOutExpenses + totalOutSupplierOrders)
    const paymentsTotal = totalIn
    const totalStockValue = warehouseStats._sum?.stockQuantity || 0

    const cashBookDetails = [
      ...recentPayments.map(p => ({
        date: p.paymentDate,
        description: p.invoice?.number
          ? `Fattura ${p.invoice.number}`
          : p.estimate?.number
          ? `Preventivo ${p.estimate.number}`
          : 'Incasso generico',
        amount: p.amount,
      })),
      ...recentExpenses.map(e => ({
        date: e.expenseDate,
        description: e.description || 'Spesa',
        amount: -e.amount,
      })),
      ...recentSupplierOrders.map(so => ({
        date: so.updatedAt,
        description: `Ordine ${so.number}`,
        amount: -(so.totalAmount || 0),
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // AI System Knowledge Base
    const systemKnowledge = {
      // Business Overview
      businessOverview: {
        totalCustomers: customersCount,
        totalProducts: productsCount,
        totalSuppliers: suppliersCount,
        totalOrders: ordersCount,
        totalEstimates: estimatesCount,
        totalRepairs: repairsCount,
        totalInvoices: invoicesStats._count
      },

      // Complete Financial Picture
      financialData: {
        invoicesRevenue: totalRevenue,
        cashBookTotal: cashBookTotal,
        paymentsReceived: paymentsTotal,
        cashBookEntries: cashBookDetails.length,
        warehouseValue: totalStockValue,
        
        // Cash flow analysis
        cashFlow: {
          totalMovements: cashBookDetails.reduce((sum, entry) => sum + (entry.amount || 0), 0),
          entriesCount: cashBookDetails.length,
          averageTransaction: cashBookDetails.length > 0 ? Math.abs(cashBookTotal / cashBookDetails.length) : 0
        }
      },

      // Recent Activity Analysis
      recentActivity: {
        recentInvoices: recentInvoices.map(inv => ({
          number: inv.number,
          customer: inv.customer?.name,
          amount: inv.totalAmount,
          status: inv.status,
          date: inv.issueDate
        })),
        
        cashBookRecent: cashBookDetails.slice(0, 10).map(entry => ({
          date: entry.date,
          description: entry.description,
          amount: entry.amount,
          type: entry.amount > 0 ? 'entrata' : 'uscita'
        }))
      },

      // System Capabilities
      systemCapabilities: {
        modules: [
          'Gestione Clienti',
          'Gestione Fornitori', 
          'Magazzino e Prodotti',
          'Fatturazione Elettronica',
          'Libro Cassa',
          'Ordini Cliente',
          'Preventivi',
          'DDT',
          'Riparazioni',
          'Pagamenti',
          'Report e Analytics'
        ],
        features: [
          'Fatturazione Elettronica con multi-provider',
          'Integrazione completa magazzino',
          'Gestione avanzata clienti',
          'Report personalizzati',
          'Backup e ripristino',
          'Multi-tenant',
          'API REST complete'
        ]
      },

      // Data Sources Available
      dataSources: {
        primary: ['Invoices', 'Customers', 'Products', 'Suppliers'],
        financial: ['Cash Book', 'Payments', 'Expenses'],
        operational: ['Orders', 'Estimates', 'Repairs', 'Warehouse'],
        analytics: ['Reports', 'Statistics', 'Performance Metrics']
      }
    }

    return NextResponse.json({
      success: true,
      data: systemKnowledge,
      message: "AI System Analysis Complete - Full business context acquired"
    })
  } catch (error) {
    console.error('Error in system analysis:', error)
    
    // Return basic structure even if database fails
    return NextResponse.json({
      success: true,
      data: {
        businessOverview: { totalCustomers: 0, totalProducts: 0, totalSuppliers: 0 },
        financialData: { invoicesRevenue: 0, cashBookTotal: 0, paymentsReceived: 0 },
        recentActivity: { recentInvoices: [], cashBookRecent: [] },
        systemCapabilities: {
          modules: ['Gestione Clienti', 'Fatturazione', 'Magazzino', 'Report'],
          features: ['Sistema gestionale completo']
        },
        dataSources: { primary: [], financial: [], operational: [], analytics: [] }
      },
      message: "System analysis completed with limited data"
    })
  }
}
