"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, Plus, Download, Edit, Trash2, Eye, Factory, PackageOpen,
  MoreHorizontal, RefreshCw, Printer, Copy, Package,
  CheckCircle, Clock, AlertTriangle, DollarSign, Truck
} from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ExportButton } from '@/components/ui/export-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

import { SupplierOrderForm } from '@/components/forms/supplier-order-form'
import { getPopupDialogContentClassName, getPopupPrimaryButtonClassName } from '@/components/layout/module-theme'
import { downloadPrintDocument, openPrintDocument } from '@/lib/print-url'
import { formatDateTime } from '@/lib/utils'
import { PageShell, PageShellLoading } from '@/components/layout/page-shell'
import { PopupHeader } from '@/components/ui/popup-header'

interface SupplierInfo {
  id: string
  name: string
  email?: string
  phone?: string
}

interface SupplierOrderItem {
  id: string
  productId?: string
  product?: { id: string; name: string; sku?: string } | null
  description: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
  taxRate: number
  notes?: string
}

interface SupplierOrder {
  id: string
  number: string
  supplierId: string
  supplier: SupplierInfo
  orderDate: string
  loadingStatus: string
  paymentStatus: string
  totalAmount: number
  notes?: string
  items: SupplierOrderItem[]
  createdAt: string
  updatedAt: string
}

interface SupplierOrderStats {
  totalOrders: number
  toLoadCount: number
  partialCount: number
  loadedCount: number
  unpaidCount: number
  totalValue: number
}

