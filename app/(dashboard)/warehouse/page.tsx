"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, Warehouse, Package, AlertTriangle, 
  RefreshCw, ArrowUpRight, ArrowDownRight, BarChart3,
  XCircle, Filter, Plus, SlidersHorizontal, Printer, Download
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from "@/hooks/use-toast"
import { getPopupDialogContentClassName, getPopupPrimaryButtonClassName } from '@/components/layout/module-theme'
import { ExportButton } from '@/components/ui/export-button'
import { PageShell, PageShellLoading } from '@/components/layout/page-shell'
import { PopupHeader } from '@/components/ui/popup-header'
import { ThemeTable, getThemeTableActionButtonClassName, getThemeTableEmptyStateClassName, getThemeTableHeadClassName, getThemeTableHeaderClassName, getThemeTablePaginationButtonClassName, getThemeTableRowClassName, getThemeTableStatusBadgeClassName, getThemeTableStickyCellClassName } from '@/components/ui/theme-table'
import { downloadPrintDocument, openPrintDocument } from '@/lib/print-url'

interface WarehouseProduct {
  id: string
  name: string
  sku?: string
  code?: string
  barcode?: string
  unitOfMeasure: string
  warehouseName?: string
  location?: string
  stockQuantity: number
  minStockLevel: number
  maxStockLevel?: number
  reorderPoint?: number
  reorderQty?: number
  unitPrice: number
  costPrice?: number
  category?: { id: string; name: string } | null
  supplier?: { id: string; name: string } | null
}

interface StockMovement {
  id: string
  productId: string
  product: { id: string; name: string; sku?: string }
  movementType: string
  quantity: number
  beforeQuantity?: number
  afterQuantity?: number
  reference?: string
  referenceType?: string
  reason?: string
  notes?: string
  movementDate: string
}

interface WarehouseStats {
  totalItems: number
  totalStock: number
  totalValue: number
  lowStockCount: number
  outOfStockCount: number
}

