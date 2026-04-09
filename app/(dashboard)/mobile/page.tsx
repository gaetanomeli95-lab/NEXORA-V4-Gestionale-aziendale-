"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Package, 
  ShoppingCart, 
  CreditCard, 
  FileText, 
  Bell,
  Plus,
  Search,
  Filter,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import MobileLayout from '@/components/mobile-layout'

interface MobileStats {
  revenue: number
  revenueGrowth: number
  orders: number
  ordersGrowth: number
  customers: number
  customersGrowth: number
  products: number
  lowStock: number
  pendingPayments: number
  overdueInvoices: number
}

export default function MobileDashboard() {
  const [stats, setStats] = useState<MobileStats>({
    revenue: 3371.64,
    revenueGrowth: 12.5,
    orders: 24,
    ordersGrowth: 8.3,
    customers: 3,
    customersGrowth: 25.0,
    products: 4,
    lowStock: 1,
    pendingPayments: 2,
    overdueInvoices: 1
  })
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleRefresh = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
    }, 1000)
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  return (
    <MobileLayout
      title="Dashboard"
      showSearch={true}
      showFilters={true}
      showRefresh={true}
      showAdd={true}
      onSearch={setSearchQuery}
      onRefresh={handleRefresh}
      badgeCount={3}
    >
      <div className="p-4 space-y-6">
        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="h-5 w-5" />
                  {getGrowthIcon(stats.revenueGrowth)}
                </div>
                <div className="text-2xl font-bold">{formatCurrency(stats.revenue)}</div>
                <div className="text-xs opacity-90">Fatturato</div>
                <div className={`text-xs mt-1 ${getGrowthColor(stats.revenueGrowth)}`}>
                  +{stats.revenueGrowth}%
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <ShoppingCart className="h-5 w-5" />
                  {getGrowthIcon(stats.ordersGrowth)}
                </div>
                <div className="text-2xl font-bold">{stats.orders}</div>
                <div className="text-xs opacity-90">Ordini</div>
                <div className={`text-xs mt-1 ${getGrowthColor(stats.ordersGrowth)}`}>
                  +{stats.ordersGrowth}%
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Users className="h-5 w-5" />
                  {getGrowthIcon(stats.customersGrowth)}
                </div>
                <div className="text-2xl font-bold">{stats.customers}</div>
                <div className="text-xs opacity-90">Clienti</div>
                <div className={`text-xs mt-1 ${getGrowthColor(stats.customersGrowth)}`}>
                  +{stats.customersGrowth}%
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Package className="h-5 w-5" />
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div className="text-2xl font-bold">{stats.products}</div>
                <div className="text-xs opacity-90">Prodotti</div>
                <div className="text-xs mt-1">
                  {stats.lowStock} scorte basse
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Azioni Rapide</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <Button className="h-16 flex-col" variant="outline">
                <Plus className="h-5 w-5 mb-1" />
                Nuovo Ordine
              </Button>
              <Button className="h-16 flex-col" variant="outline">
                <Users className="h-5 w-5 mb-1" />
                Nuovo Cliente
              </Button>
              <Button className="h-16 flex-col" variant="outline">
                <Package className="h-5 w-5 mb-1" />
                Nuovo Prodotto
              </Button>
              <Button className="h-16 flex-col" variant="outline">
                <FileText className="h-5 w-5 mb-1" />
                Nuova Fattura
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Attività Recenti</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Nuovo ordine #ORD-004</p>
                <p className="text-xs text-gray-500">Cliente Mario Rossi • 2 min fa</p>
              </div>
              <Badge variant="outline">€450.00</Badge>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Pagamento ricevuto</p>
                <p className="text-xs text-gray-500">Fattura #F-001 • 15 min fa</p>
              </div>
              <Badge variant="outline">€1,200.00</Badge>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Scorte basse</p>
                <p className="text-xs text-gray-500">Prodotto SKU-001 • 1 ora fa</p>
              </div>
              <Badge variant="destructive">5 unità</Badge>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Nuovo cliente</p>
                <p className="text-xs text-gray-500">Giulia Verdi • 2 ore fa</p>
              </div>
              <Badge variant="outline">Premium</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Alert e Notifiche</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-900">Fattura scaduta</span>
              </div>
              <Badge variant="destructive">1</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Package className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-900">Scorte basse</span>
              </div>
              <Badge variant="secondary">1</Badge>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Pagamenti in attesa</span>
              </div>
              <Badge variant="outline">2</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Performance Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Performance Mensile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Obiettivo Fatturato</span>
                <span>€3,371 / €5,000</span>
              </div>
              <Progress value={67} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Obiettivo Ordini</span>
                <span>24 / 30</span>
              </div>
              <Progress value={80} className="h-2" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Obiettivo Clienti</span>
                <span>3 / 5</span>
              </div>
              <Progress value={60} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    </MobileLayout>
  )
}

