"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Package, 
  ShoppingCart,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Zap,
  AlertCircle,
  Download,
  RefreshCw,
  Filter,
  Calendar,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Eye,
  Settings,
  Bell,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Info,
  CheckCircle,
  Clock,
  Timer,
  Flame,
  Rocket,
  Brain,
  Sparkles
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Treemap,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts'

// Mock real-time data
const generateRealTimeData = () => {
  const now = new Date()
  const data = []
  
  for (let i = 23; i >= 0; i--) {
    const hour = new Date(now.getTime() - i * 60 * 60 * 1000)
    data.push({
      time: hour.getHours() + ':00',
      revenue: Math.floor(Math.random() * 5000) + 2000,
      orders: Math.floor(Math.random() * 50) + 20,
      visitors: Math.floor(Math.random() * 200) + 100,
      conversion: (Math.random() * 5 + 2).toFixed(1)
    })
  }
  
  return data
}

const generateSalesFunnel = () => [
  { name: 'Visitatori', value: 10000, conversion: 100 },
  { name: 'Prodotti Visti', value: 4500, conversion: 45 },
  { name: 'Carrello', value: 1800, conversion: 18 },
  { name: 'Checkout', value: 900, conversion: 9 },
  { name: 'Acquisti', value: 450, conversion: 4.5 }
]

const generateCategoryData = () => [
  { name: 'Elettronica', value: 45000, growth: 12.5, color: '#3b82f6' },
  { name: 'Abbigliamento', value: 32000, growth: -3.2, color: '#10b981' },
  { name: 'Casa & Giardino', value: 28000, growth: 8.7, color: '#f59e0b' },
  { name: 'Sport', value: 15000, growth: 15.3, color: '#ef4444' },
  { name: 'Libri', value: 12000, growth: -1.5, color: '#8b5cf6' },
  { name: 'Altro', value: 8000, growth: 5.2, color: '#6b7280' }
]

const generateDeviceData = () => [
  { name: 'Desktop', value: 45, users: 2250, color: '#3b82f6' },
  { name: 'Mobile', value: 35, users: 1750, color: '#10b981' },
  { name: 'Tablet', value: 20, users: 1000, color: '#f59e0b' }
]

const generatePerformanceMetrics = () => [
  { subject: 'Vendite', A: 85, fullMark: 100 },
  { subject: 'Marketing', A: 72, fullMark: 100 },
  { subject: 'Customer Service', A: 90, fullMark: 100 },
  { subject: 'Operations', A: 78, fullMark: 100 },
  { subject: 'Finance', A: 88, fullMark: 100 },
  { subject: 'Innovation', A: 65, fullMark: 100 }
]

const generateTopProducts = () => [
  { name: 'MacBook Pro 14"', revenue: 125000, units: 50, growth: 15.2 },
  { name: 'iPhone 15 Pro', revenue: 98000, units: 82, growth: 8.7 },
  { name: 'iPad Air', revenue: 76000, units: 38, growth: -2.3 },
  { name: 'AirPods Pro', revenue: 62000, units: 222, growth: 22.1 },
  { name: 'Apple Watch', revenue: 54000, units: 108, growth: 12.8 }
]

const generateAlerts = () => [
  { 
    id: 1, 
    type: 'warning', 
    title: 'Scorte basse', 
    description: 'iPhone 15 Pro sotto soglia minima (5 unità)',
    time: '2 min fa',
    action: 'Riordina ora'
  },
  { 
    id: 2, 
    type: 'success', 
    title: 'Obiettivo raggiunto', 
    description: 'Fatturato giornaliero superato del 15%',
    time: '15 min fa',
    action: 'Vedi dettagli'
  },
  { 
    id: 3, 
    type: 'info', 
    title: 'Nuovo cliente VIP', 
    description: 'Tech Solutions Srl registrato come cliente premium',
    time: '1 ora fa',
    action: 'Contatta'
  },
  { 
    id: 4, 
    type: 'error', 
    title: 'Pagamento fallito', 
    description: 'Transazione #12345 non andata a buon fine',
    time: '2 ore fa',
    action: 'Ricontatta'
  }
]