export default function SupplierOrdersPage() {
  const { toast } = useToast()
  const [orders, setOrders] = useState<SupplierOrder[]>([])
  const [stats, setStats] = useState<SupplierOrderStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLoadingStatus, setSelectedLoadingStatus] = useState('all')
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<SupplierOrder | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingOrder, setEditingOrder] = useState<SupplierOrder | null>(null)

  const handleCreateOrder = () => { setEditingOrder(null); setShowForm(true) }
  const handleEditOrder = (o: SupplierOrder) => { setEditingOrder(o); setShowForm(true) }
  const handleFormSuccess = () => { setShowForm(false); setEditingOrder(null); fetchOrders() }

  const openOrderDetails = (order: SupplierOrder) => {
    setSelectedOrder(order)
    setShowDetails(true)
  }

  const handleUpdateStatus = async (id: string, field: string, value: string) => {
    try {
      const res = await fetch(`/api/supplier-orders/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value })
      })
      const result = await res.json()
      if (result.success) {
        fetchOrders()
        if (selectedOrder?.id === id) setSelectedOrder(result.data)
      } else {
        toast({
          title: "Errore",
          description: result.error || 'Errore aggiornamento',
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Errore",
        description: "Errore di rete",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo ordine fornitore?')) return
    try {
      const res = await fetch(`/api/supplier-orders/${id}`, { method: 'DELETE' })
      const result = await res.json()
      if (result.success) {
        setShowDetails(false)
        setSelectedOrder(null)
        fetchOrders()
      } else {
        toast({
          title: "Errore",
          description: result.error || 'Errore eliminazione',
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Errore",
        description: "Errore di rete",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [searchQuery, selectedLoadingStatus, selectedPaymentStatus, currentPage])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      })
      if (searchQuery) params.set('search', searchQuery)
      if (selectedLoadingStatus !== 'all') params.set('loadingStatus', selectedLoadingStatus)
      if (selectedPaymentStatus !== 'all') params.set('paymentStatus', selectedPaymentStatus)

      const response = await fetch(`/api/supplier-orders?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setOrders(result.data.orders || [])
        setTotalPages(result.data.pagination?.pages || 1)
        setStats(result.data.stats || null)
      }
    } catch (error) {
      console.error('Error fetching supplier orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return formatDateTime(dateString)
  }

  const getLoadingStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      'DA CARICARE': { label: 'Da caricare', variant: 'destructive' },
      'PARZIALE': { label: 'Parziale', variant: 'secondary' },
      'CARICATO': { label: 'Caricato', variant: 'default' }
    }
    const c = config[status] || { label: status, variant: 'outline' as const }
    return <Badge variant={c.variant}>{c.label}</Badge>
  }

  const getPaymentStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      'NON PAGATO': { label: 'Non pagato', variant: 'destructive' },
      'PARZIALE': { label: 'Parziale', variant: 'secondary' },
      'PAGATO': { label: 'Pagato', variant: 'default' }
    }
    const c = config[status] || { label: status, variant: 'outline' as const }
    return <Badge variant={c.variant}>{c.label}</Badge>
  }

  const exportColumns = [
    { header: 'N° Ordine', key: 'number' },
    { header: 'Data Ordine', key: 'orderDate' },
    { header: 'Stato Carico', key: 'loadingStatus' },
    { header: 'Pagamento', key: 'paymentStatus' },
    { header: 'Totale', key: 'totalAmount' },
    { header: 'Note', key: 'notes' }
  ]

  const exportData = orders.map(o => ({
    number: o.number,
    orderDate: formatDate(o.orderDate),
    loadingStatus: o.loadingStatus,
    paymentStatus: o.paymentStatus || '',
    totalAmount: o.totalAmount.toFixed(2),
    notes: o.notes || ''
  }))

  if (loading && orders.length === 0) {
    return (
      <PageShell title="Ordini Fornitore" description="Gestione ordini ai fornitori e carico magazzino" icon={PackageOpen} theme="supplierOrders">
        <PageShellLoading label="Caricamento ordini fornitore..." theme="supplierOrders" />
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Ordini Fornitore"
      description="Gestione ordini ai fornitori e carico magazzino"
      icon={PackageOpen}
      theme="supplierOrders"
      actions={
        <>
          <Button variant="outline" onClick={fetchOrders} className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <RefreshCw className="h-4 w-4 mr-2" />
            Aggiorna
          </Button>
          <ExportButton 
            data={exportData} 
            columns={exportColumns} 
            filename="ordini_fornitori" 
            title="Ordini Fornitori" 
          />
          <Button onClick={handleCreateOrder} className="border border-amber-500/40 bg-amber-700 text-white hover:bg-amber-800 shadow-[0_14px_30px_-18px_rgba(180,83,9,0.75)]">
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
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Totale Ordini</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stats.totalOrders}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-50">
                      <Factory className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Valore Totale</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(stats.totalValue)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-green-50">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Da Caricare</p>
                      <p className="text-2xl font-bold text-orange-600 mt-1">{stats.toLoadCount}</p>
                      <p className="text-xs text-gray-500 mt-1">{stats.partialCount} parziali</p>
                    </div>
                    <div className="p-3 rounded-lg bg-orange-50">
                      <Package className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Non Pagati</p>
                      <p className="text-2xl font-bold text-red-600 mt-1">{stats.unpaidCount}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-red-50">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Cerca ordini per numero, fornitore..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedLoadingStatus} onValueChange={setSelectedLoadingStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Carico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  <SelectItem value="DA CARICARE">Da caricare</SelectItem>
                  <SelectItem value="PARZIALE">Parziale</SelectItem>
                  <SelectItem value="CARICATO">Caricato</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedPaymentStatus} onValueChange={setSelectedPaymentStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Pagamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti</SelectItem>
                  <SelectItem value="NON PAGATO">Non pagato</SelectItem>
                  <SelectItem value="PARZIALE">Parziale</SelectItem>
                  <SelectItem value="PAGATO">Pagato</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista Ordini Fornitore ({orders.length})</CardTitle>
            <CardDescription>Ordini di acquisto e stato caricamento</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Ordine</TableHead>
                  <TableHead>Fornitore</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Carico</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead className="text-right">Totale</TableHead>
                  <TableHead>Righe</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow
                    key={order.id}
                    className={`cursor-pointer transition-colors ${
                      selectedOrder?.id === order.id
                        ? 'bg-blue-50 hover:bg-blue-100 border-l-2 border-l-blue-500'
                        : 'hover:bg-slate-50'
                    }`}
                    onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                    onDoubleClick={() => { setSelectedOrder(order); setShowDetails(true) }}
                  >
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Factory className="h-4 w-4 text-indigo-500" />
                        <span className="font-medium">{order.number}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900">{order.supplier?.name || 'N/A'}</div>
                      {order.supplier?.email && <div className="text-sm text-gray-500">{order.supplier.email}</div>}
                    </TableCell>
                    <TableCell>{formatDate(order.orderDate)}</TableCell>
                    <TableCell>{getLoadingStatusBadge(order.loadingStatus)}</TableCell>
                    <TableCell>{getPaymentStatusBadge(order.paymentStatus)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(order.totalAmount)}</TableCell>
                    <TableCell><Badge variant="secondary">{order.items?.length || 0}</Badge></TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openOrderDetails(order)}><Eye className="h-4 w-4 mr-2" />Dettagli</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditOrder(order)}><Edit className="h-4 w-4 mr-2" />Modifica</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'loadingStatus', 'CARICATO')}><Truck className="h-4 w-4 mr-2" />Segna Caricato</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(order.id, 'paymentStatus', 'PAGATO')}><CheckCircle className="h-4 w-4 mr-2" />Segna Pagato</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openPrintDocument('supplier-order', order.id)}><Printer className="h-4 w-4 mr-2" />Stampa</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => downloadPrintDocument('supplier-order', order.id)}><Download className="h-4 w-4 mr-2" />Scarica PDF</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(order.id)}><Trash2 className="h-4 w-4 mr-2" />Elimina</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {orders.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <Factory className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Nessun ordine fornitore trovato</p>
                      <Button className="mt-4" onClick={handleCreateOrder}><Plus className="h-4 w-4 mr-2" />Crea il primo ordine</Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-6">
                <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>Precedente</Button>
                <span className="text-sm text-gray-600">Pagina {currentPage} di {totalPages}</span>
                <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>Successiva</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Details Dialog */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className={getPopupDialogContentClassName("max-w-4xl max-h-[90vh] overflow-y-auto")}>
            <PopupHeader
              theme="supplierOrders"
              title={`Ordine Fornitore ${selectedOrder?.number || ''}`}
              description="Dettagli ordine di acquisto"
            />
            
            {selectedOrder && (
              <div className="space-y-6 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader><CardTitle className="text-lg">Informazioni Ordine</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between"><span className="text-sm text-gray-600">Numero</span><span className="font-medium">{selectedOrder.number}</span></div>
                      <div className="flex justify-between"><span className="text-sm text-gray-600">Data</span><span>{formatDate(selectedOrder.orderDate)}</span></div>
                      <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Carico</span>{getLoadingStatusBadge(selectedOrder.loadingStatus)}</div>
                      <div className="flex justify-between items-center"><span className="text-sm text-gray-600">Pagamento</span>{getPaymentStatusBadge(selectedOrder.paymentStatus)}</div>
                      <div className="flex justify-between"><span className="text-sm text-gray-600">Totale</span><span className="font-bold text-lg">{formatCurrency(selectedOrder.totalAmount)}</span></div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-lg">Fornitore</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Factory className="h-10 w-10 text-gray-400 p-2 bg-gray-100 rounded-lg" />
                        <div>
                          <div className="font-medium">{selectedOrder.supplier?.name}</div>
                          {selectedOrder.supplier?.email && <div className="text-sm text-gray-500">{selectedOrder.supplier.email}</div>}
                          {selectedOrder.supplier?.phone && <div className="text-sm text-gray-500">{selectedOrder.supplier.phone}</div>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader><CardTitle className="text-lg">Articoli Ordinati</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Descrizione</TableHead>
                          <TableHead className="text-right">Q.tà</TableHead>
                          <TableHead>U.M.</TableHead>
                          <TableHead className="text-right">Prezzo</TableHead>
                          <TableHead className="text-right">IVA</TableHead>
                          <TableHead className="text-right">Totale</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedOrder.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="font-medium">{item.description}</div>
                              {item.product && <div className="text-sm text-gray-500">{item.product.name} {item.product.sku && `(${item.product.sku})`}</div>}
                            </TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell>{item.unit}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                            <TableCell className="text-right">{item.taxRate}%</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(item.totalPrice)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="mt-4 border-t pt-4">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Totale Ordine</span>
                        <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {selectedOrder.notes && (
                  <Card>
                    <CardHeader><CardTitle className="text-lg">Note</CardTitle></CardHeader>
                    <CardContent><p className="text-sm">{selectedOrder.notes}</p></CardContent>
                  </Card>
                )}

                <div className="flex justify-end space-x-4">
                  <Button variant="outline" onClick={() => openPrintDocument('supplier-order', selectedOrder!.id)}><Printer className="h-4 w-4 mr-2" />Stampa</Button>
                  <Button variant="outline" onClick={() => downloadPrintDocument('supplier-order', selectedOrder!.id)}><Download className="h-4 w-4 mr-2" />Scarica PDF</Button>
                  <Button variant="outline" onClick={() => handleUpdateStatus(selectedOrder!.id, 'loadingStatus', 'CARICATO')} disabled={selectedOrder.loadingStatus === 'CARICATO'}><Truck className="h-4 w-4 mr-2" />Carica Magazzino</Button>
                  <Button className={getPopupPrimaryButtonClassName('supplierOrders')} onClick={() => { setShowDetails(false); handleEditOrder(selectedOrder!) }}><Edit className="h-4 w-4 mr-2" />Modifica</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <SupplierOrderForm
          open={showForm}
          onClose={() => setShowForm(false)}
          onSuccess={handleFormSuccess}
          order={editingOrder}
        />
      </div>
    </PageShell>
  )
}

