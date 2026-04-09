"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Upload, 
  Edit, 
  Trash2, 
  Eye, 
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  MoreHorizontal,
  Star,
  BarChart3,
  DollarSign,
  Box,
  Tag,
  Settings,
  RefreshCw,
  Warehouse,
  ShoppingCart,
  Zap
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ThemeTable, getThemeTableActionButtonClassName, getThemeTableEmptyStateActionClassName, getThemeTableEmptyStateClassName, getThemeTableHeadClassName, getThemeTableHeaderClassName, getThemeTableRowClassName, getThemeTableStickyCellClassName } from '@/components/ui/theme-table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { useToast } from "@/hooks/use-toast"
import { ProductForm } from '@/components/forms/product-form'
import { CsvImportDialog } from '@/components/ui/csv-import-dialog'
import { getPopupDialogContentClassName, getPopupPrimaryButtonClassName } from '@/components/layout/module-theme'
import { PageShell, PageShellLoading } from '@/components/layout/page-shell'
import { PopupHeader } from '@/components/ui/popup-header'

interface ProductCategoryRef {
  id?: string
  name: string
}

interface ProductSupplierRef {
  id?: string
  name: string
}

interface Product {
  id: string
  code?: string
  barcode?: string
  name: string
  sku?: string
  description?: string
  brand?: string
  size?: string
  color?: string
  unitOfMeasure: string
  warehouseName?: string
  location?: string
  unitPrice: number
  costPrice?: number
  retailPrice?: number
  stockQuantity: number
  minStockLevel: number
  maxStockLevel?: number
  reorderPoint?: number
  reorderQty?: number
  trackStock: boolean
  taxRate: number
  markupRate: number
  status: string
  category?: ProductCategoryRef | null
  categoryName?: string
  supplier?: ProductSupplierRef | null
  supplierName?: string
  tags: string[]
  soldCount: number
  revenue: number
  viewCount: number
  createdAt: string
  updatedAt: string
}

interface ProductStatsEntry {
  id: string
  name: string
  revenue: number
  soldCount: number
  sku?: string
  status?: string
  stockQuantity?: number
  minStockLevel?: number
  createdAt?: string
}

interface ProductStats {
  totalProducts: number
  activeProducts: number
  lowStockProducts: number
  totalStockValue: number
  averagePrice: number
  topProducts: ProductStatsEntry[]
  categoryDistribution: Record<string, { count: number; value: number }>
  stockAlerts: ProductStatsEntry[]
  recentProducts: ProductStatsEntry[]
}

