"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  Filter, 
  Download, 
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingCart,
  Package,
  FileText,
  BarChart3,
  PieChart,
  LineChart,
  RefreshCw,
  Settings,
  Eye,
  Share,
  Printer,
  Mail,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Zap,
  Award,
  Activity
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { PageShell, PageShellLoading } from '@/components/layout/page-shell'

interface ReportData {
  overview: {
    totalRevenue: number
    totalInvoices: number
    averageInvoiceValue: number
    paidInvoices: number
    pendingInvoices: number
    overdueInvoices: number
    totalTax: number
    totalDiscount: number
  }
  salesByPeriod: Array<{
    period: string
    revenue: number
    invoices: number
  }>
  topCustomers: Array<{
    customerId: string
    name: string
    email: string
    revenue: number
    invoices: number
    avgOrderValue: number
  }>
  topProducts: Array<{
    productId: string
    product: {
      name: string
      sku: string
    }
    revenue: number
    quantity: number
    invoices: number
    profit: number
    profitMargin: number
  }>
  salesByStatus: Record<string, { count: number; revenue: number }>
  customerSegments: Record<string, { count: number; revenue: number; avgOrderValue: number }>
  paymentMethods: Record<string, { count: number; revenue: number }>
  monthlyTrends: Array<{
    month: string
    revenue: number
    invoices: number
    customers: number
  }>
  growthMetrics: {
    revenueGrowth: number
    invoiceGrowth: number
    customerGrowth: number
  }
  customerLifetimeValue: {
    totalCustomers: number
    avgLifetimeValue: number
    avgAnnualValue: number
    topCustomers: Array<{
      customerId: string
      totalRevenue: number
      avgOrderValue: number
      projectedAnnualValue: number
    }>
  }
}

interface SystemAnalysisData {
  businessOverview: {
    totalCustomers: number
    totalProducts: number
    totalSuppliers: number
    totalOrders: number
    totalEstimates: number
    totalRepairs: number
    totalInvoices: number
  }
  financialData: {
    invoicesRevenue: number
    cashBookTotal: number
    paymentsReceived: number
    cashBookEntries: number
    warehouseValue: number
    cashFlow: {
      totalMovements: number
      entriesCount: number
      averageTransaction: number
    }
  }
}

