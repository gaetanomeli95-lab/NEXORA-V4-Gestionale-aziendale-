import { NextRequest } from 'next/server'
import { ApiResponse } from '@/lib/api-enterprise'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

type GroupBy = 'day' | 'week' | 'month' | 'year'

const CANCELLED_STATUSES = ['CANCELLED', 'ANNULLATA']
const PAID_STATUSES = ['PAID', 'PAGATO']

const emptyReportData = {
  overview: {
    totalRevenue: 0,
    totalInvoices: 0,
    averageInvoiceValue: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    totalTax: 0,
    totalDiscount: 0
  },
  salesByPeriod: [],
  topCustomers: [],
  topProducts: [],
  salesByStatus: {},
  customerSegments: {},
  paymentMethods: {},
  monthlyTrends: [],
  growthMetrics: {
    revenueGrowth: 0,
    invoiceGrowth: 0,
    customerGrowth: 0
  },
  customerLifetimeValue: {
    totalCustomers: 0,
    avgLifetimeValue: 0,
    avgAnnualValue: 0,
    topCustomers: []
  }
}

const toNumber = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const startOfDay = (date: Date) => {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

const endOfDay = (date: Date) => {
  const next = new Date(date)
  next.setHours(23, 59, 59, 999)
  return next
}

const startOfWeek = (date: Date) => {
  const next = startOfDay(date)
  const day = next.getDay()
  const delta = day === 0 ? -6 : 1 - day
  next.setDate(next.getDate() + delta)
  return next
}

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)
const startOfQuarter = (date: Date) => new Date(date.getFullYear(), Math.floor(date.getMonth() / 3) * 3, 1)
const startOfYear = (date: Date) => new Date(date.getFullYear(), 0, 1)

const addDays = (date: Date, amount: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

const addMonths = (date: Date, amount: number) => {
  const next = new Date(date)
  next.setMonth(next.getMonth() + amount)
  return next
}

const addYears = (date: Date, amount: number) => {
  const next = new Date(date)
  next.setFullYear(next.getFullYear() + amount)
  return next
}

const formatDayLabel = (date: Date) => new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit' }).format(date)
const formatMonthLabel = (date: Date) => new Intl.DateTimeFormat('it-IT', { month: 'short', year: 'numeric' }).format(date)

const getIsoWeek = (date: Date) => {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNumber = target.getUTCDay() || 7
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber)
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1))
  return Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}

const growthPercentage = (current: number, previous: number) => {
  if (previous === 0) {
    return current === 0 ? 0 : 100
  }

  return ((current - previous) / previous) * 100
}

function resolveRange(request: NextRequest): { startDate: Date; endDate: Date; groupBy: GroupBy } {
  const { searchParams } = new URL(request.url)
  const period = searchParams.get('period') || 'month'
  const groupByParam = searchParams.get('groupBy') as GroupBy | null
  const startDateParam = searchParams.get('startDate')
  const endDateParam = searchParams.get('endDate')
  const now = new Date()

  if (startDateParam && endDateParam) {
    return {
      startDate: startOfDay(new Date(startDateParam)),
      endDate: endOfDay(new Date(endDateParam)),
      groupBy: groupByParam || (period === 'custom' ? 'day' : 'month')
    }
  }

  if (period === 'today') {
    return { startDate: startOfDay(now), endDate: endOfDay(now), groupBy: 'day' }
  }

  if (period === 'week') {
    return { startDate: startOfWeek(now), endDate: endOfDay(now), groupBy: 'day' }
  }

  if (period === 'quarter') {
    return { startDate: startOfQuarter(now), endDate: endOfDay(now), groupBy: 'month' }
  }

  if (period === 'year') {
    return { startDate: startOfYear(now), endDate: endOfDay(now), groupBy: 'month' }
  }

  return { startDate: startOfMonth(now), endDate: endOfDay(now), groupBy: groupByParam || 'day' }
}