export default function ProductsPage() {
  const { toast } = useToast()
  const [products, setProducts] = useState<Product[]>([])
  const [stats, setStats] = useState<ProductStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showProductDetails, setShowProductDetails] = useState(false)
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  const handleCreateProduct = () => { setEditingProduct(null); setShowForm(true) }
  const handleEditProduct = (p: Product) => { setEditingProduct(p); setShowForm(true) }
  const handleFormSuccess = () => { setShowForm(false); setEditingProduct(null); fetchProducts(); fetchStats() }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo prodotto?')) return
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      const result = await res.json()
      if (result.success) {
        toast({ title: "Prodotto eliminato", description: "Prodotto rimosso con successo" })
        setShowProductDetails(false)
        setSelectedProduct(null)
        fetchProducts(); fetchStats()
      } else {
        toast({ title: "Errore", description: result.error || 'Errore eliminazione', variant: "destructive" })
      }
    } catch {
      toast({ title: "Errore", description: "Errore di rete", variant: "destructive" })
    }
  }

  const isLowStockProduct = (product: Product) => product.trackStock && product.stockQuantity <= product.minStockLevel

  const handleCreateSupplierOrder = async (product: Product) => {
    if (!product.supplier?.id) {
      toast({
        title: 'Fornitore mancante',
        description: 'Assegna un fornitore al prodotto prima di creare un ordine di riordino.',
        variant: 'destructive'
      })
      return
    }

    const reorderQty = product.reorderQty && product.reorderQty > 0
      ? product.reorderQty
      : Math.max(product.minStockLevel - product.stockQuantity, 1)

    if (!confirm(`Creare un ordine fornitore per ${product.name} con quantità ${reorderQty} ${product.unitOfMeasure}?`)) return

    try {
      const response = await fetch('/api/supplier-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId: product.supplier.id,
          notes: `Riordino automatico da scorta bassa per ${product.name}`,
          items: [
            {
              productId: product.id,
              description: product.name,
              quantity: reorderQty,
              unit: product.unitOfMeasure,
              unitPrice: product.costPrice || product.unitPrice,
              taxRate: product.taxRate,
              notes: `Stock attuale: ${product.stockQuantity} • soglia minima: ${product.minStockLevel}`
            }
          ]
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Errore durante la creazione dell\'ordine fornitore')
      }

      toast({
        title: 'Ordine fornitore creato',
        description: `${result.data.number} creato per ${product.supplier.name}.`
      })

      fetchProducts()
      fetchStats()
    } catch (error) {
      toast({
        title: 'Errore ordine fornitore',
        description: error instanceof Error ? error.message : 'Impossibile creare l\'ordine fornitore',
        variant: 'destructive'
      })
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchStats()
  }, [searchQuery, selectedStatus, selectedCategory, sortBy, sortOrder, currentPage, showLowStockOnly])

  const parseTags = (tags: unknown): string[] => {
    if (Array.isArray(tags)) {
      return tags.filter((tag): tag is string => typeof tag === 'string')
    }

    if (typeof tags === 'string' && tags.length > 0) {
      try {
        const parsed = JSON.parse(tags)
        return Array.isArray(parsed)
          ? parsed.filter((tag): tag is string => typeof tag === 'string')
          : []
      } catch {
        return []
      }
    }

    return []
  }

  const normalizeProduct = (product: any): Product => {
    const categoryName = product.category?.name || product.categoryName || undefined
    const supplierName = product.supplier?.name || product.supplierName || undefined

    return {
      id: product.id,
      code: product.code || undefined,
      barcode: product.barcode || undefined,
      name: product.name,
      sku: product.sku || undefined,
      description: product.description || undefined,
      brand: product.brand || undefined,
      unitOfMeasure: product.unitOfMeasure || 'pz',
      warehouseName: product.warehouseName || undefined,
      location: product.location || undefined,
      unitPrice: Number(product.unitPrice || 0),
      costPrice: typeof product.costPrice === 'number' ? product.costPrice : undefined,
      retailPrice: typeof product.retailPrice === 'number' ? product.retailPrice : undefined,
      stockQuantity: Number(product.stockQuantity || 0),
      minStockLevel: Number(product.minStockLevel || 0),
      maxStockLevel: typeof product.maxStockLevel === 'number' ? product.maxStockLevel : undefined,
      reorderPoint: typeof product.reorderPoint === 'number' ? product.reorderPoint : undefined,
      reorderQty: typeof product.reorderQty === 'number' ? product.reorderQty : undefined,
      trackStock: Boolean(product.trackStock),
      taxRate: Number(product.taxRate || 0),
      markupRate: Number(product.markupRate || 0),
      status: product.status || 'ACTIVE',
      category: product.category
        ? {
            id: product.category.id || undefined,
            name: product.category.name
          }
        : categoryName
          ? { name: categoryName }
          : null,
      categoryName,
      supplier: product.supplier
        ? {
            id: product.supplier.id || undefined,
            name: product.supplier.name
          }
        : supplierName
          ? { name: supplierName }
          : null,
      supplierName,
      tags: parseTags(product.tags),
      soldCount: Number(product.soldCount || 0),
      revenue: Number(product.revenue || 0),
      viewCount: Number(product.viewCount || 0),
      createdAt: typeof product.createdAt === 'string' ? product.createdAt : new Date(product.createdAt).toISOString(),
      updatedAt: typeof product.updatedAt === 'string' ? product.updatedAt : new Date(product.updatedAt).toISOString()
    }
  }

  const normalizeStatsEntry = (entry: any): ProductStatsEntry => ({
    id: entry.id,
    name: entry.name,
    revenue: Number(entry.revenue || 0),
    soldCount: Number(entry.soldCount || 0),
    sku: entry.sku || undefined,
    status: entry.status || undefined,
    stockQuantity: typeof entry.stockQuantity === 'number' ? entry.stockQuantity : undefined,
    minStockLevel: typeof entry.minStockLevel === 'number' ? entry.minStockLevel : undefined,
    createdAt: entry.createdAt
      ? typeof entry.createdAt === 'string'
        ? entry.createdAt
        : new Date(entry.createdAt).toISOString()
      : undefined
  })

  const normalizeStats = (data: any): ProductStats => ({
    totalProducts: Number(data.totalProducts || 0),
    activeProducts: Number(data.activeProducts || 0),
    lowStockProducts: Number(data.lowStockProducts || 0),
    totalStockValue: Number(data.totalStockValue || 0),
    averagePrice: Number(data.averagePrice || 0),
    topProducts: Array.isArray(data.topProducts) ? data.topProducts.map(normalizeStatsEntry) : [],
    categoryDistribution: data.categoryDistribution || {},
    stockAlerts: Array.isArray(data.stockAlerts) ? data.stockAlerts.map(normalizeStatsEntry) : [],
    recentProducts: Array.isArray(data.recentProducts) ? data.recentProducts.map(normalizeStatsEntry) : []
  })

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search: searchQuery,
        status: selectedStatus !== 'all' ? selectedStatus : '',
        category: selectedCategory !== 'all' ? selectedCategory : '',
        sortBy,
        sortOrder,
        page: currentPage.toString(),
        limit: '500',
        lowStock: showLowStockOnly.toString()
      })

      const response = await fetch(`/api/products?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setProducts(Array.isArray(result.data.products) ? result.data.products.map(normalizeProduct) : [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/products/stats')
      const result = await response.json()
      
      if (result.success) {
        setStats(normalizeStats(result.data))
      }
    } catch (error) {
      console.error('Error fetching product stats:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { label: 'Attivo', variant: 'default' as const },
      INACTIVE: { label: 'Inattivo', variant: 'secondary' as const },
      DISCONTINUED: { label: 'Fuori Produzione', variant: 'outline' as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ACTIVE
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getStockStatus = (product: Product) => {
    if (!product.trackStock) return { status: 'NOT_TRACKED', color: 'text-slate-500', icon: Settings }
    
    if (product.stockQuantity === 0) return { status: 'OUT_OF_STOCK', color: 'text-red-600', icon: AlertTriangle }
    if (product.stockQuantity <= product.minStockLevel) return { status: 'LOW_STOCK', color: 'text-orange-600', icon: AlertTriangle }
    if (product.maxStockLevel && product.stockQuantity >= product.maxStockLevel) return { status: 'OVERSTOCK', color: 'text-blue-600', icon: Package }
    return { status: 'IN_STOCK', color: 'text-green-600', icon: CheckCircle }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT')
  }

  const getProfitMargin = (product: Product) => {
    if (!product.costPrice || product.costPrice === 0) return 0
    return ((product.unitPrice - product.costPrice) / product.unitPrice) * 100
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product)
    setShowProductDetails(true)
  }

  const filteredProducts = products.filter(product => {
    const normalizedSearch = searchQuery.trim().toLowerCase()
    const searchableValues = [
      product.name,
      product.sku,
      product.code,
      product.barcode,
      product.description,
      product.categoryName,
      product.supplierName,
      product.brand
    ].filter((value): value is string => Boolean(value))

    const matchesSearch = normalizedSearch.length === 0 || searchableValues.some((value) =>
      value.toLowerCase().includes(normalizedSearch)
    )
    
    const matchesStatus = selectedStatus === 'all' || product.status === selectedStatus
    const matchesCategory = selectedCategory === 'all' || product.categoryName === selectedCategory
    const matchesLowStock = !showLowStockOnly || product.stockQuantity <= product.minStockLevel
    
    return matchesSearch && matchesStatus && matchesCategory && matchesLowStock
  })

  const sortedProducts = [...filteredProducts].sort((leftProduct, rightProduct) => {
    const direction = sortOrder === 'asc' ? 1 : -1

    switch (sortBy) {
      case 'name':
        return leftProduct.name.localeCompare(rightProduct.name) * direction
      case 'unitPrice':
        return (leftProduct.unitPrice - rightProduct.unitPrice) * direction
      case 'stockQuantity':
        return (leftProduct.stockQuantity - rightProduct.stockQuantity) * direction
      case 'revenue':
        return (leftProduct.revenue - rightProduct.revenue) * direction
      case 'soldCount':
        return (leftProduct.soldCount - rightProduct.soldCount) * direction
      case 'category':
        return (leftProduct.categoryName || '').localeCompare(rightProduct.categoryName || '') * direction
      default:
        return leftProduct.name.localeCompare(rightProduct.name) * direction
    }
  })

  const availableCategories = Array.from(
    new Set(products.map((product) => product.categoryName).filter((category): category is string => Boolean(category)))
  ).sort((leftCategory, rightCategory) => leftCategory.localeCompare(rightCategory))

  const productStats: ProductStats = stats ?? {
    totalProducts: 0,
    activeProducts: 0,
    lowStockProducts: 0,
    totalStockValue: 0,
    averagePrice: 0,
    topProducts: [],
    categoryDistribution: {},
    stockAlerts: [],
    recentProducts: []
  }

  return (
    <PageShell
      title="Prodotti"
      description="Gestione completa catalogo prodotti"
      icon={Package}
      theme="products"
      actions={
        <>
          <Button variant="outline" size="sm" onClick={fetchProducts} className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <RefreshCw className="h-4 w-4 mr-1.5" />Aggiorna
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowImport(true)} className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <Upload className="h-4 w-4 mr-1.5" />Importa
          </Button>
          <Button size="sm" onClick={handleCreateProduct} className="border border-amber-400/40 bg-amber-500 text-white hover:bg-amber-600 font-semibold shadow-[0_14px_30px_-18px_rgba(245,158,11,0.75)]">
            <Plus className="h-4 w-4 mr-1.5" />Nuovo Prodotto
          </Button>
        </>
      }
    >
      <div className="space-y-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="kpi-surface">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Prodotti Totali</p>
                      <p className="metric-value mt-1 text-2xl font-bold text-slate-900">{productStats.totalProducts}</p>
                      <p className="mt-1 text-xs text-slate-500">{productStats.activeProducts} attivi</p>
                    </div>
                    <div className="p-3 rounded-xl bg-amber-100">
                      <Package className="h-6 w-6 text-amber-600" />
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
              <Card className="kpi-surface">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Valore Magazzino</p>
                      <p className="metric-value mt-1 text-2xl font-bold text-slate-900">{formatCurrency(productStats.totalStockValue)}</p>
                      <p className="mt-1 text-xs text-slate-500">Media: {formatCurrency(productStats.averagePrice)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-100">
                      <DollarSign className="h-6 w-6 text-emerald-600" />
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
              <Card className="kpi-surface">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Scorte Basse</p>
                      <p className="metric-value mt-1 text-2xl font-bold text-slate-900">{productStats.lowStockProducts}</p>
                      <p className="mt-1 text-xs text-slate-500">Da riordinare</p>
                    </div>
                    <div className="p-3 rounded-xl bg-orange-100">
                      <AlertTriangle className="h-6 w-6 text-orange-600" />
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
              <Card className="kpi-surface">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Top Product</p>
                      <p className="mt-1 truncate text-2xl font-bold text-slate-900">{productStats.topProducts[0]?.name || 'N/A'}</p>
                      <p className="mt-1 text-xs text-slate-500">{productStats.topProducts[0] ? formatCurrency(productStats.topProducts[0].revenue) : '€0'}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-100">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Cerca prodotti..."
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
                    <SelectItem value="ACTIVE">Attivi</SelectItem>
                    <SelectItem value="INACTIVE">Inattivi</SelectItem>
                    <SelectItem value="DISCONTINUED">Discontinuati</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le categorie</SelectItem>
                    {availableCategories.map((category) => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button 
                  variant={showLowStockOnly ? "default" : "outline"}
                  onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Scorte Basse
                </Button>

                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtri
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Catalogo Prodotti ({sortedProducts.length})</CardTitle>
            <CardDescription>
              Gestione completa prodotti con magazzino e analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && products.length === 0 ? (
              <PageShellLoading label="Caricamento prodotti..." theme="products" />
            ) : (
            <ThemeTable theme="products">
              <TableHeader className={getThemeTableHeaderClassName('products')}>
                <TableRow>
                  <TableHead 
                    className={getThemeTableHeadClassName('products', 'cursor-pointer')}
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Prodotto
                      {sortBy === 'name' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className={getThemeTableHeadClassName('products')}>SKU</TableHead>
                  <TableHead className={getThemeTableHeadClassName('products')}>Stato</TableHead>
                  <TableHead 
                    className={getThemeTableHeadClassName('products', 'cursor-pointer')}
                    onClick={() => handleSort('unitPrice')}
                  >
                    <div className="flex items-center">
                      Prezzo
                      {sortBy === 'unitPrice' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className={getThemeTableHeadClassName('products')}>Magazzino</TableHead>
                  <TableHead className={getThemeTableHeadClassName('products')}>Vendite</TableHead>
                  <TableHead className={getThemeTableHeadClassName('products')}>Fatturato</TableHead>
                  <TableHead className={getThemeTableHeadClassName('products', 'sticky right-0 z-10 min-w-[88px] bg-orange-50/95 text-right')}>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedProducts.map((product) => {
                  const stockStatus = getStockStatus(product)
                  const profitMargin = getProfitMargin(product)
                  const isLowStock = isLowStockProduct(product)
                  
                  return (
                    <TableRow 
                      key={product.id}
                      className={getThemeTableRowClassName('products', undefined, 'cursor-pointer')}
                      onClick={() => handleProductClick(product)}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <Package className="h-8 w-8 text-orange-400" />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900">{product.name}</div>
                            {product.description && (
                              <div className="max-w-xs truncate text-sm text-slate-600">
                                {product.description}
                              </div>
                            )}
                            {([product.categoryName, product.supplierName && `Forn. ${product.supplierName}`].filter(Boolean).join(' • ')) && (
                              <div className="text-sm text-slate-500">
                                {[product.categoryName, product.supplierName && `Forn. ${product.supplierName}`].filter(Boolean).join(' • ')}
                              </div>
                            )}
                            {product.tags && product.tags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {product.tags.slice(0, 2).map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                                {product.tags.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{product.tags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="rounded bg-slate-100 px-2 py-1 text-sm font-semibold text-slate-800">
                          {product.sku || product.code || product.barcode || 'N/A'}
                        </code>
                      </TableCell>
                      <TableCell>{getStatusBadge(product.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-semibold text-slate-900">{formatCurrency(product.unitPrice)}</div>
                          {product.costPrice && (
                            <div className="text-slate-500">
                              Margine: {profitMargin.toFixed(1)}%
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className={`flex items-center ${stockStatus.color}`}>
                            <stockStatus.icon className="h-3 w-3 mr-1" />
                            {product.trackStock ? `${product.stockQuantity} ${product.unitOfMeasure}` : 'Non gestito'}
                          </div>
                          {product.trackStock && (
                            <div className="text-slate-500">
                              Min: {product.minStockLevel} {product.unitOfMeasure}
                            </div>
                          )}
                          {isLowStock && (
                            <Badge className="mt-2 bg-red-100 text-red-700 hover:bg-red-100">
                              Scorta Bassa
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-semibold text-slate-900">{product.soldCount}</div>
                          <div className="text-slate-500">
                            {product.supplierName ? `Fornitore: ${product.supplierName}` : product.warehouseName ? `Mag.: ${product.warehouseName}` : 'Nessun fornitore'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-semibold text-slate-900">{formatCurrency(product.revenue)}</div>
                          <div className="text-slate-500">
                            {product.soldCount > 0 ? formatCurrency(product.revenue / product.soldCount) : '€0'} media
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className={getThemeTableStickyCellClassName('products', undefined, 'sticky right-0 z-10 min-w-[88px] text-right')}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className={getThemeTableActionButtonClassName('products')}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedProduct(product); setShowProductDetails(true) }}>
                              <Eye className="h-4 w-4 mr-2" />
                              Dettagli
                            </DropdownMenuItem>
                            {isLowStock && (
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCreateSupplierOrder(product) }}>
                                <ShoppingCart className="h-4 w-4 mr-2" />
                                Crea Ordine Fornitore
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditProduct(product) }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Modifica
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); handleDeleteProduct(product.id) }}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Elimina
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {sortedProducts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8">
                      <EmptyState
                        icon={Package}
                        title="Nessun dato trovato"
                        description="Non ci sono prodotti da mostrare con i filtri correnti."
                        actionLabel="Crea il primo Prodotto"
                        onAction={handleCreateProduct}
                        className={getThemeTableEmptyStateClassName('products')}
                        actionClassName={getThemeTableEmptyStateActionClassName('products')}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </ThemeTable>
            )}
          </CardContent>
        </Card>

        {/* Product Details Dialog */}
        <Dialog open={showProductDetails} onOpenChange={setShowProductDetails}>
          <DialogContent className={getPopupDialogContentClassName("max-w-4xl max-h-[90vh] overflow-y-auto")}>
            <PopupHeader
              theme="products"
              title="Dettagli Prodotto"
              description="Informazioni complete e analytics del prodotto"
            />
            
            {selectedProduct && (
              <div className="space-y-6 p-6 [&_label]:text-sm [&_label]:font-semibold [&_label]:text-slate-600 [&_p]:text-slate-900">
                {/* Product Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informazioni Generali</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-slate-600">Nome</label>
                        <p className="font-medium">{selectedProduct.name}</p>
                      </div>
                      
                      {selectedProduct.sku && (
                        <div>
                          <label className="text-sm font-medium text-slate-600">SKU</label>
                          <p><code>{selectedProduct.sku}</code></p>
                        </div>
                      )}
                      
                      {selectedProduct.description && (
                        <div>
                          <label className="text-sm font-medium text-slate-600">Descrizione</label>
                          <p>{selectedProduct.description}</p>
                        </div>
                      )}

                      {selectedProduct.categoryName && (
                        <div>
                          <label className="text-sm font-medium text-slate-600">Categoria</label>
                          <p>{selectedProduct.categoryName}</p>
                        </div>
                      )}

                      {selectedProduct.supplierName && (
                        <div>
                          <label className="text-sm font-medium text-slate-600">Fornitore</label>
                          <p>{selectedProduct.supplierName}</p>
                        </div>
                      )}

                      {selectedProduct.brand && (
                        <div>
                          <label className="text-sm font-medium text-slate-600">Brand</label>
                          <p>{selectedProduct.brand}</p>
                        </div>
                      )}
                      {selectedProduct.size && (
                        <div>
                          <label className="text-sm font-medium text-slate-600">Taglia / Misura</label>
                          <p>{selectedProduct.size}</p>
                        </div>
                      )}
                      {selectedProduct.color && (
                        <div>
                          <label className="text-sm font-medium text-slate-600">Colore</label>
                          <p>{selectedProduct.color}</p>
                        </div>
                      )}

                      {(selectedProduct.code || selectedProduct.barcode) && (
                        <div>
                          <label className="text-sm font-medium text-slate-600">Codifiche</label>
                          <p>{[selectedProduct.code && `Cod. ${selectedProduct.code}`, selectedProduct.barcode && `Barcode ${selectedProduct.barcode}`].filter(Boolean).join(' • ')}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4">
                        <div>
                          <label className="text-sm font-medium text-slate-600">Stato</label>
                          <div>{getStatusBadge(selectedProduct.status)}</div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">Tracking Stock</label>
                          <div className="flex items-center">
                            {selectedProduct.trackStock ? (
                              <><CheckCircle className="h-4 w-4 text-green-600 mr-1" /> Sì</>
                            ) : (
                              <><Settings className="h-4 w-4 text-slate-600 mr-1" /> No</>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-slate-600">Unità di Misura</label>
                          <p>{selectedProduct.unitOfMeasure}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">Magazzino</label>
                          <p>{selectedProduct.warehouseName || 'Principale'}</p>
                        </div>
                      </div>

                      {selectedProduct.location && (
                        <div>
                          <label className="text-sm font-medium text-slate-600">Ubicazione</label>
                          <p>{selectedProduct.location}</p>
                        </div>
                      )}
                      
                      <div>
                        <label className="text-sm font-medium text-slate-600">Tags</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {selectedProduct.tags && selectedProduct.tags.map((tag, index) => (
                            <Badge key={index} variant="outline">{tag}</Badge>
                          ))}
                          {selectedProduct.tags.length === 0 && (
                            <span className="text-sm text-slate-500">Nessun tag</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Statistiche e Prezzi</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-slate-600">Prezzo Unitario</label>
                          <p className="text-lg font-bold text-blue-600">
                            {formatCurrency(selectedProduct.unitPrice)}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">Costo</label>
                          <p className="text-lg font-bold">
                            {selectedProduct.costPrice ? formatCurrency(selectedProduct.costPrice) : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">Margine</label>
                          <p className="text-lg font-bold text-green-600">
                            {getProfitMargin(selectedProduct).toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">IVA</label>
                          <p className="text-lg font-bold">{selectedProduct.taxRate}%</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-slate-600">Unità Vendute</label>
                          <p className="text-lg font-bold">{selectedProduct.soldCount}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">Markup</label>
                          <p className="text-lg font-bold">{selectedProduct.markupRate.toFixed(1)}%</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">Fatturato Totale</label>
                          <p className="text-lg font-bold text-purple-600">
                            {formatCurrency(selectedProduct.revenue)}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">Media Vendita</label>
                          <p className="text-lg font-bold">
                            {selectedProduct.soldCount > 0 ? formatCurrency(selectedProduct.revenue / selectedProduct.soldCount) : '€0'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Stock Management */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Gestione Magazzino</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="text-sm font-medium text-slate-600">Giacenza Attuale</label>
                        <div className="flex items-center mt-1">
                          <span className="text-2xl font-bold">{selectedProduct.stockQuantity}</span>
                          <span className="ml-2 text-slate-500">{selectedProduct.unitOfMeasure}</span>
                        </div>
                        {selectedProduct.trackStock && (
                          <Progress 
                            value={selectedProduct.minStockLevel > 0 ? Math.min((selectedProduct.stockQuantity / selectedProduct.minStockLevel) * 100, 100) : 0} 
                            className="mt-2"
                          />
                        )}
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-slate-600">Livello Minimo</label>
                        <div className="flex items-center mt-1">
                          <span className="text-2xl font-bold">{selectedProduct.minStockLevel}</span>
                          <span className="ml-2 text-slate-500">{selectedProduct.unitOfMeasure}</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-slate-600">Valore Giacenza</label>
                        <div className="flex items-center mt-1">
                          <span className="text-2xl font-bold text-green-600">
                            {formatCurrency(selectedProduct.stockQuantity * selectedProduct.unitPrice)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {isLowStockProduct(selectedProduct) && (
                      <div className="mt-6 rounded-xl border border-orange-200 bg-orange-50 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-orange-800">Scorta sotto soglia minima</p>
                            <p className="text-sm text-orange-700 mt-1">
                              Stock attuale {selectedProduct.stockQuantity} {selectedProduct.unitOfMeasure} • soglia minima {selectedProduct.minStockLevel} {selectedProduct.unitOfMeasure}
                            </p>
                          </div>
                          <Button onClick={() => handleCreateSupplierOrder(selectedProduct)} className="bg-orange-600 hover:bg-orange-700 text-white">
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            Crea Ordine Fornitore
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-end space-x-4 mt-6">
                      <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => selectedProduct && handleDeleteProduct(selectedProduct.id)}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Elimina
                      </Button>
                      <Button className={getPopupPrimaryButtonClassName('products')} onClick={() => { setShowProductDetails(false); selectedProduct && handleEditProduct(selectedProduct) }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Modifica
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <ProductForm
          open={showForm}
          onClose={() => setShowForm(false)}
          onSuccess={handleFormSuccess}
          product={editingProduct}
        />
        <CsvImportDialog
          open={showImport}
          onClose={() => setShowImport(false)}
          onSuccess={fetchProducts}
          apiUrl="/api/products"
          entityName="Prodotti"
          theme="products"
          columns={[
            { key: 'name', label: 'Nome', required: true },
            { key: 'sku', label: 'SKU' },
            { key: 'code', label: 'Codice' },
            { key: 'unitPrice', label: 'Prezzo Vendita', required: true },
            { key: 'costPrice', label: 'Prezzo Acquisto' },
            { key: 'stockQuantity', label: 'Quantità Magazzino' },
            { key: 'unitOfMeasure', label: 'Unità Misura' },
            { key: 'brand', label: 'Marca' },
            { key: 'description', label: 'Descrizione' },
          ]}
          sampleRows={[{ name: 'Prodotto Esempio', sku: 'SKU001', code: 'COD001', unitPrice: '29.99', costPrice: '15.00', stockQuantity: '100', unitOfMeasure: 'pz', brand: 'Marca', description: 'Descrizione prodotto' }]}
        />
      </div>
    </PageShell>
  )
}