export default function ReportsPage() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [systemAnalysis, setSystemAnalysis] = useState<SystemAnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reportType, setReportType] = useState('sales')
  const [showCustomDateRange, setShowCustomDateRange] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    customers: true,
    products: true,
    trends: true
  })

  useEffect(() => {
    fetchReportData()
  }, [selectedPeriod, startDate, endDate])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        period: selectedPeriod,
        ...(startDate && endDate && { startDate, endDate })
      })

      const [salesResponse, systemResponse] = await Promise.all([
        fetch(`/api/reports/sales?${params}`),
        fetch('/api/ai/system-analysis')
      ])

      const [salesResult, systemResult] = await Promise.all([
        salesResponse.json(),
        systemResponse.json()
      ])
      
      if (salesResult.success) {
        setReportData(salesResult.data)
      }

      if (systemResult.success) {
        setSystemAnalysis(systemResult.data)
      }
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('it-IT').format(num)
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const handleExportPdf = () => {
    const params = new URLSearchParams({
      type: reportType,
      period: selectedPeriod
    })

    if (selectedPeriod === 'custom' && startDate && endDate) {
      params.set('startDate', startDate)
      params.set('endDate', endDate)
    }

    window.open(`/api/reports/sales/pdf?${params.toString()}`, '_blank')
  }

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? (
      <ArrowUpRight className="h-4 w-4 text-green-500" />
    ) : (
      <ArrowDownRight className="h-4 w-4 text-red-500" />
    )
  }

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600'
  }

  if (loading) {
    return (
      <PageShell title="Rapporti e Analisi" description="Analisi aziendale e metriche avanzate" icon={BarChart3} theme="analytics">
        <PageShellLoading label="Caricamento rapporti..." theme="analytics" />
      </PageShell>
    )
  }

  if (!reportData) {
    return (
      <PageShell title="Rapporti e Analisi" description="Analisi aziendale e metriche avanzate" icon={BarChart3} theme="analytics">
        <div className="flex min-h-[260px] items-center justify-center">
          <div className="max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <FileText className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-900">Report in inizializzazione</p>
            <p className="text-sm text-gray-600 mt-2">Sto attendendo il dataset operativo della demo. Puoi ricaricare la pagina report o ripristinare i demo data dalle impostazioni.</p>
            <Button variant="outline" onClick={fetchReportData} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Riprova caricamento
            </Button>
          </div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Rapporti e Analisi"
      description="Analisi aziendale e metriche avanzate"
      icon={BarChart3}
      theme="analytics"
      actions={
        <>
          <Button variant="outline" onClick={() => window.location.href = '/analytics'} className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <Activity className="h-4 w-4 mr-2 text-white" />
            Statistiche Avanzate
          </Button>
          <Button variant="outline" onClick={fetchReportData} className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <RefreshCw className="h-4 w-4 mr-2" />
            Aggiorna
          </Button>
          <Button variant="outline" onClick={handleExportPdf} className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <Download className="h-4 w-4 mr-2" />
            Esporta PDF
          </Button>
          <Button variant="outline" className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <Mail className="h-4 w-4 mr-2" />
            Invia Rapporto
          </Button>
        </>
      }
    >
      <div className="space-y-6">

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex gap-4">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Oggi</SelectItem>
                    <SelectItem value="week">Questa settimana</SelectItem>
                    <SelectItem value="month">Questo mese</SelectItem>
                    <SelectItem value="quarter">Questo trimestre</SelectItem>
                    <SelectItem value="year">Quest'anno</SelectItem>
                    <SelectItem value="custom" onClick={() => setShowCustomDateRange(true)}>
                      Personalizzato
                    </SelectItem>
                  </SelectContent>
                </Select>

                {showCustomDateRange && (
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      placeholder="Data inizio"
                    />
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      placeholder="Data fine"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-4 ml-auto">
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Tipo Rapporto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Rapporto Vendite</SelectItem>
                    <SelectItem value="customers">Rapporto Clienti</SelectItem>
                    <SelectItem value="products">Rapporto Prodotti</SelectItem>
                    <SelectItem value="financial">Rapporto Finanziario</SelectItem>
                    <SelectItem value="operations">Rapporto Operazioni</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtri Avanzati
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {systemAnalysis && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Panoramica Sistema Completo
              </CardTitle>
              <CardDescription>Dati aggregati da clienti, prodotti, fornitori, ordini, preventivi, riparazioni, libro cassa e magazzino</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">Clienti</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(systemAnalysis.businessOverview.totalCustomers)}</p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">Prodotti</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(systemAnalysis.businessOverview.totalProducts)}</p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">Fornitori</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(systemAnalysis.businessOverview.totalSuppliers)}</p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">Ordini Cliente</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(systemAnalysis.businessOverview.totalOrders)}</p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">Preventivi</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(systemAnalysis.businessOverview.totalEstimates)}</p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">Riparazioni</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(systemAnalysis.businessOverview.totalRepairs)}</p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">Incassi Registrati</p>
                  <p className="text-2xl font-bold text-green-700 mt-1">{formatCurrency(systemAnalysis.financialData.paymentsReceived)}</p>
                </div>
                <div className="p-4 bg-white rounded-lg border border-gray-200">
                  <p className="text-sm text-gray-600">Saldo Libro Cassa</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">{formatCurrency(systemAnalysis.financialData.cashBookTotal)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                  <p className="text-sm text-emerald-700">Fatturato Fatture</p>
                  <p className="text-xl font-bold text-emerald-900 mt-1">{formatCurrency(systemAnalysis.financialData.invoicesRevenue)}</p>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-sm text-blue-700">Movimenti Cassa</p>
                  <p className="text-xl font-bold text-blue-900 mt-1">{formatNumber(systemAnalysis.financialData.cashFlow.entriesCount)}</p>
                </div>
                <div className="p-4 rounded-lg bg-violet-50 border border-violet-200">
                  <p className="text-sm text-violet-700">Indicatore Magazzino</p>
                  <p className="text-xl font-bold text-violet-900 mt-1">{formatNumber(systemAnalysis.financialData.warehouseValue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Overview Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Panoramica Prestazioni
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection('overview')}
              >
                {expandedSections.overview ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          {expandedSections.overview && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <div className="p-6 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Fatturato Totale</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(reportData.overview.totalRevenue)}</p>
                        <div className="flex items-center mt-2">
                          {getGrowthIcon(reportData.growthMetrics.revenueGrowth)}
                          <span className={`ml-1 text-sm ${getGrowthColor(reportData.growthMetrics.revenueGrowth)}`}>
                            {reportData.growthMetrics.revenueGrowth.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-blue-50">
                        <DollarSign className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="p-6 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Fatture Emesse</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{formatNumber(reportData.overview.totalInvoices)}</p>
                        <div className="flex items-center mt-2">
                          {getGrowthIcon(reportData.growthMetrics.invoiceGrowth)}
                          <span className={`ml-1 text-sm ${getGrowthColor(reportData.growthMetrics.invoiceGrowth)}`}>
                            {reportData.growthMetrics.invoiceGrowth.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg bg-green-50">
                        <FileText className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <div className="p-6 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Media Ordine</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(reportData.overview.averageInvoiceValue)}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Per fattura
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-purple-50">
                        <Target className="h-6 w-6 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  <div className="p-6 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Tasso Pagamento</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {reportData.overview.totalInvoices > 0 
                            ? Math.round((reportData.overview.paidInvoices / reportData.overview.totalInvoices) * 100)
                            : 0}%
                        </p>
                        <p className="text-xs text-orange-500 mt-1">
                          {reportData.overview.overdueInvoices} scadute
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-orange-50">
                        <Activity className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Revenue Trends */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <LineChart className="h-5 w-5 mr-2" />
                Andamento Fatturato
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection('trends')}
              >
                {expandedSections.trends ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          {expandedSections.trends && (
            <CardContent>
              <div className="space-y-4">
                {reportData.salesByPeriod.map((period, index) => (
                  <div key={period.period} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-medium w-24">{period.period}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.min((period.revenue / Math.max(...reportData.salesByPeriod.map(p => p.revenue))) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(period.revenue)}</p>
                      <p className="text-xs text-gray-500">{period.invoices} fatture</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Top Customers */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Migliori Clienti
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection('customers')}
              >
                {expandedSections.customers ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          {expandedSections.customers && (
            <CardContent>
              <div className="space-y-4">
                {reportData.topCustomers.map((customer, index) => (
                  <div key={customer.customerId} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                        <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-gray-500">{customer.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(customer.revenue)}</p>
                      <p className="text-sm text-gray-500">{customer.invoices} fatture</p>
                      <p className="text-xs text-gray-500">Media: {formatCurrency(customer.avgOrderValue)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Migliori Prodotti
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleSection('products')}
              >
                {expandedSections.products ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          {expandedSections.products && (
            <CardContent>
              <div className="space-y-4">
                {reportData.topProducts.map((product, index) => (
                  <div key={product.productId} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full">
                        <span className="text-sm font-bold text-green-600">{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{product.product?.name ?? 'Prodotto eliminato'}</p>
                        <p className="text-sm text-gray-500">{product.product?.sku ?? '-'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(product.revenue)}</p>
                      <p className="text-sm text-gray-500">{product.quantity} unità</p>
                      <p className="text-xs text-green-600">Margine: {product.profitMargin.toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

        {/* Customer Lifetime Value */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 mr-2" />
              Valore Cliente nel Tempo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Clienti Totali</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(reportData.customerLifetimeValue.totalCustomers)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Valore Vita Medio</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(reportData.customerLifetimeValue.avgLifetimeValue)}</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Valore Ann. Medio</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(reportData.customerLifetimeValue.avgAnnualValue)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}

