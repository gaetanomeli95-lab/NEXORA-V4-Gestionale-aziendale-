"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Edit, 
  Trash2, 
  Eye, 
  Package,
  ShoppingCart,
  Truck,
  CheckCircle,
  Clock,
  AlertTriangle,
  MoreHorizontal,
  Calendar,
  DollarSign,
  CreditCard,
  User,
  MapPin,
  RefreshCw,
  FileText,
  Settings,
  Printer
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useToast } from "@/hooks/use-toast"
import { ExportButton } from '@/components/ui/export-button'
import { OrderForm } from '@/components/forms/order-form'
import { getPopupDialogContentClassName, getPopupPrimaryButtonClassName } from '@/components/layout/module-theme'
import { formatDateTime } from '@/lib/utils'
import { downloadPrintDocument, openPrintDocument } from '@/lib/print-url'
import { PageShell, PageShellLoading } from '@/components/layout/page-shell'
import { PopupHeader } from '@/components/ui/popup-header'

interface OrderCustomer {
  id?: string
  name: string
  email?: string
}

interface OrderItem {
  id: string
  productId?: string
  productName: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  status: string
}

interface Order {
  id: string
  number?: string
  displayNumber: string
  customerId?: string
  customer: OrderCustomer | null
  customerName: string
  customerEmail?: string
  status: string
  paymentStatus: string
  priority: string
  orderDate: string
  expectedDeliveryDate?: string
  actualDeliveryDate?: string
  subtotal?: number
  taxAmount?: number
  totalAmount: number
  items: OrderItem[]
  itemCount: number
  totalQuantity: number
  shippedItemsCount: number
  shippingAddress?: string
  shippingAddressText: string
  trackingNumber?: string
  notes?: string
  internalNotes?: string
  createdAt: string
  updatedAt: string
}

interface OrderStats {
  totalOrders: number
  pendingOrders: number
  processingOrders: number
  shippedOrders: number
  deliveredOrders: number
  totalRevenue: number
  averageOrderValue: number
  overdueOrders: number
  topCustomers: Array<{
    customerId: string
    customerName: string
    orderCount: number
    totalRevenue: number
  }>
  statusDistribution: Record<string, { count: number; revenue: number }>
}

