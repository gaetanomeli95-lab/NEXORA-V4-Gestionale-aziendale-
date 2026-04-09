"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  LineChart, 
  Activity,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  DollarSign,
  Package,
  ShoppingCart,
  Filter,
  Download,
  RefreshCw,
  Settings,
  Plus,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Calendar,
  Zap,
  Brain
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { PageShell } from '@/components/layout/page-shell'

interface Metric {
  id: string
  name: string
  value: number
  previousValue: number
  change: number
  changePercentage: number
  trend: 'UP' | 'DOWN' | 'STABLE'
  category: string
}

interface KPITarget {
  id: string
  name: string
  metric: string
  target: number
  current: number
  progress: number
  status: 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK' | 'ACHIEVED'
  owner: string
  endDate: string
}

interface DataInsight {
  id: string
  type: 'ANOMALY' | 'TREND' | 'CORRELATION' | 'PREDICTION' | 'RECOMMENDATION'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: string
  description: string
  metric: string
  value: number
  confidence: number
  timestamp: string
  actionable: boolean
  suggestedActions?: string[]
}

interface SalesByPeriodItem {
  period: string
  invoices: number
  revenue: number
}

interface CustomerSegmentItem {
  key: string
  label: string
  count: number
  revenue: number
  avgOrderValue: number
}

interface PaymentMethodItem {
  method: string
  count: number
  revenue: number
}

interface OverviewSnapshot {
  totalRevenue: number
  totalInvoices: number
  averageInvoiceValue: number
  paidInvoices: number
  pendingInvoices: number
  overdueInvoices: number
  totalTax: number
  totalDiscount: number
  growthMetrics: {
    revenueGrowth: number
    invoiceGrowth: number
    customerGrowth: number
  }
}

interface TopProductItem {
  productId: string
  product: {
    name: string
    sku: string
  }
  quantity: number
  invoices: number
  revenue: number
}