export default function WarehousePage() {
  const { toast } = useToast()
  const [products, setProducts] = useState<WarehouseProduct[]>([])
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [stats, setStats] = useState<WarehouseStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [stockFilter, setStockFilter] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Stock adjustment state
  const [showAdjustment, setShowAdjustment] = useState(false)
  const [adjProduct, setAdjProduct] = useState<WarehouseProduct | null>(null)
  const [adjType, setAdjType] = useState<'IN' | 'OUT' | 'ADJUSTMENT'>('IN')
  const [adjQty, setAdjQty] = useState(1)
  const [adjNotes, setAdjNotes] = useState('')
  const [adjLoading, setAdjLoading] = useState(false)

  const openAdjustment = (product: WarehouseProduct) => {
    setAdjProduct(product)
    setAdjType('IN')
    setAdjQty(1)
    setAdjNotes('')
    setShowAdjustment(true)
  }

  const handleAdjustStock = async () => {
    if (!adjProduct) return
    if (adjQty <= 0) { toast({ title: "Errore", description: "Inserisci una quantità valida", variant: "destructive" }); return }
    setAdjLoading(true)
    try {
      const res = await fetch(`/api/products/${adjProduct.id}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movementType: adjType,
          quantity: adjQty,
          referenceType: 'MANUAL',
          notes: adjNotes || `Rettifica manuale (${adjType})`,
        }),
      })
      const result = await res.json()
      if (result.success) {
        toast({ title: "Giacenza aggiornata", description: `${adjType === 'IN' ? 'Carico' : adjType === 'OUT' ? 'Scarico' : 'Rettifica'} di ${adjQty} ${adjProduct.unitOfMeasure} per "${adjProduct.name}" registrato` })
        setShowAdjustment(false)
        fetchWarehouse()
      } else {
        toast({ title: "Errore", description: result.error || 'Errore durante la rettifica', variant: "destructive" })
      }
    } catch {
      toast({ title: "Errore", description: "Errore di rete", variant: "destructive" })
    } finally {
      setAdjLoading(false)
    }
  }

  useEffect(() => {
    fetchWarehouse()
  }, [searchQuery, stockFilter, sortBy, sortOrder, currentPage])

  const fetchWarehouse = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
        sortBy,
        sortOrder
      })
      if (searchQuery) params.set('search', searchQuery)
      if (stockFilter !== 'all') params.set('filter', stockFilter)

      const response = await fetch(`/api/warehouse?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setProducts(result.data.products || [])
        setTotalPages(result.data.pagination?.pages || 1)
        setStats(result.data.stats || null)
        setMovements(result.data.recentMovements || [])
      }
    } catch (error) {
      console.error('Error fetching warehouse:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const getStockStatus = (product: WarehouseProduct) => {
    if (product.stockQuantity <= 0) return { label: 'Esaurito', tone: 'danger' as const }
    if (product.stockQuantity <= product.minStockLevel) return { label: 'Sotto scorta', tone: 'warning' as const }
    return { label: 'Disponibile', tone: 'primary' as const }
  }

  const getMovementBadge = (movementType: string) => {
    return (
      <span className={getThemeTableStatusBadgeClassName('warehouse', movementType === 'IN' ? 'primary' : 'warning')}>
        {movementType === 'IN' ? 'Carico' : 'Scarico'}
      </span>
    )
  }

  const exportData = products.map(product => ({
    codice: product.code || product.sku || '',
    prodotto: product.name,
    categoria: product.category?.name || '',
    fornitore: product.supplier?.name || '',
    ubicazione: [product.warehouseName, product.location].filter(Boolean).join(' - '),
    giacenza: product.stockQuantity,
    unita: product.unitOfMeasure,
    minimo: product.minStockLevel,
    massimo: product.maxStockLevel ?? '',
    valore: product.stockQuantity * (product.costPrice || product.unitPrice)
  }))

  const exportColumns = [
    { header: 'Codice', key: 'codice' },
    { header: 'Prodotto', key: 'prodotto' },
    { header: 'Categoria', key: 'categoria' },
    { header: 'Fornitore', key: 'fornitore' },
    { header: 'Ubicazione', key: 'ubicazione' },
    { header: 'Giacenza', key: 'giacenza' },
    { header: 'Unità', key: 'unita' },
    { header: 'Minimo', key: 'minimo' },
    { header: 'Massimo', key: 'massimo' },
    { header: 'Valore', key: 'valore', format: 'currency' as const }
  ]

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  if (loading && products.length === 0) {
    return (
      <PageShell title="Magazzino" description="Gestione giacenze, movimenti e alert scorte" icon={Package} theme="warehouse">
        <PageShellLoading label="Caricamento magazzino..." theme="warehouse" />
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Magazzino"
      description="Gestione giacenze, movimenti e alert scorte"
      icon={Package}
      theme="warehouse"
      actions={
        <>
          <Button variant="outline" onClick={fetchWarehouse} className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <RefreshCw className="h-4 w-4 mr-2" />
            Aggiorna
          </Button>
          <Button variant="outline" onClick={() => openPrintDocument('warehouse', 'snapshot')} className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <Printer className="h-4 w-4 mr-2" />
            Stampa Report
          </Button>
          <Button variant="outline" onClick={() => downloadPrintDocument('warehouse', 'snapshot')} className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <Download className="h-4 w-4 mr-2" />
            Scarica PDF
          </Button>
          <ExportButton data={exportData} columns={exportColumns} filename="magazzino" title="Magazzino" />
        </>
      }
    >
      <div className="space-y-6">

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-600">Articoli Tracciati</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">{stats.totalItems}</p>
                    </div>
                    <Package className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-600">Pezzi Totali</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">{Math.round(stats.totalStock)}</p>
                    </div>
                    <Warehouse className="h-8 w-8 text-indigo-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-600">Valore Magazzino</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(stats.totalValue)}</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.25 }}>
              <Card className={stats.lowStockCount > 0 ? 'border-orange-200 bg-orange-50/30' : ''}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-600">Sotto Scorta</p>
                      <p className={`mt-1 text-2xl font-bold ${stats.lowStockCount > 0 ? 'text-orange-600' : 'text-slate-900'}`}>{stats.lowStockCount}</p>
                    </div>
                    <AlertTriangle className={`h-8 w-8 ${stats.lowStockCount > 0 ? 'text-orange-500' : 'text-slate-400'}`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
              <Card className={stats.outOfStockCount > 0 ? 'border-red-200 bg-red-50/30' : ''}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase text-slate-600">Esauriti</p>
                      <p className={`mt-1 text-2xl font-bold ${stats.outOfStockCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>{stats.outOfStockCount}</p>
                    </div>
                    <XCircle className={`h-8 w-8 ${stats.outOfStockCount > 0 ? 'text-red-500' : 'text-slate-400'}`} />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Tabs: Giacenze + Movimenti */}
        <Tabs defaultValue="stock" className="space-y-4">
          <TabsList>
            <TabsTrigger value="stock">Giacenze</TabsTrigger>
            <TabsTrigger value="movements">Movimenti Recenti</TabsTrigger>
          </TabsList>

          <TabsContent value="stock" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                      <Input
                        placeholder="Cerca per nome, SKU, codice, barcode..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={stockFilter} onValueChange={setStockFilter}>
                    <SelectTrigger className="w-44">
                      <SelectValue placeholder="Filtro stock" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti</SelectItem>
                      <SelectItem value="lowStock">Sotto scorta</SelectItem>
                      <SelectItem value="outOfStock">Esauriti</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Stock Table */}
            <Card>
              <CardHeader>
                <CardTitle>Giacenze ({products.length})</CardTitle>
                <CardDescription>Situazione attuale del magazzino</CardDescription>
              </CardHeader>
              <CardContent>
                <ThemeTable theme="warehouse">
                  <TableHeader className={getThemeTableHeaderClassName('warehouse')}>
                    <TableRow>
                      <TableHead className={getThemeTableHeadClassName('warehouse', 'cursor-pointer')} onClick={() => handleSort('code')}>Codice</TableHead>
                      <TableHead className={getThemeTableHeadClassName('warehouse', 'cursor-pointer')} onClick={() => handleSort('name')}>
                        Prodotto {sortBy === 'name' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                      </TableHead>
                      <TableHead className={getThemeTableHeadClassName('warehouse')}>Categoria</TableHead>
                      <TableHead className={getThemeTableHeadClassName('warehouse')}>Ubicazione</TableHead>
                      <TableHead className={getThemeTableHeadClassName('warehouse', 'cursor-pointer text-right')} onClick={() => handleSort('stockQuantity')}>
                        Giacenza {sortBy === 'stockQuantity' && <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                      </TableHead>
                      <TableHead className={getThemeTableHeadClassName('warehouse', 'text-right')}>Min</TableHead>
                      <TableHead className={getThemeTableHeadClassName('warehouse', 'text-right')}>Max</TableHead>
                      <TableHead className={getThemeTableHeadClassName('warehouse')}>Stato</TableHead>
                      <TableHead className={getThemeTableHeadClassName('warehouse', 'text-right')}>Valore</TableHead>
                      <TableHead className={getThemeTableHeadClassName('warehouse', 'sticky right-0 z-10 min-w-[88px] bg-amber-50/95 text-right')}>Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product) => {
                      const status = getStockStatus(product)
                      const value = product.stockQuantity * (product.costPrice || product.unitPrice)
                      return (
                        <TableRow key={product.id} className={getThemeTableRowClassName('warehouse', undefined, 'transition-colors')}>
                          <TableCell className="font-mono text-sm text-slate-800">{product.code || product.sku || '-'}</TableCell>
                          <TableCell>
                            <div className="font-medium text-slate-900">{product.name}</div>
                            {product.barcode && <div className="text-xs text-slate-400">{product.barcode}</div>}
                          </TableCell>
                          <TableCell>
                            {product.category ? <span className={getThemeTableStatusBadgeClassName('warehouse', 'neutral')}>{product.category.name}</span> : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-slate-800">
                              {product.warehouseName && <div>{product.warehouseName}</div>}
                              {product.location && <div className="text-slate-500">{product.location}</div>}
                              {!product.warehouseName && !product.location && '-'}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-bold text-slate-900">
                            {product.stockQuantity} {product.unitOfMeasure}
                          </TableCell>
                          <TableCell className="text-right text-sm text-slate-500">{product.minStockLevel}</TableCell>
                          <TableCell className="text-right text-sm text-slate-500">{product.maxStockLevel ?? '-'}</TableCell>
                          <TableCell><span className={getThemeTableStatusBadgeClassName('warehouse', status.tone)}>{status.label}</span></TableCell>
                          <TableCell className="text-right font-semibold text-slate-900">{formatCurrency(value)}</TableCell>
                          <TableCell className={getThemeTableStickyCellClassName('warehouse', undefined, 'sticky right-0 z-10 min-w-[88px] text-right')}>
                            <Button variant="ghost" size="sm" className={getThemeTableActionButtonClassName('warehouse')} onClick={() => openAdjustment(product)} title="Rettifica giacenza">
                              <SlidersHorizontal className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                    {products.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-12">
                          <EmptyState
                            icon={Warehouse}
                            title="Nessun articolo a magazzino trovato"
                            description="Non ci sono articoli da mostrare con i filtri correnti."
                            className={getThemeTableEmptyStateClassName('warehouse')}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </ThemeTable>

                {totalPages > 1 && (
                  <div className="flex justify-center items-center space-x-2 mt-6">
                    <Button variant="outline" size="sm" className={getThemeTablePaginationButtonClassName('warehouse')} disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>Precedente</Button>
                    <span className="text-sm text-slate-600">Pagina {currentPage} di {totalPages}</span>
                    <Button variant="outline" size="sm" className={getThemeTablePaginationButtonClassName('warehouse')} disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>Successiva</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="movements">
            <Card>
              <CardHeader>
                <CardTitle>Movimenti Recenti</CardTitle>
                <CardDescription>Ultimi movimenti di magazzino registrati</CardDescription>
              </CardHeader>
              <CardContent>
                <ThemeTable theme="warehouse">
                  <TableHeader className={getThemeTableHeaderClassName('warehouse')}>
                    <TableRow>
                      <TableHead className={getThemeTableHeadClassName('warehouse')}>Data</TableHead>
                      <TableHead className={getThemeTableHeadClassName('warehouse')}>Prodotto</TableHead>
                      <TableHead className={getThemeTableHeadClassName('warehouse')}>Tipo</TableHead>
                      <TableHead className={getThemeTableHeadClassName('warehouse', 'text-right')}>Quantità</TableHead>
                      <TableHead className={getThemeTableHeadClassName('warehouse')}>Riferimento</TableHead>
                      <TableHead className={getThemeTableHeadClassName('warehouse')}>Note</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((mov) => (
                      <TableRow key={mov.id} className={getThemeTableRowClassName('warehouse')}>
                        <TableCell className="text-sm text-slate-800">{formatDate(mov.movementDate)}</TableCell>
                        <TableCell>
                          <div className="font-medium text-slate-900">{mov.product?.name || 'N/A'}</div>
                          {mov.product?.sku && <div className="text-xs text-slate-500">{mov.product.sku}</div>}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            {mov.movementType === 'IN' ? (
                              <ArrowDownRight className="h-4 w-4 text-green-500" />
                            ) : (
                              <ArrowUpRight className="h-4 w-4 text-red-500" />
                            )}
                            {getMovementBadge(mov.movementType)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-900">
                          {mov.movementType === 'IN' ? '+' : '-'}{mov.quantity}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">{mov.reference || '-'}</TableCell>
                        <TableCell className="text-sm text-slate-500 max-w-[200px] truncate">{mov.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                    {movements.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <EmptyState
                            icon={RefreshCw}
                            title="Nessun movimento registrato"
                            description="Non ci sono movimenti recenti da mostrare."
                            className={getThemeTableEmptyStateClassName('warehouse')}
                          />
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </ThemeTable>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Stock Adjustment Dialog */}
        <Dialog open={showAdjustment} onOpenChange={setShowAdjustment}>
          <DialogContent className={getPopupDialogContentClassName("max-w-md")}>
            <PopupHeader
              theme="warehouse"
              title="Movimento Magazzino"
              description={adjProduct ? `Prodotto: ${adjProduct.name} — Giacenza attuale: ${adjProduct.stockQuantity} ${adjProduct.unitOfMeasure}` : 'Registra una variazione di stock'}
            />
            <div className="space-y-4 p-6">
              <div>
                <Label>Tipo Movimento</Label>
                <Select value={adjType} onValueChange={(v) => setAdjType(v as 'IN' | 'OUT' | 'ADJUSTMENT')}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN">Carico (+)</SelectItem>
                    <SelectItem value="OUT">Scarico (-)</SelectItem>
                    <SelectItem value="ADJUSTMENT">Rettifica (= valore esatto)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{adjType === 'ADJUSTMENT' ? 'Nuova Giacenza' : 'Quantità'}</Label>
                <Input
                  type="number"
                  value={adjQty}
                  onChange={(e) => setAdjQty(parseFloat(e.target.value) || 0)}
                  min="0"
                  step="1"
                />
              </div>
              <div>
                <Label>Note / Causale</Label>
                <Textarea
                  value={adjNotes}
                  onChange={(e) => setAdjNotes(e.target.value)}
                  placeholder="Es: inventario fisico, reso cliente, danno merce..."
                  rows={2}
                />
              </div>
              <div className="flex justify-end space-x-3 pt-2">
                <Button variant="outline" onClick={() => setShowAdjustment(false)}>Annulla</Button>
                <Button onClick={handleAdjustStock} disabled={adjLoading} className={getPopupPrimaryButtonClassName('warehouse')}>
                  {adjLoading ? 'Salvataggio...' : 'Conferma Rettifica'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageShell>
  )
}

