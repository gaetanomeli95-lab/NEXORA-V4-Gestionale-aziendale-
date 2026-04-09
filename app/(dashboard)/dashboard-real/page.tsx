"use client"

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  DollarSign, 
  Users, 
  Package,
  FileText,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Eye,
  Plus,
  Search,
  Wrench,
  Sparkles,
  CreditCard,
  ArrowRight
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDateTime } from '@/lib/utils'
import { PageShell, PageShellLoading } from '@/components/layout/page-shell'
import { useDesktopRuntime } from '@/components/desktop/desktop-runtime-provider'

const SETTINGS_STORAGE_KEY = 'softshop-v4-settings'

interface DashboardStats {
  revenue: {
    total: number
    tax: number
    subtotal: number
    count: number
    byStatus: Record<string, { amount: number; count: number }>
  }
  customers: {
    total: number
  }
  products: {
    total: number
    totalStock: number
    lowStock: number
  }
  briefing: {
    greeting: string
    headline: string
    generatedAt: string
    alerts: Array<{
      id: string
      severity: 'high' | 'medium' | 'positive' | 'info'
      title: string
      description: string
      actionLabel: string
      actionHref: string
    }>
    overdueInvoices: Array<{
      id: string
      number: string
      dueDate: string
      balanceAmount: number
      customer: { name: string }
    }>
    lowStockProducts: Array<{
      id: string
      name: string
      stockQuantity: number
      minStockLevel: number
      reorderQty: number | null
      supplier: { id: string; name: string } | null
    }>
    readyRepairs: Array<{
      id: string
      number: string
      model: string | null
      deliveryDate: string | null
      customer: { name: string } | null
    }>
    quickActions: Array<{
      label: string
      href: string
    }>
  }
  recentInvoices: Array<{
    id: string
    number: string
    totalAmount: number
    status: string
    issueDate: string
    customer: { name: string }
  }>
  topProducts: Array<{
    productId: string
    product: { name: string; sku: string }
    _sum: { quantity: number; totalPrice: number }
  }>
  monthlyTrend: Array<{
    month: string
    revenue: number
    invoices: number
  }>
}