export default function OrdersPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState<OrderStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedPriority, setSelectedPriority] = useState('all')
  const [sortBy, setSortBy] = useState('orderDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState('Contanti')
  const [paymentNotes, setPaymentNotes] = useState('')

  useEffect(() => {
    fetchOrders()
    fetchStats()
  }, [searchQuery, selectedStatus, selectedPriority, sortBy, sortOrder, currentPage])

  const parseShippingAddress = (shippingAddress: unknown) => {
    if (!shippingAddress) {
      return ''
    }

    if (typeof shippingAddress === 'string') {
      try {
        const parsed = JSON.parse(shippingAddress)
        if (parsed && typeof parsed === 'object') {
          return [
            (parsed as Record<string, unknown>).street,
            [
              (parsed as Record<string, unknown>).postalCode,
              (parsed as Record<string, unknown>).city
            ].filter(Boolean).join(' '),
            (parsed as Record<string, unknown>).country
          ].filter((value): value is string => typeof value === 'string' && value.length > 0).join(', ')
        }
      } catch {
        return shippingAddress
      }

      return shippingAddress
    }

    if (typeof shippingAddress === 'object') {
      const address = shippingAddress as Record<string, unknown>
      return [
        address.street,
        [address.postalCode, address.city].filter(Boolean).join(' '),
        address.country
      ].filter((value): value is string => typeof value === 'string' && value.length > 0).join(', ')
    }

    return ''
  }

  const normalizeOrder = (order: any): Order => {
    const items: OrderItem[] = Array.isArray(order.items)
      ? order.items.map((item: any) => ({
          id: item.id,
          productId: item.productId || undefined,
          productName: item.productName || item.product?.name || item.description || 'Articolo',
          description: item.description || item.productName || item.product?.name || 'Articolo ordine',
          quantity: Number(item.quantity || 0),
          unitPrice: Number(item.unitPrice || 0),
          totalPrice: Number(item.totalPrice || 0),
          status: item.status || order.status || 'PENDING'
        }))
      : []

    const shippingAddressText = parseShippingAddress(order.shippingAddress)
    const customerName = order.customer?.name || 'Cliente non associato'
    const shippedItemsCount = ['SHIPPED', 'DELIVERED'].includes(order.status || '')
      ? items.length
      : items.filter((item) => ['SHIPPED', 'DELIVERED'].includes(item.status)).length

    return {
      id: order.id,
      number: order.number || undefined,
      displayNumber: order.number || `ORD-${order.id.slice(-6).toUpperCase()}`,
      customerId: order.customerId || undefined,
      customer: order.customer
        ? {
            id: order.customer.id || undefined,
            name: order.customer.name,
            email: order.customer.email || undefined
          }
        : null,
      customerName,
      customerEmail: order.customer?.email || undefined,
      status: order.status || 'DRAFT',
      paymentStatus: order.paymentStatus || 'NON PAGATO',
      priority: order.priority || 'MEDIUM',
      orderDate: typeof order.orderDate === 'string' ? order.orderDate : new Date(order.orderDate).toISOString(),
      expectedDeliveryDate: order.expectedDeliveryDate
        ? typeof order.expectedDeliveryDate === 'string'
          ? order.expectedDeliveryDate
          : new Date(order.expectedDeliveryDate).toISOString()
        : undefined,
      actualDeliveryDate: order.actualDeliveryDate
        ? typeof order.actualDeliveryDate === 'string'
          ? order.actualDeliveryDate
          : new Date(order.actualDeliveryDate).toISOString()
        : undefined,
      subtotal: typeof order.subtotal === 'number' ? order.subtotal : undefined,
      taxAmount: typeof order.taxAmount === 'number' ? order.taxAmount : undefined,
      totalAmount: Number(order.totalAmount || 0),
      items,
      itemCount: items.length,
      totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
      shippedItemsCount,
      shippingAddress: typeof order.shippingAddress === 'string' ? order.shippingAddress : undefined,
      shippingAddressText,
      trackingNumber: order.trackingNumber || undefined,
      notes: order.notes || undefined,
      internalNotes: order.internalNotes || undefined,
      createdAt: typeof order.createdAt === 'string' ? order.createdAt : new Date(order.createdAt).toISOString(),
      updatedAt: typeof order.updatedAt === 'string' ? order.updatedAt : new Date(order.updatedAt).toISOString()
    }
  }

  const normalizeStats = (data: any): OrderStats => ({
    totalOrders: Number(data.totalOrders || 0),
    pendingOrders: Number(data.pendingOrders || 0),
    processingOrders: Number(data.processingOrders || 0),
    shippedOrders: Number(data.shippedOrders || 0),
    deliveredOrders: Number(data.deliveredOrders || 0),
    totalRevenue: Number(data.totalRevenue || 0),
    averageOrderValue: Number(data.averageOrderValue || 0),
    overdueOrders: Number(data.overdueOrders || 0),
    topCustomers: Array.isArray(data.topCustomers)
      ? data.topCustomers.map((customer: any) => ({
          customerId: customer.customerId,
          customerName: customer.customerName,
          orderCount: Number(customer.orderCount || 0),
          totalRevenue: Number(customer.totalRevenue || 0)
        }))
      : [],
    statusDistribution: data.statusDistribution || {}
  })

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search: searchQuery,
        status: selectedStatus !== 'all' ? selectedStatus : '',
        priority: selectedPriority !== 'all' ? selectedPriority : '',
        sortBy,
        sortOrder,
        page: currentPage.toString(),
        limit: '500'
      })

      const response = await fetch(`/api/orders?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setOrders(Array.isArray(result.data) ? result.data.map(normalizeOrder) : [])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/orders/stats')
      const result = await response.json()
      
      if (result.success) {
        setStats(normalizeStats(result.data))
      }
    } catch (error) {
      console.error('Error fetching order stats:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; cls: string }> = {
      DRAFT: { label: 'Bozza', cls: 'bg-slate-100 text-slate-700 border-slate-300' },
      PENDING: { label: 'In attesa', cls: 'bg-amber-100 text-amber-800 border-amber-300' },
      PROCESSING: { label: 'In elaborazione', cls: 'bg-blue-100 text-blue-700 border-blue-300' },
      SHIPPED: { label: 'Spedito', cls: 'bg-violet-100 text-violet-700 border-violet-300' },
      DELIVERED: { label: 'Consegnato', cls: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
      CANCELLED: { label: 'Annullato', cls: 'bg-red-100 text-red-700 border-red-300' }
    }

    const config = statusConfig[status] || statusConfig.DRAFT
    return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${config.cls}`}>{config.label}</span>
  }

  const getPaymentStatusBadge = (status: string) => {
    const config: Record<string, { label: string; cls: string }> = {
      'NON PAGATO': { label: 'Non pagato', cls: 'bg-red-100 text-red-700 border-red-300' },
      'PARZIALMENTE PAGATO': { label: 'Parziale', cls: 'bg-orange-100 text-orange-700 border-orange-300' },
      'PAGATO': { label: 'Pagato', cls: 'bg-green-100 text-green-700 border-green-300' }
    }
    const c = config[status] || { label: status || 'NON PAGATO', cls: 'bg-gray-100 text-gray-700 border-gray-300' }
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${c.cls}`}>{c.label}</span>
  }

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      LOW: { label: 'Bassa', variant: 'secondary' as const },
      MEDIUM: { label: 'Media', variant: 'outline' as const },
      HIGH: { label: 'Alta', variant: 'default' as const },
      URGENT: { label: 'Urgente', variant: 'destructive' as const }
    }
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.MEDIUM
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT': return <FileText className="h-4 w-4" />
      case 'PENDING': return <Clock className="h-4 w-4" />
      case 'PROCESSING': return <Settings className="h-4 w-4" />
      case 'SHIPPED': return <Truck className="h-4 w-4" />
      case 'DELIVERED': return <CheckCircle className="h-4 w-4" />
      case 'CANCELLED': return <AlertTriangle className="h-4 w-4" />
      default: return <Package className="h-4 w-4" />
    }
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

  const getDeliveryStatus = (order: Order) => {
    if (!order.expectedDeliveryDate) return null
    
    const today = new Date()
    const expectedDate = new Date(order.expectedDeliveryDate)
    const daysDiff = Math.ceil((expectedDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (order.status === 'DELIVERED') return { status: 'DELIVERED', color: 'text-green-600', text: 'Consegnato' }
    if (daysDiff < 0) return { status: 'OVERDUE', color: 'text-red-600', text: `Ritardo di ${Math.abs(daysDiff)} giorni` }
    if (daysDiff <= 2) return { status: 'SOON', color: 'text-orange-600', text: `Tra ${daysDiff} giorni` }
    return { status: 'ON_TIME', color: 'text-green-600', text: `Tra ${daysDiff} giorni` }
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      const result = await res.json()
      if (result.success) {
        toast({ title: "Stato aggiornato", description: `Ordine aggiornato a ${status}` })
        fetchOrders()
        fetchStats()
        if (selectedOrder?.id === id) setSelectedOrder(result.data)
      } else {
        toast({ title: "Errore", description: result.error || 'Errore aggiornamento', variant: "destructive" })
      }
    } catch {
      toast({ title: "Errore", description: "Errore di rete", variant: "destructive" })
    }
  }

  const handlePayment = async () => {
    if (!selectedOrder || !paymentAmount) return
    
    const amount = parseFloat(paymentAmount)
    const isPartial = amount < selectedOrder.totalAmount
    
    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          method: paymentMethod,
          notes: paymentNotes,
          isPartial
        })
      })
      
      const result = await res.json()
      
      if (result.success) {
        toast({
          title: "Pagamento registrato",
          description: "Il pagamento è stato registrato nel libro cassa"
        })
        setShowPaymentModal(false)
        setPaymentAmount('')
        setPaymentNotes('')
        fetchOrders()
        fetchStats()
        // Aggiorna l'ordine selezionato per mostrare il nuovo stato
        setSelectedOrder(prev => prev ? { ...prev, paymentStatus: isPartial ? 'PARZIALMENTE PAGATO' : 'PAGATO' } : null)
      } else {
        toast({
          title: "Errore",
          description: result.error || "Errore durante la registrazione",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "Errore di connessione",
        variant: "destructive"
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo ordine?')) return
    try {
      const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' })
      const result = await res.json()
      if (result.success) {
        toast({ title: "Eliminato", description: "Ordine eliminato con successo" })
        setShowOrderDetails(false)
        setSelectedOrder(null)
        fetchOrders()
        fetchStats()
      } else {
        toast({ title: "Errore", description: result.error || 'Errore eliminazione', variant: "destructive" })
      }
    } catch {
      toast({ title: "Errore", description: "Errore di rete", variant: "destructive" })
    }
  }

  const handleConvertToInvoice = async (id: string) => {
    if (!confirm('Vuoi generare una fattura da questo ordine?')) return
    try {
      const order = orders.find(o => o.id === id)
      if (!order) return
      const payload = {
        customerId: order.customerId || order.customer?.id,
        items: order.items.map(item => ({
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: 22,
        })),
        issueDate: new Date().toISOString(),
        notes: `Generata da ordine ${order.displayNumber}`,
      }
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await res.json()
      if (result.success) {
        toast({ title: "Fattura generata", description: `Fattura ${result.data.number} creata con successo!` })
        await handleUpdateStatus(id, 'PROCESSING')
      } else {
        toast({ title: "Errore", description: result.error || 'Errore generazione fattura', variant: "destructive" })
      }
    } catch {
      toast({ title: "Errore", description: "Errore di rete", variant: "destructive" })
    }
  }

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order)
    setShowOrderDetails(true)
  }

  const filteredOrders = orders.filter(order => {
    const normalizedSearch = searchQuery.trim().toLowerCase()
    const searchableValues = [
      order.displayNumber,
      order.customerName,
      order.customerEmail,
      order.trackingNumber,
      order.shippingAddressText
    ].filter((value): value is string => Boolean(value))

    const matchesSearch = normalizedSearch.length === 0 || searchableValues.some((value) =>
      value.toLowerCase().includes(normalizedSearch)
    )
    
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus
    const matchesPriority = selectedPriority === 'all' || order.priority === selectedPriority
    
    return matchesSearch && matchesStatus && matchesPriority
  })

  const sortedOrders = [...filteredOrders].sort((leftOrder, rightOrder) => {
    const direction = sortOrder === 'asc' ? 1 : -1

    switch (sortBy) {
      case 'orderDate':
        return (new Date(leftOrder.orderDate).getTime() - new Date(rightOrder.orderDate).getTime()) * direction
      case 'totalAmount':
        return (leftOrder.totalAmount - rightOrder.totalAmount) * direction
      case 'customer':
        return leftOrder.customerName.localeCompare(rightOrder.customerName) * direction
      default:
        return leftOrder.displayNumber.localeCompare(rightOrder.displayNumber) * direction
    }
  })

  if (loading && orders.length === 0) {
    return (
      <PageShell title="Ordini Clienti / Vendita Banco" description="Gestione completa ordini clienti e vendite a banco" icon={ShoppingCart} theme="orders">
        <PageShellLoading label="Caricamento ordini..." theme="orders" />
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Ordini Clienti / Vendita Banco"
      description="Gestione completa ordini clienti e vendite a banco"
      icon={ShoppingCart}
      theme="orders"
      actions={
        <>
          <Button variant="outline" onClick={fetchOrders} className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <RefreshCw className="h-4 w-4 mr-2" />
            Aggiorna
          </Button>
          <ExportButton
            data={sortedOrders}
            columns={[
              { header: 'Numero', key: 'displayNumber' },
              { header: 'Cliente', key: 'customerName' },
              { header: 'Data', key: 'orderDate', format: 'date' },
              { header: 'Stato', key: 'status' },
              { header: 'Priorità', key: 'priority' },
              { header: 'Totale', key: 'totalAmount', format: 'currency' }
            ]}
            filename="ordini-clienti"
          />
          <Button onClick={() => { setEditingOrder(null); setShowForm(true) }} className="border border-orange-400/40 bg-orange-600 text-white hover:bg-orange-700 shadow-[0_14px_30px_-18px_rgba(234,88,12,0.75)]">
            <Plus className="h-4 w-4 mr-2" />
            Nuovo Ordine
          </Button>
        </>
      }
    >
      <div className="space-y-6">

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Ordini Totali</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalOrders}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {stats.processingOrders} in elaborazione
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-50">
                      <ShoppingCart className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Da Spedire</p>
                      <p className="text-2xl font-bold text-orange-600 mt-1">{stats.pendingOrders}</p>
                      <p className="text-xs text-orange-600 mt-1">
                        {stats.overdueOrders} in ritardo
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-orange-50">
                      <Package className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Fatturato Ordini</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalRevenue)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Media: {formatCurrency(stats.averageOrderValue)}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-green-50">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Consegnati</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">{stats.deliveredOrders}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {stats.totalOrders > 0 ? Math.round((stats.deliveredOrders / stats.totalOrders) * 100) : 0}% completati
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-purple-50">
                      <CheckCircle className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Cerca ordini..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Stato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti gli stati</SelectItem>
                    <SelectItem value="DRAFT">Bozza</SelectItem>
                    <SelectItem value="PENDING">In attesa</SelectItem>
                    <SelectItem value="PROCESSING">In elaborazione</SelectItem>
                    <SelectItem value="SHIPPED">Spedito</SelectItem>
                    <SelectItem value="DELIVERED">Consegnato</SelectItem>
                    <SelectItem value="CANCELLED">Annullato</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Priorità" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le priorità</SelectItem>
                    <SelectItem value="LOW">Bassa</SelectItem>
                    <SelectItem value="MEDIUM">Media</SelectItem>
                    <SelectItem value="HIGH">Alta</SelectItem>
                    <SelectItem value="URGENT">Urgente</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtri
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Elenco Ordini ({sortedOrders.length})</CardTitle>
            <CardDescription>
              Gestione completa ordini con tracking e delivery
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('orderDate')}
                  >
                    <div className="flex items-center">
                      Ordine
                      {sortBy === 'orderDate' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead>Priorità</TableHead>
                  <TableHead>Articoli</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('totalAmount')}
                  >
                    <div className="flex items-center">
                      Totale
                      {sortBy === 'totalAmount' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Consegna</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedOrders.map((order) => {
                  const deliveryStatus = getDeliveryStatus(order)
                  
                  return (
                    <TableRow 
                      key={order.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleOrderClick(order)}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {getStatusIcon(order.status)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{order.displayNumber}</div>
                            <div className="text-sm text-gray-500">
                              {formatDate(order.orderDate)}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">{order.customerName}</div>
                          {order.customerEmail && (
                            <div className="text-sm text-gray-500">{order.customerEmail}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{getPriorityBadge(order.priority)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{order.itemCount} articoli</div>
                          <div className="text-gray-500">
                            {order.shippedItemsCount} spediti • {order.totalQuantity} pz
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getPaymentStatusBadge(order.paymentStatus || 'NON PAGATO')}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">{formatCurrency(order.totalAmount)}</div>
                          <div className="text-gray-500">
                            {order.items.length > 0 ? formatCurrency(order.totalAmount / order.items.length) : '€0'} media
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {deliveryStatus ? (
                            <div className={`flex items-center ${deliveryStatus.color}`}>
                              <Clock className="h-3 w-3 mr-1" />
                              {deliveryStatus.text}
                            </div>
                          ) : (
                            <div className="text-gray-500">Data non specificata</div>
                          )}
                          {order.shippingAddressText && (
                            <div className="text-gray-500 truncate max-w-[220px]">
                              {order.shippingAddressText}
                            </div>
                          )}
                          {order.trackingNumber && (
                            <div className="text-gray-500">
                              Tracking: {order.trackingNumber}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOrderClick(order) }}>
                              <Eye className="h-4 w-4 mr-2" />
                              Dettagli
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingOrder(order); setShowForm(true) }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Modifica
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'SHIPPED') }}>
                              <Truck className="h-4 w-4 mr-2" />
                              Segna Spedito
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleUpdateStatus(order.id, 'DELIVERED') }}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Segna Consegnato
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleConvertToInvoice(order.id) }}>
                              <FileText className="h-4 w-4 mr-2" />
                              Genera Fattura
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openPrintDocument('order', order.id) }}>
                              <Printer className="h-4 w-4 mr-2" />
                              Stampa
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); downloadPrintDocument('order', order.id) }}>
                              <Download className="h-4 w-4 mr-2" />
                              Scarica PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); handleDelete(order.id) }}>
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              Elimina
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Order Details Dialog */}
        <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
          <DialogContent className={getPopupDialogContentClassName("max-w-4xl max-h-[90vh] overflow-y-auto")}>
            <PopupHeader
              theme="orders"
              title="Dettagli Ordine"
              description="Informazioni complete e stato ordine"
            />
            
            {selectedOrder && (
              <div className="space-y-6 p-6">
                {/* Order Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informazioni Ordine</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Numero Ordine</label>
                        <p className="font-medium">{selectedOrder.displayNumber}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Data Ordine</label>
                        <p>{formatDate(selectedOrder.orderDate)}</p>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Stato</label>
                          <div>{getStatusBadge(selectedOrder.status)}</div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Priorità</label>
                          <div>{getPriorityBadge(selectedOrder.priority)}</div>
                        </div>
                      </div>
                      
                      {selectedOrder.trackingNumber && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Tracking</label>
                          <p>{selectedOrder.trackingNumber}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informazioni Cliente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Cliente</label>
                        <p className="font-medium">{selectedOrder.customerName}</p>
                      </div>
                      
                      {selectedOrder.customerEmail && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Email</label>
                          <p>{selectedOrder.customerEmail}</p>
                        </div>
                      )}
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Indirizzo Spedizione</label>
                        <p className="text-sm">{selectedOrder.shippingAddressText || 'Non specificato'}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Order Items */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Articoli Ordine</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Prodotto</TableHead>
                          <TableHead>Descrizione</TableHead>
                          <TableHead>Quantità</TableHead>
                          <TableHead>Prezzo</TableHead>
                          <TableHead>Totale</TableHead>
                          <TableHead>Stato</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.productName}</TableCell>
                            <TableCell>{item.description}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                            <TableCell>{formatCurrency(item.totalPrice)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    <div className="flex justify-end mt-4">
                      <div className="text-right">
                        {typeof selectedOrder.subtotal === 'number' && (
                          <div className="text-sm text-gray-500">
                            Subtotale: {formatCurrency(selectedOrder.subtotal)}
                          </div>
                        )}
                        {typeof selectedOrder.taxAmount === 'number' && selectedOrder.taxAmount > 0 && (
                          <div className="text-sm text-gray-500">
                            IVA: {formatCurrency(selectedOrder.taxAmount)}
                          </div>
                        )}
                        <div className="text-lg font-bold">
                          Totale: {formatCurrency(selectedOrder.totalAmount)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Delivery Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informazioni Consegna</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Data Prevista</label>
                        <p>
                          {selectedOrder.expectedDeliveryDate 
                            ? formatDate(selectedOrder.expectedDeliveryDate)
                            : 'Non specificata'
                          }
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Data Effettiva</label>
                        <p>
                          {selectedOrder.actualDeliveryDate 
                            ? formatDate(selectedOrder.actualDeliveryDate)
                            : 'Non consegnato'
                          }
                        </p>
                      </div>
                    </div>
                    
                    {selectedOrder.notes && (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-gray-600">Note</label>
                        <p className="text-sm">{selectedOrder.notes}</p>
                      </div>
                    )}
                    
                    {selectedOrder.internalNotes && (
                      <div className="mt-4">
                        <label className="text-sm font-medium text-gray-600">Note Interne</label>
                        <p className="text-sm">{selectedOrder.internalNotes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4">
                  <Button variant="outline" onClick={() => selectedOrder && openPrintDocument('order', selectedOrder.id)}>
                    <Printer className="h-4 w-4 mr-2" />
                    Stampa
                  </Button>
                  <Button variant="outline" onClick={() => selectedOrder && downloadPrintDocument('order', selectedOrder.id)}>
                    <Download className="h-4 w-4 mr-2" />
                    Scarica PDF
                  </Button>
                  <Button variant="outline" onClick={() => { setShowOrderDetails(false); setEditingOrder(selectedOrder); setShowForm(true) }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifica
                  </Button>
                  <Button variant="outline" onClick={() => selectedOrder && handleUpdateStatus(selectedOrder.id, 'SHIPPED')}>
                    <Truck className="h-4 w-4 mr-2" />
                    Segna Spedito
                  </Button>
                  <Button variant="outline" onClick={() => selectedOrder && handleConvertToInvoice(selectedOrder.id)}>
                    <FileText className="h-4 w-4 mr-2" />
                    Genera Fattura
                  </Button>
                  <Button className={getPopupPrimaryButtonClassName('orders')} onClick={() => selectedOrder && handleUpdateStatus(selectedOrder.id, 'PROCESSING')}>
                    <Package className="h-4 w-4 mr-2" />
                    In Elaborazione
                  </Button>
                  <Button 
                    className={getPopupPrimaryButtonClassName('orders')}
                    onClick={() => {
                      if (selectedOrder) {
                        setPaymentAmount(selectedOrder.totalAmount.toString())
                        setShowPaymentModal(true)
                      }
                    }}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Registra Incasso
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <OrderForm
          open={showForm}
          onClose={() => { setShowForm(false); setEditingOrder(null) }}
          onSuccess={() => { setShowForm(false); setEditingOrder(null); fetchOrders(); fetchStats() }}
          order={editingOrder}
        />

        {/* Payment Modal */}
        <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
          <DialogContent className={getPopupDialogContentClassName("max-w-lg")}>
            <PopupHeader
              theme="orders"
              title="Registra Incasso Ordine"
              description="Inserisci i dettagli del pagamento. Questo aggiornerà il libro cassa."
              icon={CreditCard}
            />
            <div className="space-y-4 p-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Importo (€)</label>
                <Input 
                  type="number" 
                  step="0.01" 
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  placeholder="0.00"
                />
                {selectedOrder && parseFloat(paymentAmount || '0') < selectedOrder.totalAmount && (
                  <p className="text-sm text-orange-600 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Importo inferiore al totale ({formatCurrency(selectedOrder.totalAmount)}). Verrà segnato come "Parzialmente Pagato".
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Metodo di Pagamento</label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona metodo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Contanti">Contanti</SelectItem>
                    <SelectItem value="Carta di Credito">Carta di Credito / Bancomat</SelectItem>
                    <SelectItem value="Bonifico">Bonifico Bancario</SelectItem>
                    <SelectItem value="Assegno">Assegno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Note (Opzionale)</label>
                <Input 
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Riferimento transazione o altre note"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={() => setShowPaymentModal(false)}>Annulla</Button>
              <Button onClick={handlePayment} disabled={!paymentAmount || parseFloat(paymentAmount) <= 0} className={getPopupPrimaryButtonClassName('orders')}>
                Registra Incasso
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageShell>
  )

}