export default function AnalyticsDashboard() {
  const [realTimeData, setRealTimeData] = useState(generateRealTimeData())
  const [selectedPeriod, setSelectedPeriod] = useState('today')
  const [selectedMetric, setSelectedMetric] = useState('revenue')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [alerts, setAlerts] = useState(generateAlerts())
  const [expandedCard, setExpandedCard] = useState<string | null>(null)

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeData(prev => {
        const newData = [...prev.slice(1)]
        const now = new Date()
        newData.push({
          time: now.getHours() + ':00',
          revenue: Math.floor(Math.random() * 5000) + 2000,
          orders: Math.floor(Math.random() * 50) + 20,
          visitors: Math.floor(Math.random() * 200) + 100,
          conversion: (Math.random() * 5 + 2).toFixed(1)
        })
        return newData
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setRealTimeData(generateRealTimeData())
    setIsRefreshing(false)
  }, [])

  const getMetricIcon = (metric: string) => {
    const icons = {
      revenue: DollarSign,
      orders: ShoppingCart,
      users: Users,
      products: Package,
      conversion: Target,
      growth: TrendingUp
    }
    return icons[metric as keyof typeof icons] || TrendingUp
  }

  const getAlertIcon = (type: string) => {
    const icons = {
      success: CheckCircle,
      warning: AlertCircle,
      error: AlertCircle,
      info: Info
    }
    const Icon = icons[type as keyof typeof icons] || Info
    return <Icon className="h-4 w-4" />
  }

  const getAlertColor = (type: string) => {
    const colors = {
      success: 'text-green-600 bg-green-50 border-green-200',
      warning: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      error: 'text-red-600 bg-red-50 border-red-200',
      info: 'text-blue-600 bg-blue-50 border-blue-200'
    }
    return colors[type as keyof typeof colors] || colors.info
  }

  const realTimeMetrics = [
    { 
      title: 'Fatturato Real-time', 
      value: '€12.450', 
      change: 15.3, 
      icon: DollarSign, 
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: 'up',
      sparkline: realTimeData.map(d => d.revenue)
    },
    { 
      title: 'Ordini in corso', 
      value: '234', 
      change: 8.7, 
      icon: ShoppingCart, 
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: 'up',
      sparkline: realTimeData.map(d => d.orders)
    },
    { 
      title: 'Visitatori Attivi', 
      value: '1.234', 
      change: -2.1, 
      icon: Users, 
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: 'down',
      sparkline: realTimeData.map(d => d.visitors)
    },
    { 
      title: 'Tasso Conversione', 
      value: '3.2%', 
      change: 0.5, 
      icon: Target, 
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      trend: 'up',
      sparkline: realTimeData.map(d => parseFloat(d.conversion))
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Brain className="h-8 w-8 mr-3 text-blue-600" />
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 mt-2">Monitoraggio real-time con intelligenza artificiale</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Oggi</SelectItem>
                <SelectItem value="week">Questa settimana</SelectItem>
                <SelectItem value="month">Questo mese</SelectItem>
                <SelectItem value="year">Quest'anno</SelectItem>
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Aggiorna
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Esporta
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Esporta Report
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="h-4 w-4 mr-2" />
                  Scarica Dati
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Real-time Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {realTimeMetrics.map((metric, index) => (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card className={`hover:shadow-lg transition-all cursor-pointer ${
                expandedCard === metric.title ? 'ring-2 ring-blue-500' : ''
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                      <metric.icon className={`h-5 w-5 ${metric.color}`} />
                    </div>
                    <div className="flex items-center">
                      {metric.trend === 'up' ? (
                        <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                      ) : metric.trend === 'down' ? (
                        <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                      ) : (
                        <Minus className="h-4 w-4 text-gray-500 mr-1" />
                      )}
                      <span className={`text-sm font-medium ${
                        metric.trend === 'up' ? 'text-green-600' : 
                        metric.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {Math.abs(metric.change)}%
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                    <p className="text-sm text-gray-600">{metric.title}</p>
                  </div>

                  {/* Mini sparkline */}
                  <div className="mt-4 h-8">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={metric.sparkline.map((value, i) => ({ value }))}>
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke={metric.trend === 'up' ? '#10b981' : metric.trend === 'down' ? '#ef4444' : '#6b7280'}
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Real-time Chart */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      <Activity className="h-5 w-5 mr-2 text-blue-600" />
                      Andamento Real-time
                    </CardTitle>
                    <CardDescription>Dati aggiornati ogni 5 secondi</CardDescription>
                  </div>
                  <Tabs value={selectedMetric} onValueChange={setSelectedMetric}>
                    <TabsList>
                      <TabsTrigger value="revenue">Fatturato</TabsTrigger>
                      <TabsTrigger value="orders">Ordini</TabsTrigger>
                      <TabsTrigger value="visitors">Visitatori</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={realTimeData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey={selectedMetric} 
                      stroke={
                        selectedMetric === 'revenue' ? '#3b82f6' : 
                        selectedMetric === 'orders' ? '#10b981' : '#f59e0b'
                      }
                      fillOpacity={1} 
                      fill={`url(#color${selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)})`}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Live Alerts */}
          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <Bell className="h-5 w-5 mr-2 text-orange-600" />
                  Alert Real-time
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <AnimatePresence>
                  {alerts.map((alert, index) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-3 rounded-lg border ${getAlertColor(alert.type)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-2">
                          {getAlertIcon(alert.type)}
                          <div className="flex-1">
                            <p className="font-medium text-sm">{alert.title}</p>
                            <p className="text-xs mt-1 opacity-80">{alert.description}</p>
                            <p className="text-xs mt-2 opacity-60">{alert.time}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-xs">
                          {alert.action}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">AI Insights</h3>
                    <p className="text-sm text-gray-600">Analisi predittiva</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-lg border border-purple-200">
                    <p className="text-sm font-medium text-purple-900">Previsione Vendite</p>
                    <p className="text-xs text-purple-700">+23% previsto per le prossime 2 ore</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-900">Opportunità</p>
                    <p className="text-xs text-blue-700">15 clienti pronti all'acquisto</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Advanced Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Sales Funnel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-green-600" />
                Sales Funnel
              </CardTitle>
              <CardDescription>Analisi del percorso di conversione</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <FunnelChart>
                  <Funnel
                    dataKey="value"
                    data={generateSalesFunnel()}
                    isAnimationActive
                  >
                    <LabelList position="center" fill="#fff" />
                    <Tooltip />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Performance Radar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-purple-600" />
                Performance Aree
              </CardTitle>
              <CardDescription>KPI per dipartimento</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={generatePerformanceMetrics()}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Performance" dataKey="A" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Category and Device Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="h-5 w-5 mr-2 text-blue-600" />
              </CardTitle>
              <CardDescription>Vendite per categoria</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPieChart>
                  <Pie
                    data={generateCategoryData()}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {generateCategoryData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {generateCategoryData().slice(0, 3).map((category) => (
                  <div key={category.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: category.color }} />
                      <span>{category.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">€{category.value.toLocaleString()}</span>
                      {category.growth > 0 ? (
                        <ArrowUpRight className="h-3 w-3 text-green-500" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Device Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Smartphone className="h-5 w-5 mr-2 text-green-600" />
              </CardTitle>
              <CardDescription>Traffic per dispositivo</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPieChart>
                  <Pie
                    data={generateDeviceData()}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                  >
                    {generateDeviceData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {generateDeviceData().map((device) => (
                  <div key={device.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      {device.name === 'Desktop' && <Monitor className="h-4 w-4 text-gray-500" />}
                      {device.name === 'Mobile' && <Smartphone className="h-4 w-4 text-gray-500" />}
                      {device.name === 'Tablet' && <Tablet className="h-4 w-4 text-gray-500" />}
                      <span>{device.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{device.value}%</span>
                      <span className="text-gray-500">({device.users})</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Flame className="h-5 w-5 mr-2 text-orange-600" />
              </CardTitle>
              <CardDescription>Prodotti top performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {generateTopProducts().map((product, index) => (
                  <div key={product.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-sm font-medium text-orange-600">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.units} unità</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">€{product.revenue.toLocaleString()}</p>
                      <div className="flex items-center justify-end">
                        {product.growth > 0 ? (
                          <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
                        ) : (
                          <ArrowDownRight className="h-3 w-3 text-red-500 mr-1" />
                        )}
                        <span className={`text-xs ${
                          product.growth > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {Math.abs(product.growth)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