export default function DashboardReal() {
  const { buildFlavor } = useDesktopRuntime()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [searchQuery, setSearchQuery] = useState('')
  const [demoModeEnabled, setDemoModeEnabled] = useState(false)

  useEffect(() => {
    fetchStats()
  }, [selectedPeriod])

  useEffect(() => {
    if (buildFlavor === 'full') {
      setDemoModeEnabled(false)
      return
    }

    try {
      const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      setDemoModeEnabled(Boolean(parsed?.demo?.enabled))
    } catch {
      setDemoModeEnabled(false)
    }
  }, [buildFlavor])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/dashboard/stats?period=${selectedPeriod}`)
      const result = await response.json()
      
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { label: 'Bozza', variant: 'secondary' as const },
      SENT: { label: 'Inviata', variant: 'outline' as const },
      PAID: { label: 'Pagata', variant: 'default' as const },
      OVERDUE: { label: 'Scaduta', variant: 'destructive' as const },
      CANCELLED: { label: 'Annullata', variant: 'outline' as const },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return formatDateTime(dateString)
  }

  const getPeriodLabel = (period: string) => {
    const labels: Record<string, string> = {
      today: 'oggi',
      week: 'settimana',
      month: 'mese',
      year: 'anno'
    }

    return labels[period] || period
  }

  const getAlertBadge = (severity: DashboardStats['briefing']['alerts'][number]['severity']) => {
    const config = {
      high: 'bg-red-100 text-red-700 border-red-200',
      medium: 'bg-orange-100 text-orange-700 border-orange-200',
      positive: 'bg-green-100 text-green-700 border-green-200',
      info: 'bg-blue-100 text-blue-700 border-blue-200'
    }

    const labels = {
      high: 'Alta',
      medium: 'Media',
      positive: 'Positiva',
      info: 'Info'
    }

    return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${config[severity]}`}>{labels[severity]}</span>
  }

  const kpiData = [
    {
      title: 'Fatturato',
      value: formatCurrency(stats?.revenue.total || 0),
      change: 12.5,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: 'up',
      subtitle: `${stats?.revenue.count || 0} fatture`
    },
    {
      title: 'Clienti',
      value: stats?.customers.total.toString() || '0',
      change: 8.1,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: 'up',
      subtitle: 'Attivi'
    },
    {
      title: 'Prodotti',
      value: stats?.products.total.toString() || '0',
      change: -2.4,
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: 'down',
      subtitle: `${stats?.products.lowStock || 0} in esaurimento`
    },
    {
      title: 'Magazzino',
      value: stats?.products.totalStock.toString() || '0',
      change: 5.3,
      icon: Package,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      trend: 'up',
      subtitle: 'Unità totali'
    }
  ]

  if (loading) {
    return (
      <PageShell title="Cruscotto" description="Dati in tempo reale dal database" icon={BarChart3} theme="analytics">
        <PageShellLoading label="Caricamento cruscotto..." theme="analytics" />
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Cruscotto"
      description="Dati in tempo reale dal database"
      icon={BarChart3}
      theme="analytics"
      actions={
        <>
          <div className="flex items-center space-x-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 backdrop-blur-sm">
            <Search className="h-4 w-4 text-white/80" />
            <Input
              placeholder="Cerca..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 border-0 bg-transparent text-white placeholder:text-white/70 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          <Button onClick={fetchStats} variant="outline" size="sm" className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <RefreshCw className="h-4 w-4 mr-2" />
            Aggiorna
          </Button>
          <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <TabsList className="border border-white/20 bg-white/10 text-white backdrop-blur-sm">
              <TabsTrigger value="today">Oggi</TabsTrigger>
              <TabsTrigger value="week">Settimana</TabsTrigger>
              <TabsTrigger value="month">Mese</TabsTrigger>
              <TabsTrigger value="year">Anno</TabsTrigger>
            </TabsList>
          </Tabs>
        </>
      }
    >
      <div className="space-y-6">

        {stats?.briefing && (
          <Card className="relative overflow-hidden border border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 text-white shadow-[0_18px_60px_rgba(15,23,42,0.18)]">
            <Sparkles className="absolute right-6 top-1/2 h-24 w-24 -translate-y-1/2 text-white/10" />
            <CardContent className="p-5 md:p-6">
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(260px,0.9fr)] xl:items-start">
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                        <Sparkles className="h-4 w-4" />
                        Priorità operative
                      </div>
                      <h2 className="mt-1 text-xl font-bold tracking-tight text-white md:text-2xl">{stats.briefing.headline}</h2>
                      <p className="mt-1 text-sm text-slate-300">
                        Aggiornato alle {new Date(stats.briefing.generatedAt).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })} con dati reali del sistema.
                      </p>
                    </div>
                    <Badge variant="outline" className="w-fit border-white/20 bg-white/10 text-white">
                      {selectedPeriod === 'today' ? 'Focus oggi' : `Periodo: ${getPeriodLabel(selectedPeriod)}`}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {stats.briefing.alerts.map((alert) => (
                      <div key={alert.id} className="glass-panel-dark rounded-2xl p-4">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-sm font-semibold text-white">{alert.title}</h3>
                          {getAlertBadge(alert.severity)}
                        </div>
                        <p className="mt-2 text-sm text-slate-300">{alert.description}</p>
                        <Button asChild size="sm" variant="secondary" className="mt-3 bg-white text-slate-900 hover:bg-slate-100">
                          <Link href={alert.actionHref}>{alert.actionLabel}</Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="glass-panel-dark rounded-2xl p-4">
                    <div className="text-sm font-semibold text-slate-200">Azioni rapide</div>
                    <div className="mt-3 space-y-2">
                      {stats.briefing.quickActions.map((action) => (
                        <Button key={action.href} asChild variant="ghost" className="h-10 w-full justify-between text-white hover:bg-white/10 hover:text-white">
                          <Link href={action.href}>
                            {action.label}
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="glass-panel-dark rounded-2xl p-4">
                    <div className="text-sm font-semibold text-slate-200">Focus operativo</div>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Fatture scadute</span>
                        <span className="metric-value font-semibold text-white">{stats.briefing.overdueInvoices.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Scorte da riordinare</span>
                        <span className="metric-value font-semibold text-white">{stats.briefing.lowStockProducts.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300">Riparazioni pronte</span>
                        <span className="metric-value font-semibold text-white">{stats.briefing.readyRepairs.length}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpiData.map((kpi, index) => (
            <motion.div
              key={kpi.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="premium-interactive">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                      <p className="metric-value text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{kpi.subtitle}</p>
                      <div className="flex items-center mt-2">
                        {kpi.trend === 'up' ? (
                          <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                        )}
                        <span className={`text-sm ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                          {kpi.trend === 'up' ? '+' : ''}{kpi.change}%
                        </span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg ${kpi.bgColor}`}>
                      <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {demoModeEnabled && (
          <Card className="premium-interactive border border-fuchsia-200 bg-gradient-to-r from-fuchsia-50 to-purple-50 shadow-[0_10px_30px_rgba(88,28,135,0.08)]">
            <CardContent className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-fuchsia-700">
                    <Sparkles className="h-4 w-4" />
                    Ambiente demo attivo
                  </div>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">Percorso demo consigliato</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Segui questo flusso per mostrare il valore enterprise di NEXORA in modo lineare durante presentazioni e video walkthrough.
                  </p>
                </div>
                <Badge variant="outline" className="border-fuchsia-300 bg-white text-fuchsia-700">
                  Percorso guidato
                </Badge>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {[
                  { title: '1. Priorità operative', description: 'Apri priorità operative e KPI reali', href: '/dashboard-real' },
                  { title: '2. Preventivi & Fatture', description: 'Mostra il workflow commerciale end-to-end', href: '/estimates' },
                  { title: '3. Magazzino & Riordino', description: 'Evidenzia scorte basse e ordini fornitore', href: '/products' },
                  { title: '4. NEXORA Copilot', description: 'Chiudi la demo con l’assistente enterprise', href: '/ai-assistant' }
                ].map((step) => (
                  <Link key={step.title} href={step.href} className="premium-interactive rounded-xl border border-fuchsia-100 bg-white p-4 hover:border-fuchsia-300">
                    <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{step.description}</p>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <Card className="premium-interactive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-red-500" />
                Incassi da recuperare
              </CardTitle>
              <CardDescription>Fatture scadute con saldo residuo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.briefing.overdueInvoices.length ? stats.briefing.overdueInvoices.map((invoice) => (
                  <div key={invoice.id} className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_6px_24px_rgba(15,23,42,0.04)]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900">{invoice.number}</p>
                        <p className="text-sm text-gray-600">{invoice.customer.name}</p>
                        <p className="text-xs text-gray-500">Scadenza {formatDate(invoice.dueDate)}</p>
                      </div>
                      <p className="metric-value font-semibold text-red-600">{formatCurrency(invoice.balanceAmount)}</p>
                    </div>
                  </div>
                )) : <p className="text-sm text-gray-500">Nessuna fattura scaduta da sollecitare.</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="premium-interactive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                Scorte basse prioritarie
              </CardTitle>
              <CardDescription>Prodotti da trasformare in ordine fornitore</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.briefing.lowStockProducts.length ? stats.briefing.lowStockProducts.map((product) => (
                  <div key={product.id} className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_6px_24px_rgba(15,23,42,0.04)]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">{product.supplier?.name || 'Fornitore non assegnato'}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="metric-value font-semibold text-orange-600">{product.stockQuantity} / min {product.minStockLevel}</p>
                        <p className="text-gray-500">Riordino: {product.reorderQty || Math.max(product.minStockLevel, 1)}</p>
                      </div>
                    </div>
                  </div>
                )) : <p className="text-sm text-gray-500">Nessun prodotto sotto soglia minima.</p>}
              </div>
            </CardContent>
          </Card>

          <Card className="premium-interactive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-blue-500" />
                Riparazioni pronte
              </CardTitle>
              <CardDescription>Interventi pronti per ritiro o chiusura</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.briefing.readyRepairs.length ? stats.briefing.readyRepairs.map((repair) => (
                  <div key={repair.id} className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-[0_6px_24px_rgba(15,23,42,0.04)]">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-gray-900">{repair.number}</p>
                        <p className="text-sm text-gray-600">{repair.customer?.name || 'Cliente non associato'}</p>
                        <p className="text-xs text-gray-500">{repair.model || 'Modello non specificato'}</p>
                      </div>
                      <p className="metric-value text-sm font-semibold text-blue-600">{repair.deliveryDate ? formatDate(repair.deliveryDate) : 'Da pianificare'}</p>
                    </div>
                  </div>
                )) : <p className="text-sm text-gray-500">Nessuna riparazione pronta in questo momento.</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue by Status */}
          <Card>
            <CardHeader>
              <CardTitle>Fatturato per Stato</CardTitle>
              <CardDescription>Distribuzione del fatturato</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(stats?.revenue.byStatus || {}).map(([status, data]) => (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(status)}
                      <span className="text-sm text-gray-600">{data.count} fatture</span>
                    </div>
                    <span className="font-medium">{formatCurrency(data.amount)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Invoices */}
          <Card>
            <CardHeader>
              <CardTitle>Fatture Recenti</CardTitle>
              <CardDescription>Ultime fatture emesse</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{invoice.number}</p>
                      <p className="text-sm text-gray-600">{invoice.customer.name}</p>
                      <p className="text-xs text-gray-500">{formatDate(invoice.issueDate)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(invoice.totalAmount)}</p>
                      {getStatusBadge(invoice.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle>Prodotti Più Venduti</CardTitle>
              <CardDescription>Prodotti più venduti</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.topProducts.map((item, index) => (
                  <div key={item.productId} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.product.name}</p>
                      <p className="text-sm text-gray-600">{item.product.sku}</p>
                      <p className="text-xs text-gray-500">{item._sum.quantity} unità</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(item._sum.totalPrice)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Andamento Mensile</CardTitle>
            <CardDescription>Evoluzione fatturato ultimi 6 mesi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.monthlyTrend.map((month, index) => (
                <div key={month.month} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="text-sm font-medium text-gray-900 w-20">{month.month}</span>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min((month.revenue / (stats?.revenue.total || 1)) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(month.revenue)}</p>
                    <p className="text-xs text-gray-500">{month.invoices} fatture</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageShell>
  )
}

