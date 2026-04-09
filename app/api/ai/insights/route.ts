import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse, authenticate, authorize } from '@/lib/api-enterprise'
import { AIAnalytics } from '@/lib/ai-analytics'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

const aiAnalytics = new AIAnalytics()

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!authorize(user, 'ANALYTICS_ADVANCED')) {
      return ApiResponse.error('Unauthorized', 403)
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month'
    const tenantId = user.tenantId

    // Fetch data for AI analysis
    const [customers, products, orders, invoices, campaigns] = await Promise.all([
      prisma.customer.findMany({
        where: { tenantId },
        include: {
          orders: {
            select: { totalAmount: true, createdAt: true }
          }
        }
      }),
      prisma.product.findMany({
        where: { tenantId },
        include: {
          orderItems: {
            select: { quantity: true, unitPrice: true }
          }
        }
      }),
      prisma.order.findMany({
        where: { tenantId },
        include: {
          items: true,
          customer: true
        }
      }),
      prisma.invoice.findMany({
        where: { tenantId },
        select: {
          totalAmount: true,
          issueDate: true,
          dueDate: true,
          status: true
        }
      }),
      // Mock campaigns data - in production, fetch from campaigns table
      Promise.resolve([
        { name: 'Email Campaign Q1', conversionRate: 0.025, roi: 2.3 },
        { name: 'Social Media Ads', conversionRate: 0.015, roi: 1.8 },
        { name: 'Google Ads', conversionRate: 0.018, roi: 2.1 }
      ])
    ])

    // Prepare data for AI analysis
    const customersData = customers.map(customer => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      totalRevenue: customer.orders.reduce((sum, order) => sum + order.totalAmount, 0),
      avgOrderValue: customer.orders.length > 0 ? customer.orders.reduce((sum, order) => sum + order.totalAmount, 0) / customer.orders.length : 0,
      totalOrders: customer.orders.length,
      lastOrderDate: customer.orders.length > 0 ? customer.orders[customer.orders.length - 1].createdAt.toISOString() : null
    }))

    const productsData = products.map(product => ({
      id: product.id,
      name: product.name,
      unitPrice: product.unitPrice,
      costPrice: product.costPrice || 0,
      stockQuantity: product.stockQuantity,
      minStockLevel: product.minStockLevel || 10,
      totalSold: product.orderItems.reduce((sum, item) => sum + item.quantity, 0)
    }))

    const ordersData = orders.map(order => ({
      id: order.id,
      totalAmount: order.totalAmount,
      createdAt: order.createdAt,
      customer: order.customer
    }))

    const financialData = {
      totalRevenue: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
      netProfit: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0) * 0.2, // Mock calculation
      cashFlow: 2500, // Mock calculation
      totalExpenses: invoices.reduce((sum, inv) => sum + inv.totalAmount, 0) * 0.8 // Mock calculation
    }

    // Generate AI insights
    const insights = await aiAnalytics.generateInsightsReport({
      customers: customersData,
      products: productsData,
      orders: ordersData,
      financials: financialData,
      campaigns
    })

    return ApiResponse.success(insights)
  } catch (error) {
    console.error('Error generating AI insights:', error)
    return ApiResponse.error('Failed to generate AI insights', 500)
  }
}

