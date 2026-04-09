"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Package, 
  FileText,
  Bell,
  Search,
  Settings,
  Menu,
  X,
  Home,
  ShoppingCart,
  CreditCard,
  BarChart3,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Plus,
  ChevronRight,
  Star,
  Target,
  Zap,
  Globe,
  Shield,
  Cpu,
  Database,
  Wifi,
  Smartphone,
  Monitor,
  Tablet,
  User,
  LogOut
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

// Mock data
const kpiData = [
  { 
    title: 'Fatturato', 
    value: '€48.574', 
    change: 12.5, 
    icon: DollarSign, 
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    trend: 'up'
  },
  { 
    title: 'Ordini', 
    value: '1.234', 
    change: -2.4, 
    icon: ShoppingCart, 
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    trend: 'down'
  },
  { 
    title: 'Clienti', 
    value: '892', 
    change: 8.1, 
    icon: Users, 
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    trend: 'up'
  },
  { 
    title: 'Prodotti Venduti', 
    value: '5.678', 
    change: 15.3, 
    icon: Package, 
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    trend: 'up'
  },
]

const recentOrders = [
  { id: 'ORD-001', customer: 'Mario Rossi', amount: '€1.234', status: 'completed', date: '2024-03-26' },
  { id: 'ORD-002', customer: 'Laura Bianchi', amount: '€892', status: 'processing', date: '2024-03-26' },
  { id: 'ORD-003', customer: 'Giuseppe Verdi', amount: '€2.456', status: 'pending', date: '2024-03-25' },
  { id: 'ORD-004', customer: 'Francesca Neri', amount: '€567', status: 'shipped', date: '2024-03-25' },
]

const notifications = [
  { id: 1, type: 'success', message: 'Ordine ORD-001 completato con successo', time: '2 min fa' },
  { id: 2, type: 'warning', message: 'Scorte in esaurimento per prodotto SKU-1234', time: '15 min fa' },
  { id: 3, type: 'info', message: 'Nuovo cliente registrato: Mario Rossi', time: '1 ora fa' },
  { id: 4, type: 'error', message: 'Errore di connessione al gateway di pagamento', time: '2 ore fa' },
]

export default function Dashboard() {
  const { data: session } = useSession()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [searchQuery, setSearchQuery] = useState('')
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const userDisplayName = session?.user?.name || 'Utente NEXORA'
  const userEmail = session?.user?.email || 'account locale'
  const userInitials = userDisplayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('') || 'NX'

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate data updates
      console.log('Updating dashboard data...')
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const handleRefresh = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoading(false)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { label: 'Completato', variant: 'default' as const },
      processing: { label: 'In elaborazione', variant: 'secondary' as const },
      pending: { label: 'In attesa', variant: 'outline' as const },
      shipped: { label: 'Spedito', variant: 'default' as const },
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getNotificationIcon = (type: string) => {
    const icons = {
      success: <CheckCircle className="h-4 w-4 text-green-500" />,
      warning: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
      info: <Bell className="h-4 w-4 text-blue-500" />,
      error: <X className="h-4 w-4 text-red-500" />,
    }
    return icons[type as keyof typeof icons] || icons.info
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
              <div className="flex items-center space-x-3 ml-4 lg:ml-0">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">NEXORA v4</h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-2 bg-gray-50 rounded-lg px-3 py-2">
                <Search className="h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cerca globale..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-0 bg-transparent focus:ring-0 focus:outline-none w-64"
                />
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>

              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setNotificationsOpen(!notificationsOpen)}
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                </Button>
                
                <AnimatePresence>
                  {notificationsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50"
                    >
                      <div className="p-4 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-900">Notifiche</h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.map((notification) => (
                          <div key={notification.id} className="p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                            <div className="flex items-start space-x-3">
                              {getNotificationIcon(notification.type)}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900">{notification.message}</p>
                                <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/api/placeholder/32/32" alt="User" />
                      <AvatarFallback>{userInitials}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{userDisplayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profilo</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Impostazioni</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Esci</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'block' : 'hidden'} lg:block w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen`}>
          <nav className="p-4 space-y-2">
            <Button variant="ghost" className="w-full justify-start">
              <Home className="h-4 w-4 mr-3" />
              Dashboard
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Users className="h-4 w-4 mr-3" />
              Clienti
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Package className="h-4 w-4 mr-3" />
              Prodotti
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <ShoppingCart className="h-4 w-4 mr-3" />
              Ordini
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <FileText className="h-4 w-4 mr-3" />
              Fatture
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <BarChart3 className="h-4 w-4 mr-3" />
              Analytics
            </Button>
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="h-4 w-4 mr-3" />
              Impostazioni
            </Button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="space-y-6">
            {/* Header Stats */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
                <p className="text-gray-600">Benvenuto nel tuo pannello di controllo</p>
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
                    <SelectItem value="year">Questo anno</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtri
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Esporta
                </Button>
              </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {kpiData.map((kpi, index) => (
                <motion.div
                  key={kpi.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">{kpi.value}</p>
                          <div className="flex items-center mt-2">
                            {kpi.trend === 'up' ? (
                              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                            )}
                            <span className={`text-sm ${kpi.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                              {kpi.change > 0 ? '+' : ''}{kpi.change}%
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

            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Ordini Recenti</CardTitle>
                    <CardDescription>Gli ultimi ordini ricevuti</CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Vedi tutti
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                          <ShoppingCart className="h-5 w-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{order.id}</p>
                          <p className="text-sm text-gray-600">{order.customer}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <p className="font-medium text-gray-900">{order.amount}</p>
                        {getStatusBadge(order.status)}
                        <p className="text-sm text-gray-500">{order.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}