function resolvePreviousRange(startDate: Date, endDate: Date) {
  const duration = endDate.getTime() - startDate.getTime()
  const previousEnd = new Date(startDate.getTime() - 1)
  const previousStart = new Date(previousEnd.getTime() - duration)

  return {
    previousStart: startOfDay(previousStart),
    previousEnd: endOfDay(previousEnd)
  }
}

function getPeriodKey(date: Date, groupBy: GroupBy) {
  if (groupBy === 'year') {
    return `${date.getFullYear()}`
  }

  if (groupBy === 'month') {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  }

  if (groupBy === 'week') {
    return `${date.getFullYear()}-W${String(getIsoWeek(date)).padStart(2, '0')}`
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getPeriodLabel(date: Date, groupBy: GroupBy) {
  if (groupBy === 'year') {
    return `${date.getFullYear()}`
  }

  if (groupBy === 'month') {
    return formatMonthLabel(date)
  }

  if (groupBy === 'week') {
    return `Sett. ${getIsoWeek(date)}  ${date.getFullYear()}`
  }

  return formatDayLabel(date)
}

function buildBuckets(startDate: Date, endDate: Date, groupBy: GroupBy) {
  const buckets: Array<{ key: string; label: string }> = []
  let cursor = new Date(startDate)

  while (cursor <= endDate) {
    buckets.push({ key: getPeriodKey(cursor, groupBy), label: getPeriodLabel(cursor, groupBy) })

    if (groupBy === 'year') {
      cursor = startOfYear(addYears(cursor, 1))
      continue
    }

    if (groupBy === 'month') {
      cursor = startOfMonth(addMonths(cursor, 1))
      continue
    }

    if (groupBy === 'week') {
      cursor = startOfWeek(addDays(cursor, 7))
      continue
    }

    cursor = startOfDay(addDays(cursor, 1))
  }

  return buckets
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    let tenantId = searchParams.get('tenantId')

    if (!tenantId) {
      const tenant = await prisma.tenant.findFirst({
        orderBy: { createdAt: 'asc' },
        select: { id: true }
      })
      tenantId = tenant?.id || null
    }

    if (!tenantId) {
      return ApiResponse.success(emptyReportData)
    }

    const resolvedTenantId = tenantId
    const { startDate, endDate, groupBy } = resolveRange(request)
    const { previousStart, previousEnd } = resolvePreviousRange(startDate, endDate)

    const invoiceSelect = {
      id: true,
      customerId: true,
      issueDate: true,
      dueDate: true,
      status: true,
      paymentStatus: true,
      totalAmount: true,
      taxAmount: true,
      discountAmount: true,
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true
        }
      },
      items: {
        select: {
          productId: true,
          quantity: true,
          totalPrice: true,
          total: true,
          unitPrice: true,
          product: {
            select: {
              name: true,
              sku: true,
              costPrice: true,
              isActive: true
            }
          }
        }
      }
    } as const

    const [invoices, previousInvoices, paymentGroups, activeCustomersCount] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          tenantId: resolvedTenantId,
          issueDate: { gte: startDate, lte: endDate },
          status: { notIn: CANCELLED_STATUSES }
        },
        select: invoiceSelect,
        orderBy: { issueDate: 'asc' }
      }),
      prisma.invoice.findMany({
        where: {
          tenantId: resolvedTenantId,
          issueDate: { gte: previousStart, lte: previousEnd },
          status: { notIn: CANCELLED_STATUSES }
        },
        select: {
          customerId: true,
          totalAmount: true
        }
      }),
      prisma.payment.groupBy({
        by: ['method'],
        where: {
          tenantId: resolvedTenantId,
          paymentDate: { gte: startDate, lte: endDate },
          status: { not: 'CANCELLED' }
        },
        _count: { _all: true },
        _sum: { amount: true }
      }),
      prisma.customer.count({
        where: { tenantId: resolvedTenantId, isActive: true }
      })
    ])

    const totalRevenue = invoices.reduce((sum, invoice) => sum + toNumber(invoice.totalAmount), 0)
    const totalInvoices = invoices.length
    const averageInvoiceValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0
    const totalTax = invoices.reduce((sum, invoice) => sum + toNumber(invoice.taxAmount), 0)
    const totalDiscount = invoices.reduce((sum, invoice) => sum + toNumber(invoice.discountAmount), 0)
    const paidInvoices = invoices.filter((invoice) => PAID_STATUSES.includes(String(invoice.paymentStatus || '').toUpperCase())).length
    const overdueInvoices = invoices.filter((invoice) => {
      const paymentStatus = String(invoice.paymentStatus || '').toUpperCase()
      return invoice.dueDate < new Date() && !PAID_STATUSES.includes(paymentStatus)
    }).length
    const pendingInvoices = Math.max(0, totalInvoices - paidInvoices - overdueInvoices)

    const salesByStatus = invoices.reduce<Record<string, { count: number; revenue: number }>>((acc, invoice) => {
      const key = String(invoice.status || 'DRAFT')
      if (!acc[key]) {
        acc[key] = { count: 0, revenue: 0 }
      }
      acc[key].count += 1
      acc[key].revenue += toNumber(invoice.totalAmount)
      return acc
    }, {})

    const customerStatsMap = new Map<string, { customerId: string; name: string; email: string; revenue: number; invoices: number }>()
    const productStatsMap = new Map<string, { productId: string; product: { name: string; sku: string }; revenue: number; quantity: number; invoices: number; profit: number }>()
    const distinctCustomerIds = new Set<string>()

    for (const invoice of invoices) {
      if (invoice.customerId && invoice.customer?.isActive !== false) {
        distinctCustomerIds.add(invoice.customerId)
        const currentCustomer = customerStatsMap.get(invoice.customerId) || {
          customerId: invoice.customerId,
          name: invoice.customer?.name || 'Cliente',
          email: invoice.customer?.email || '',
          revenue: 0,
          invoices: 0
        }
        currentCustomer.revenue += toNumber(invoice.totalAmount)
        currentCustomer.invoices += 1
        customerStatsMap.set(invoice.customerId, currentCustomer)
      }

      const seenProducts = new Set<string>()
      for (const item of invoice.items) {
        if (!item.productId || !item.product || item.product.isActive === false) {
          continue
        }

        const quantity = toNumber(item.quantity)
        const revenue = toNumber(item.totalPrice) || toNumber(item.total) || (toNumber(item.unitPrice) * quantity)
        const profit = revenue - (toNumber(item.product.costPrice) * quantity)
        const currentProduct = productStatsMap.get(item.productId) || {
          productId: item.productId,
          product: {
            name: item.product.name,
            sku: item.product.sku || ''
          },
          revenue: 0,
          quantity: 0,
          invoices: 0,
          profit: 0
        }
        currentProduct.revenue += revenue
        currentProduct.quantity += quantity
        currentProduct.profit += profit
        if (!seenProducts.has(item.productId)) {
          currentProduct.invoices += 1
          seenProducts.add(item.productId)
        }
        productStatsMap.set(item.productId, currentProduct)
      }
    }

    const customerStats = Array.from(customerStatsMap.values()).map((customer) => ({
      ...customer,
      avgOrderValue: customer.invoices > 0 ? customer.revenue / customer.invoices : 0
    }))

    const topCustomers = [...customerStats]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8)

    const topProducts = Array.from(productStatsMap.values())
      .map((product) => ({
        ...product,
        profitMargin: product.revenue > 0 ? (product.profit / product.revenue) * 100 : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8)

    const averageCustomerRevenue = customerStats.length > 0
      ? customerStats.reduce((sum, customer) => sum + customer.revenue, 0) / customerStats.length
      : 0

    const customerSegments = customerStats.reduce<Record<string, { count: number; revenue: number; avgOrderValue: number }>>((acc, customer) => {
      const segmentKey = customer.revenue >= Math.max(averageCustomerRevenue * 1.35, 1500)
        ? 'high_value'
        : customer.revenue >= Math.max(averageCustomerRevenue * 0.75, 500) || customer.invoices > 1
          ? 'growth'
          : 'standard'

      if (!acc[segmentKey]) {
        acc[segmentKey] = { count: 0, revenue: 0, avgOrderValue: 0 }
      }

      acc[segmentKey].count += 1
      acc[segmentKey].revenue += customer.revenue
      acc[segmentKey].avgOrderValue += customer.avgOrderValue
      return acc
    }, {})

    Object.values(customerSegments).forEach((segment) => {
      segment.avgOrderValue = segment.count > 0 ? segment.avgOrderValue / segment.count : 0
    })

    const buckets = buildBuckets(startDate, endDate, groupBy)
    const periodMap = new Map(buckets.map((bucket) => [bucket.key, { period: bucket.label, revenue: 0, invoices: 0 }]))
    const monthlyMap = new Map<string, { month: string; revenue: number; invoices: number; customers: Set<string> }>()

    for (const invoice of invoices) {
      const currentDate = new Date(invoice.issueDate)
      const periodKey = getPeriodKey(currentDate, groupBy)
      const periodEntry = periodMap.get(periodKey)
      if (periodEntry) {
        periodEntry.revenue += toNumber(invoice.totalAmount)
        periodEntry.invoices += 1
      }

      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
      const currentMonth = monthlyMap.get(monthKey) || {
        month: formatMonthLabel(currentDate),
        revenue: 0,
        invoices: 0,
        customers: new Set<string>()
      }
      currentMonth.revenue += toNumber(invoice.totalAmount)
      currentMonth.invoices += 1
      if (invoice.customerId && invoice.customer?.isActive !== false) {
        currentMonth.customers.add(invoice.customerId)
      }
      monthlyMap.set(monthKey, currentMonth)
    }

    const salesByPeriod = Array.from(periodMap.values())
    const monthlyTrends = Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, month]) => ({
        month: month.month,
        revenue: month.revenue,
        invoices: month.invoices,
        customers: month.customers.size
      }))

    const paymentMethods = paymentGroups.reduce<Record<string, { count: number; revenue: number }>>((acc, payment) => {
      const currentPayment = payment as { method: string; _count: { _all: number } | number; _sum: { amount: number | null } }
      acc[currentPayment.method] = {
        count: typeof currentPayment._count === 'number' ? currentPayment._count : Number(currentPayment._count?._all ?? 0),
        revenue: toNumber(currentPayment._sum.amount)
      }
      return acc
    }, {})

    const previousRevenue = previousInvoices.reduce((sum, invoice) => sum + toNumber(invoice.totalAmount), 0)
    const previousCustomerIds = new Set(previousInvoices.map((invoice) => invoice.customerId).filter(Boolean))
    const periodDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000) + 1)
    const avgLifetimeValue = activeCustomersCount > 0 ? totalRevenue / activeCustomersCount : 0
    const avgAnnualValue = avgLifetimeValue * (365 / periodDays)

    return ApiResponse.success({
      overview: {
        totalRevenue,
        totalInvoices,
        averageInvoiceValue,
        paidInvoices,
        pendingInvoices,
        overdueInvoices,
        totalTax,
        totalDiscount
      },
      salesByPeriod,
      topCustomers,
      topProducts,
      salesByStatus,
      customerSegments,
      paymentMethods,
      monthlyTrends,
      growthMetrics: {
        revenueGrowth: growthPercentage(totalRevenue, previousRevenue),
        invoiceGrowth: growthPercentage(totalInvoices, previousInvoices.length),
        customerGrowth: growthPercentage(distinctCustomerIds.size, previousCustomerIds.size)
      },
      customerLifetimeValue: {
        totalCustomers: activeCustomersCount,
        avgLifetimeValue,
        avgAnnualValue,
        topCustomers: topCustomers.map((customer) => ({
          customerId: customer.customerId,
          totalRevenue: customer.revenue,
          avgOrderValue: customer.avgOrderValue,
          projectedAnnualValue: customer.revenue * (365 / periodDays)
        }))
      }
    })
  } catch (error) {
    console.error('Error fetching sales reports:', error)
    return ApiResponse.error('Errore durante il caricamento dei report vendite', 500)
  }
}