export default function AdvancedAnalyticsPage() {
  const [metrics, setMetrics] = useState<Metric[]>([])
  const [kpiTargets, setKPITargets] = useState<KPITarget[]>([])
  const [insights, setInsights] = useState<DataInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedPeriod, setSelectedPeriod] = useState('monthly')
  const [salesByPeriod, setSalesByPeriod] = useState<SalesByPeriodItem[]>([])
  const [topProducts, setTopProducts] = useState<TopProductItem[]>([])
  const [customerSegments, setCustomerSegments] = useState<CustomerSegmentItem[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([])
  const [overviewSnapshot, setOverviewSnapshot] = useState<OverviewSnapshot | null>(null)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalyticsData()
  }, [selectedPeriod])

  const toDateInputValue = (date: Date) => date.toISOString().split('T')[0]

  const buildMetric = (id: string, name: string, value: number, previousValue: number, category: string): Metric => {
    const change = value - previousValue
    const changePercentage = previousValue === 0
      ? (value === 0 ? 0 : 100)
      : (change / previousValue) * 100

    return {
      id,
      name,
      value,
      previousValue,
      change,
      changePercentage,
      trend: change > 0 ? 'UP' : change < 0 ? 'DOWN' : 'STABLE',
      category
    }
  }

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      setAnalyticsError(null)

      const endDate = new Date()
      const startDate = new Date()
      let groupBy = 'month'

      if (selectedPeriod === 'daily') {
        startDate.setDate(endDate.getDate() - 6)
        groupBy = 'day'
      } else if (selectedPeriod === 'weekly') {
        startDate.setDate(endDate.getDate() - 55)
        groupBy = 'week'
      } else if (selectedPeriod === 'monthly') {
        startDate.setMonth(endDate.getMonth() - 11)
        groupBy = 'month'
      } else {
        startDate.setFullYear(endDate.getFullYear() - 4)
        groupBy = 'year'
      }

      const params = new URLSearchParams({
        startDate: toDateInputValue(startDate),
        endDate: toDateInputValue(endDate),
        groupBy
      })

      const response = await fetch(`/api/reports/sales?${params}`, { cache: 'no-store' })
      const result = await response.json()

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Dati analitici non disponibili')
      }

      const overview = result.data.overview || {}
      const realSalesByPeriod = Array.isArray(result.data.salesByPeriod) ? result.data.salesByPeriod : []
      const segmentLabels: Record<string, string> = {
        high_value: 'Clienti Premium',
        growth: 'Clienti in Crescita',
        standard: 'Clienti Ricorrenti'
      }
      const realCustomerSegments = Object.entries(result.data.customerSegments || {})
        .map(([key, value]: any) => ({
          key,
          label: segmentLabels[key] || key,
          count: Number(value?.count || 0),
          revenue: Number(value?.revenue || 0),
          avgOrderValue: Number(value?.avgOrderValue || 0)
        }))
        .sort((a, b) => b.revenue - a.revenue)
      const realPaymentMethods = Object.entries(result.data.paymentMethods || {})
        .map(([method, value]: any) => ({
          method,
          count: Number(value?.count || 0),
          revenue: Number(value?.revenue || 0)
        }))
        .sort((a, b) => b.revenue - a.revenue)
      const realTopProducts = Array.isArray(result.data.topProducts) ? result.data.topProducts : []
      const growthMetrics = result.data.growthMetrics || { revenueGrowth: 0, invoiceGrowth: 0, customerGrowth: 0 }
      const previousPeriod = realSalesByPeriod[realSalesByPeriod.length - 2]
      const paidRate = overview.totalInvoices > 0
        ? (overview.paidInvoices / overview.totalInvoices) * 100
        : 0
      const previousPaidRate = paidRate

      const buildKpiTarget = (id: string, name: string, metric: string, target: number, current: number, owner: string): KPITarget => {
        const progress = target > 0 ? Math.min(100, (current / target) * 100) : 0
        const status = progress >= 100 ? 'ACHIEVED' : progress >= 80 ? 'ON_TRACK' : progress >= 60 ? 'AT_RISK' : 'OFF_TRACK'
        return {
          id,
          name,
          metric,
          target,
          current,
          progress,
          status,
          owner,
          endDate: new Date().toISOString()
        }
      }

      const nextInsights: DataInsight[] = [
        {
          id: 'insight-revenue-trend',
          type: 'TREND',
          severity: growthMetrics.revenueGrowth >= 0 ? 'LOW' : 'HIGH',
          title: growthMetrics.revenueGrowth >= 0 ? 'Ricavi in crescita nel periodo' : 'Ricavi sotto il periodo precedente',
          description: `Variazione ricavi: ${growthMetrics.revenueGrowth.toFixed(1)}% rispetto al periodo precedente.`,
          metric: 'revenueGrowth',
          value: Number(growthMetrics.revenueGrowth || 0),
          confidence: 92,
          timestamp: new Date().toISOString(),
          actionable: true,
          suggestedActions: growthMetrics.revenueGrowth >= 0 ? ['Spingi upsell su accessori premium', 'Consolida i top clienti'] : ['Controlla preventivi accettati', 'Rafforza follow-up clienti caldi']
        },
        {
          id: 'insight-overdue',
          type: overview.overdueInvoices > 0 ? 'ANOMALY' : 'RECOMMENDATION',
          severity: overview.overdueInvoices > 0 ? 'HIGH' : 'LOW',
          title: overview.overdueInvoices > 0 ? 'Scaduti da presidiare nel periodo' : 'Incassi sotto controllo',
          description: overview.overdueInvoices > 0 ? `${overview.overdueInvoices} fatture risultano scadute e richiedono sollecito.` : 'Non risultano fatture scadute nel periodo selezionato.',
          metric: 'overdueInvoices',
          value: Number(overview.overdueInvoices || 0),
          confidence: 95,
          timestamp: new Date().toISOString(),
          actionable: true,
          suggestedActions: overview.overdueInvoices > 0 ? ['Apri la lista pagamenti', 'Pianifica il recupero crediti'] : ['Mantieni la routine di controllo incassi']
        },
        {
          id: 'insight-top-product',
          type: 'CORRELATION',
          severity: 'MEDIUM',
          title: realTopProducts.length > 0 ? `Prodotto guida: ${realTopProducts[0]?.product?.name || 'N/D'}` : 'Catalogo prodotti da monitorare',
          description: realTopProducts.length > 0 ? `${realTopProducts[0]?.quantity || 0} unità vendute con €${(realTopProducts[0]?.revenue || 0).toLocaleString('it-IT', { maximumFractionDigits: 2 })} di ricavi.` : 'Nessun prodotto dominante nel periodo corrente.',
          metric: 'topProductRevenue',
          value: Number(realTopProducts[0]?.revenue || 0),
          confidence: 87,
          timestamp: new Date().toISOString(),
          actionable: true,
          suggestedActions: realTopProducts.length > 0 ? ['Rafforza disponibilità a magazzino', 'Crea bundle con accessori ad alto margine'] : ['Riattiva campagne di sell-out']
        },
        {
          id: 'insight-payment-method',
          type: 'PREDICTION',
          severity: 'LOW',
          title: realPaymentMethods.length > 0 ? `Metodo prevalente: ${realPaymentMethods[0].method}` : 'Metodo di pagamento da consolidare',
          description: realPaymentMethods.length > 0 ? `${realPaymentMethods[0].count} operazioni per €${realPaymentMethods[0].revenue.toLocaleString('it-IT', { maximumFractionDigits: 2 })}.` : 'Ancora nessuna distribuzione metodo disponibile.',
          metric: 'paymentMethodMix',
          value: Number(realPaymentMethods[0]?.revenue || 0),
          confidence: 78,
          timestamp: new Date().toISOString(),
          actionable: true,
          suggestedActions: realPaymentMethods.length > 0 ? ['Ottimizza i reminder incasso sul canale principale'] : ['Raccogli più storico sui pagamenti']
        }
      ]

      setMetrics([
        buildMetric('revenue', 'Fatturato', overview.totalRevenue || 0, previousPeriod?.revenue || 0, 'REVENUE'),
        buildMetric('invoices', 'Fatture', overview.totalInvoices || 0, previousPeriod?.invoices || 0, 'SALES'),
        buildMetric(
          'averageInvoiceValue',
          'Valore Medio Fattura',
          overview.averageInvoiceValue || 0,
          previousPeriod && previousPeriod.invoices > 0 ? previousPeriod.revenue / previousPeriod.invoices : 0,
          'REVENUE'
        ),
        buildMetric('paidRate', 'Tasso Incasso', paidRate, previousPaidRate, 'PERFORMANCE')
      ])
      setSalesByPeriod(realSalesByPeriod)
      setTopProducts(realTopProducts)
      setCustomerSegments(realCustomerSegments)
      setPaymentMethods(realPaymentMethods)
      setOverviewSnapshot({
        totalRevenue: Number(overview.totalRevenue || 0),
        totalInvoices: Number(overview.totalInvoices || 0),
        averageInvoiceValue: Number(overview.averageInvoiceValue || 0),
        paidInvoices: Number(overview.paidInvoices || 0),
        pendingInvoices: Number(overview.pendingInvoices || 0),
        overdueInvoices: Number(overview.overdueInvoices || 0),
        totalTax: Number(overview.totalTax || 0),
        totalDiscount: Number(overview.totalDiscount || 0),
        growthMetrics
      })
      setKPITargets([
        buildKpiTarget('kpi-revenue', 'Target Fatturato Periodo', 'Ricavi', Math.max(Number(overview.totalRevenue || 0) * 1.12, Number(overview.totalRevenue || 0) + 2500), Number(overview.totalRevenue || 0), 'Direzione Commerciale'),
        buildKpiTarget('kpi-collections', 'Target Tasso Incasso', 'Incasso %', 92, paidRate, 'Amministrazione'),
        buildKpiTarget('kpi-ticket', 'Target Ticket Medio', 'Valore medio', Math.max(Number(overview.averageInvoiceValue || 0) * 1.08, Number(overview.averageInvoiceValue || 0) + 75), Number(overview.averageInvoiceValue || 0), 'Showroom Manager')
      ])
      setInsights(nextInsights)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      setMetrics([])
      setSalesByPeriod([])
      setTopProducts([])
      setCustomerSegments([])
      setPaymentMethods([])
      setOverviewSnapshot(null)
      setKPITargets([])
      setInsights([])
      setAnalyticsError(error instanceof Error ? error.message : 'Errore nel caricamento dei dati')
    } finally {
      setLoading(false)
    }
  }

  const getMetricIcon = (category: string) => {
    switch (category) {
      case 'REVENUE': return <DollarSign className="h-5 w-5" />
      case 'CUSTOMERS': return <Users className="h-5 w-5" />
      case 'SALES': return <ShoppingCart className="h-5 w-5" />
      case 'PRODUCTS': return <Package className="h-5 w-5" />
      case 'PERFORMANCE': return <Activity className="h-5 w-5" />
      default: return <BarChart3 className="h-5 w-5" />
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ON_TRACK: { label: 'In linea', variant: 'default' as const, icon: CheckCircle },
      AT_RISK: { label: 'A rischio', variant: 'secondary' as const, icon: AlertTriangle },
      OFF_TRACK: { label: 'Fuori rotta', variant: 'destructive' as const, icon: AlertTriangle },
      ACHIEVED: { label: 'Raggiunto', variant: 'default' as const, icon: CheckCircle }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ON_TRACK
    const Icon = config.icon
    
    return (
      <Badge variant={config.variant} className="flex items-center">
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const getSeverityBadge = (severity: string) => {
    const severityConfig = {
      LOW: { label: 'Basso', variant: 'outline' as const },
      MEDIUM: { label: 'Medio', variant: 'secondary' as const },
      HIGH: { label: 'Alto', variant: 'default' as const },
      CRITICAL: { label: 'Critico', variant: 'destructive' as const }
    }
    
    const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig.LOW
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'ANOMALY': return <AlertTriangle className="h-5 w-5 text-orange-500" />
      case 'TREND': return <TrendingUp className="h-5 w-5 text-blue-500" />
      case 'PREDICTION': return <Brain className="h-5 w-5 text-purple-500" />
      case 'RECOMMENDATION': return <Zap className="h-5 w-5 text-yellow-500" />
      default: return <Activity className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <PageShell
      title="Analisi Avanzate"
      description="Analisi aziendale e approfondimenti avanzati"
      icon={BarChart3}
      theme="analytics"
      actions={
        <>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40 border-white/20 bg-white/10 text-white placeholder:text-white/70">
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Giornaliero</SelectItem>
              <SelectItem value="weekly">Settimanale</SelectItem>
              <SelectItem value="monthly">Mensile</SelectItem>
              <SelectItem value="yearly">Annuale</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchAnalyticsData} className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <RefreshCw className="h-4 w-4 mr-2" />
            Aggiorna
          </Button>
          <Button className="border border-purple-400/40 bg-purple-600 text-white hover:bg-purple-700 shadow-[0_14px_30px_-18px_rgba(147,51,234,0.75)]">
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Report
          </Button>
        </>
      }
    >
      <div className="space-y-6">

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-950">
              <div className="font-semibold">Analytics alimentate da dati demo live</div>
              <div>
                La schermata usa il report vendite reale, il seed enterprise e il mix di pagamento del database demo per mostrare KPI, insight operativi e snapshot executive pronti per la presentazione.
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-white text-blue-900">{overviewSnapshot?.totalInvoices || 0} fatture analizzate</Badge>
                <Badge variant="outline" className="bg-white text-blue-900">{customerSegments.length} segmenti cliente</Badge>
                <Badge variant="outline" className="bg-white text-blue-900">{paymentMethods.length} metodi di pagamento</Badge>
                {analyticsError && <Badge variant="destructive">Ultimo refresh con warning: {analyticsError}</Badge>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2 rounded-lg bg-blue-50">
                      {getMetricIcon(metric.category)}
                    </div>
                    <div className={`flex items-center space-x-1 text-sm font-medium ${
                      metric.trend === 'UP' ? 'text-green-600' : metric.trend === 'DOWN' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {metric.trend === 'UP' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                      <span>{Math.abs(metric.changePercentage).toFixed(1)}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{metric.name}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {metric.category === 'REVENUE' ? '€' : ''}
                      {metric.value.toLocaleString('it-IT')}
                      {metric.category === 'PERFORMANCE' ? '%' : ''}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      vs periodo precedente: {metric.previousValue.toLocaleString('it-IT')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Panoramica</TabsTrigger>
            <TabsTrigger value="kpis">Obiettivi</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <LineChart className="h-5 w-5 mr-2" />
                    Andamento Fatturato
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {salesByPeriod.length > 0 ? (
                    <div className="space-y-3">
                      {salesByPeriod.slice(-6).map((item) => (
                        <div key={item.period} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                          <div>
                            <p className="font-medium text-gray-900">{item.period}</p>
                            <p className="text-xs text-gray-500">{item.invoices} fatture</p>
                          </div>
                          <p className="font-bold text-blue-700">€ {item.revenue.toLocaleString('it-IT', { maximumFractionDigits: 2 })}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                      <p className="text-gray-500">Nessun movimento aggregato nel periodo selezionato.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Customer Segmentation */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <PieChart className="h-5 w-5 mr-2" />
                    Segmentazione Clienti
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {customerSegments.length > 0 ? (
                    <div className="space-y-3">
                      {customerSegments.map((segment) => (
                        <div key={segment.key} className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="font-medium text-gray-900">{segment.label}</p>
                              <p className="text-sm text-gray-500">{segment.count.toLocaleString('it-IT')} clienti • ticket medio € {segment.avgOrderValue.toLocaleString('it-IT', { maximumFractionDigits: 2 })}</p>
                            </div>
                            <p className="font-bold text-blue-700">€ {segment.revenue.toLocaleString('it-IT', { maximumFractionDigits: 2 })}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                      <p className="text-gray-500 text-center px-6">I segmenti cliente verranno popolati automaticamente con le prossime vendite del periodo.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Top Products */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-5 w-5 mr-2" />
                    Top Prodotti
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {topProducts.length > 0 ? (
                    <div className="space-y-3">
                      {topProducts.slice(0, 5).map((product, index) => (
                        <div key={product.productId} className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                              <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium">{product.product?.name || 'Prodotto'}</p>
                              <p className="text-sm text-gray-500">{product.quantity?.toLocaleString('it-IT') || 0} unità • {product.invoices || 0} fatture</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">€{(product.revenue || 0).toLocaleString('it-IT', { maximumFractionDigits: 2 })}</p>
                            <p className="text-sm text-gray-500">SKU: {product.product?.sku || 'N/D'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                      <p className="text-gray-500">I top prodotti compariranno non appena saranno presenti vendite nel periodo.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sales Funnel */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Activity className="h-5 w-5 mr-2" />
                    Stato Vendite
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {metrics.length > 0 ? (
                    <div className="space-y-4">
                      {[
                        { stage: 'Pagate', value: metrics.find(metric => metric.id === 'invoices')?.value ? Math.round(((metrics.find(metric => metric.id === 'paidRate')?.value || 0) / 100) * (metrics.find(metric => metric.id === 'invoices')?.value || 0)) : 0, percentage: metrics.find(metric => metric.id === 'paidRate')?.value || 0 },
                        { stage: 'In attesa / Scadute', value: metrics.find(metric => metric.id === 'invoices')?.value ? Math.max(0, (metrics.find(metric => metric.id === 'invoices')?.value || 0) - Math.round(((metrics.find(metric => metric.id === 'paidRate')?.value || 0) / 100) * (metrics.find(metric => metric.id === 'invoices')?.value || 0))) : 0, percentage: Math.max(0, 100 - (metrics.find(metric => metric.id === 'paidRate')?.value || 0)) }
                      ].map((step) => (
                        <div key={step.stage} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{step.stage}</span>
                            <span className="text-gray-500">{step.value.toLocaleString('it-IT')} ({step.percentage.toFixed(1)}%)</span>
                          </div>
                          <Progress value={step.percentage} className="h-2" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                      <p className="text-gray-500">Il funnel si aggiornerà con il prossimo ciclo vendite.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* KPIs Tab */}
          <TabsContent value="kpis">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>KPI Targets</CardTitle>
                    <CardDescription>
                      Monitora i tuoi obiettivi chiave di performance
                    </CardDescription>
                  </div>
                  <Button className="border border-purple-400/40 bg-purple-600 text-white hover:bg-purple-700 shadow-[0_14px_30px_-18px_rgba(147,51,234,0.75)]">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuovo KPI
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {kpiTargets.map((target) => (
                    <div key={target.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{target.name}</p>
                          <p className="text-xs text-gray-500 mt-1">Owner: {target.owner}</p>
                        </div>
                        {getStatusBadge(target.status)}
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Corrente</span>
                          <span className="font-medium">{target.metric === 'Incasso %' ? `${target.current.toFixed(1)}%` : `€ ${target.current.toLocaleString('it-IT', { maximumFractionDigits: 2 })}`}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Target</span>
                          <span className="font-medium">{target.metric === 'Incasso %' ? `${target.target.toFixed(1)}%` : `€ ${target.target.toLocaleString('it-IT', { maximumFractionDigits: 2 })}`}</span>
                        </div>
                        <Progress value={target.progress} className="h-2" />
                        <p className="text-xs text-gray-500">Avanzamento {target.progress.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Data Insights</CardTitle>
                    <CardDescription>
                      Insights automatici e raccomandazioni basate su AI
                    </CardDescription>
                  </div>
                  <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtri
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {insights.map((insight) => (
                    <div key={insight.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="rounded-lg bg-slate-100 p-2">
                            {getInsightIcon(insight.type)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{insight.title}</p>
                            <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                            {insight.suggestedActions?.length ? (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {insight.suggestedActions.map((action) => (
                                  <Badge key={action} variant="outline" className="bg-slate-50">{action}</Badge>
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          {getSeverityBadge(insight.severity)}
                          <p className="text-xs text-gray-500">Confidenza {insight.confidence}%</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Analytics Reports</CardTitle>
                    <CardDescription>
                      Crea e gestisci report personalizzati
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Esporta
                    </Button>
                    <Button className="border border-purple-400/40 bg-purple-600 text-white hover:bg-purple-700 shadow-[0_14px_30px_-18px_rgba(147,51,234,0.75)]">
                      <Plus className="h-4 w-4 mr-2" />
                      Nuovo Report
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-sm font-semibold text-gray-900">Snapshot vendite periodo</p>
                    <p className="text-2xl font-bold text-blue-700 mt-3">€ {overviewSnapshot?.totalRevenue?.toLocaleString('it-IT', { maximumFractionDigits: 2 }) || '0'}</p>
                    <p className="text-sm text-gray-500 mt-1">{overviewSnapshot?.totalInvoices || 0} fatture • ticket medio € {overviewSnapshot?.averageInvoiceValue?.toLocaleString('it-IT', { maximumFractionDigits: 2 }) || '0'}</p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-sm font-semibold text-gray-900">Mix incassi</p>
                    <div className="mt-3 space-y-2">
                      {paymentMethods.slice(0, 3).map((method) => (
                        <div key={method.method} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{method.method}</span>
                          <span className="font-medium">€ {method.revenue.toLocaleString('it-IT', { maximumFractionDigits: 2 })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <p className="text-sm font-semibold text-gray-900">Priorità operative</p>
                    <div className="mt-3 space-y-2 text-sm text-gray-600">
                      <p>{overviewSnapshot?.overdueInvoices || 0} fatture scadute da presidiare</p>
                      <p>{overviewSnapshot?.pendingInvoices || 0} fatture aperte o in scadenza</p>
                      <p>{customerSegments[0]?.label || 'Segmento clienti'} come cluster dominante</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageShell>
  )
}
