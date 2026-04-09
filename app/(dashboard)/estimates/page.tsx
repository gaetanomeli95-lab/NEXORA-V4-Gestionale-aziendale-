"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, Plus, Filter, Download, Edit, Trash2, Eye, ClipboardList, Calculator,
  Send, CheckCircle, XCircle, Clock, AlertTriangle, MoreHorizontal,
  Calendar, DollarSign, User, RefreshCw, FileText, Printer, Copy,
  Receipt, Truck, CreditCard, Package, FileCheck,
  CheckSquare, XSquare, FileSpreadsheet, RotateCcw
} from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ThemeTable, getThemeTableActionButtonClassName, getThemeTableEmptyStateActionClassName, getThemeTableEmptyStateClassName, getThemeTableHeadClassName, getThemeTableHeaderClassName, getThemeTableRowClassName, getThemeTableStatusBadgeClassName, getThemeTableStickyCellClassName } from '@/components/ui/theme-table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { EstimateForm } from '@/components/forms/estimate-form'
import { getPopupDialogContentClassName, getPopupPrimaryButtonClassName } from '@/components/layout/module-theme'
import { downloadPrintDocument, openPrintDocument } from '@/lib/print-url'
import { formatDateTime } from '@/lib/utils'
import { PageShell, PageShellLoading } from '@/components/layout/page-shell'
import { PopupHeader } from '@/components/ui/popup-header'

interface EstimateCustomer {
  id: string
  name: string
  email?: string
  phone?: string
  vatNumber?: string
}

interface EstimateItem {
  id: string
  productId?: string
  product?: { id: string; name: string; sku?: string } | null
  code?: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
  discount: number
  taxRate: number
  vatRate: number
  taxAmount: number
  sortOrder: number
  notes?: string
}

interface EstimatePayment {
  id: string
  amount: number
  paymentDate: string
  method: string
  status: string
}

interface Estimate {
  id: string
  number: string
  customerId: string
  customer: EstimateCustomer
  issueDate: string
  dueDate?: string
  deliveryDate?: string
  status: string
  paymentStatus: string
  stockStatus: string
  invoiceStatus: string
  returnStatus: string
  subtotal: number
  taxAmount: number
  totalAmount: number
  discountAmount: number
  depositAmount: number
  paidAmount: number
  balanceAmount: number
  paymentMethod?: string
  notes?: string
  internalNotes?: string
  items: EstimateItem[]
  payments: EstimatePayment[]
  createdAt: string
  updatedAt: string
}

interface EstimateStats {
  totalEstimates: number
  byStatus: Record<string, number>
  totalValue: number
  totalPaid: number
  totalBalance: number
  averageValue: number
  recentEstimates: Array<Estimate>
  unpaidEstimates: Array<Estimate>
}

const ESTIMATE_DELIVERY_ADDRESS_MARKER = '[[DELIVERY_ADDRESS]]:'

const getVisibleEstimateInternalNotes = (value?: string) => {
  if (!value) return ''

  return value
    .split('\n')
    .filter((line) => !line.startsWith(ESTIMATE_DELIVERY_ADDRESS_MARKER))
    .join('\n')
    .trim()
}

export default function EstimatesPage() {
  const { toast } = useToast()
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [stats, setStats] = useState<EstimateStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all')
  const [sortBy, setSortBy] = useState('issueDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedEstimate, setSelectedEstimate] = useState<Estimate | null>(null)
  const [activeEstimate, setActiveEstimate] = useState<Estimate | null>(null) // toolbar selection
  const [showDetails, setShowDetails] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingEstimate, setEditingEstimate] = useState<Estimate | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)

  useEffect(() => {
    fetchEstimates()
    fetchStats()
  }, [searchQuery, selectedStatus, selectedPaymentStatus, sortBy, sortOrder, currentPage])

  const fetchEstimates = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search: searchQuery,
        status: selectedStatus !== 'all' ? selectedStatus : '',
        paymentStatus: selectedPaymentStatus !== 'all' ? selectedPaymentStatus : '',
        sortBy,
        sortOrder,
        page: currentPage.toString(),
        limit: '500'
      })

      const response = await fetch(`/api/estimates?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setEstimates(result.data.estimates || [])
      }
    } catch (error) {
      console.error('Error fetching estimates:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/estimates/stats')
      const result = await response.json()
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error fetching estimate stats:', error)
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

  const visibleInternalNotes = getVisibleEstimateInternalNotes(selectedEstimate?.internalNotes)

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; tone: 'primary' | 'neutral' | 'warning' | 'danger' }> = {
      DRAFT: { label: 'Bozza', tone: 'neutral' },
      SENT: { label: 'Inviato', tone: 'primary' },
      ACCEPTED: { label: 'Accettato', tone: 'primary' },
      DELIVERED: { label: 'Consegnato', tone: 'primary' },
      REJECTED: { label: 'Rifiutato', tone: 'danger' },
      EXPIRED: { label: 'Scaduto', tone: 'warning' }
    }
    const c = config[status] || { label: status, tone: 'neutral' as const }
    return <span className={getThemeTableStatusBadgeClassName('estimates', c.tone)}>{c.label}</span>
  }

  const getPaymentStatusBadge = (status: string) => {
    const config: Record<string, { label: string; tone: 'primary' | 'warning' | 'success' | 'danger' }> = {
      'NON PAGATO': { label: 'Non pagato', tone: 'danger' },
      'PARZIALMENTE PAGATO': { label: 'Parziale', tone: 'warning' },
      'PAGATO': { label: 'Pagato', tone: 'success' }
    }
    const c = config[status] || { label: status, tone: 'neutral' as const }
    return <span className={getThemeTableStatusBadgeClassName('estimates', c.tone)}>{c.label}</span>
  }

  const getStockStatusBadge = (status?: string) => {
    if (status === 'SCARICATO') {
      return <span className={getThemeTableStatusBadgeClassName('estimates', 'success')}>SCARICATO</span>
    }

    if (status === 'PARZIALE') {
      return <span className={getThemeTableStatusBadgeClassName('estimates', 'warning')}>PARZIALE</span>
    }

    return <span className={getThemeTableStatusBadgeClassName('estimates', 'neutral')}>{status || 'DA SCARICARE'}</span>
  }

  const getInvoiceStatusBadge = (status?: string) => {
    if (status === 'FATTURATO') {
      return <span className={getThemeTableStatusBadgeClassName('estimates', 'primary')}>FATTURATO</span>
    }

    return <span className={getThemeTableStatusBadgeClassName('estimates', 'neutral')}>{status || 'NON FATTURATO'}</span>
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT': return <Clock className="h-4 w-4 text-slate-500" />
      case 'SENT': return <Send className="h-4 w-4 text-blue-500" />
      case 'ACCEPTED': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'DELIVERED': return <Package className="h-4 w-4 text-emerald-600" />
      case 'REJECTED': return <XCircle className="h-4 w-4 text-red-500" />
      default: return <AlertTriangle className="h-4 w-4 text-orange-500" />
    }
  }

  const handleEstimateClick = (estimate: Estimate) => {
    setActiveEstimate(estimate)
    setSelectedEstimate(estimate)
    setShowDetails(true)
  }

  const handleRowSelect = (e: React.MouseEvent, estimate: Estimate) => {
    e.stopPropagation()
    setActiveEstimate(prev => prev?.id === estimate.id ? null : estimate)
  }

  const handleMarkAllPaid = async () => {
    if (!confirm(`Segna TUTTI i ${estimates.length} preventivi visibili come PAGATO?`)) return
    setBulkLoading(true)
    try {
      const results = await Promise.all(estimates.map(async (estimate) => {
        const res = await fetch(`/api/estimates/${estimate.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentStatus: 'PAGATO' })
        })

        const result = await res.json()
        return result.success
      }))

      const successCount = results.filter(Boolean).length

      if (successCount === estimates.length) {
        toast({ title: 'Aggiornati', description: `${estimates.length} preventivi segnati come pagati e registrati nel libro cassa` })
      } else {
        toast({ title: 'Parziale', description: `${successCount} preventivi aggiornati correttamente`, variant: 'destructive' })
      }

      fetchEstimates()
      fetchStats()
    } catch {
      toast({ title: 'Errore', description: 'Errore aggiornamento', variant: 'destructive' })
    } finally { setBulkLoading(false) }
  }

  const handleUpdatePaymentStatus = async (id: string, paymentStatus: 'PAGATO' | 'NON PAGATO') => {
    const confirmMessage = paymentStatus === 'PAGATO'
      ? 'Segnare questo preventivo come pagato e registrare il movimento nel libro cassa?'
      : 'Annullare il pagamento di questo preventivo ed escluderlo dal libro cassa?'

    if (!confirm(confirmMessage)) return

    try {
      const res = await fetch(`/api/estimates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus })
      })

      const result = await res.json()

      if (result.success) {
        toast({
          title: paymentStatus === 'PAGATO' ? 'Pagamento registrato' : 'Pagamento annullato',
          description: paymentStatus === 'PAGATO'
            ? 'Il preventivo è stato registrato correttamente nel libro cassa'
            : 'Il preventivo è stato escluso dal libro cassa'
        })
        fetchEstimates()
        fetchStats()
        if (selectedEstimate?.id === id) setSelectedEstimate(result.data)
        if (activeEstimate?.id === id) setActiveEstimate(result.data)
      } else {
        toast({
          title: 'Errore',
          description: result.error || 'Errore aggiornamento pagamento',
          variant: 'destructive'
        })
      }
    } catch {
      toast({
        title: 'Errore',
        description: 'Errore di rete',
        variant: 'destructive'
      })
    }
  }

  const handleCancelPayment = async (id: string) => {
    await handleUpdatePaymentStatus(id, 'NON PAGATO')
  }

  const handleExportCSV = () => {
    const rows = [
      ['N° Preventivo', 'Cliente', 'Data', 'Stato', 'Pagamento', 'Totale', 'Saldo'],
      ...estimates.map(e => [
        e.number, e.customer?.name || '', formatDate(e.issueDate),
        e.status, e.paymentStatus,
        e.totalAmount.toFixed(2), e.balanceAmount.toFixed(2)
      ])
    ]
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'preventivi.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const handleCreateEstimate = () => {
    setEditingEstimate(null)
    setShowForm(true)
  }

  const handleEditEstimate = (estimate: Estimate) => {
    setEditingEstimate(estimate)
    setShowForm(true)
  }

  const handleFormSuccess = () => {
    setShowForm(false)
    setEditingEstimate(null)
    fetchEstimates()
    fetchStats()
  }

  const handleScaricaMerce = async (id: string) => {
    try {
      const res = await fetch(`/api/estimates/${id}/scarica`, { method: 'POST' })
      const result = await res.json()
      if (result.success) {
        toast({ title: "Completato", description: result.message })
        fetchEstimates()
        fetchStats()
        if (selectedEstimate?.id === id) setSelectedEstimate(result.data)
      } else {
        toast({ title: "Errore", description: result.error, variant: "destructive" })
      }
    } catch {
      toast({ title: "Errore", description: "Errore di rete", variant: "destructive" })
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/estimates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      const result = await res.json()
      if (result.success) {
        toast({
          title: "Stato aggiornato",
          description: `Preventivo segnato come ${status.toLowerCase()}`,
        })
        fetchEstimates()
        fetchStats()
        if (selectedEstimate?.id === id) setSelectedEstimate(result.data)
      } else { 
        toast({
          title: "Errore",
          description: result.error || "Errore aggiornamento stato",
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
    if (!confirm('Sei sicuro di voler eliminare questo preventivo?')) return
    try {
      const res = await fetch(`/api/estimates/${id}`, { method: 'DELETE' })
      const result = await res.json()
      if (result.success) {
        toast({
          title: "Eliminato",
          description: "Preventivo eliminato con successo",
        })
        setShowDetails(false)
        setSelectedEstimate(null)
        fetchEstimates()
        fetchStats()
      } else { 
        toast({
          title: "Errore",
          description: result.error || "Errore eliminazione",
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

  const handleConvertToInvoice = async (id: string, estimate: Estimate) => {
    if (estimate.stockStatus !== 'SCARICATO') {
      toast({ title: "Attenzione", description: "Devi prima scaricare la merce dal magazzino prima di generare la fattura!", variant: "destructive" })
      return
    }
    if (estimate.invoiceStatus === 'FATTURATO') {
      toast({ title: "Già fatturato", description: "Questo preventivo è già stato fatturato.", variant: "destructive" })
      return
    }
    if (!confirm('Vuoi generare una fattura da questo preventivo?')) return
    try {
      const res = await fetch(`/api/estimates/${id}/convert`, { method: 'POST' })
      const result = await res.json()
      if (result.success) {
        toast({ title: "Fattura generata", description: result.message || "Fattura creata con successo!" })
        fetchEstimates()
        fetchStats()
      } else { 
        toast({ title: "Errore", description: result.error || "Errore conversione", variant: "destructive" })
      }
    } catch { 
      toast({ title: "Errore", description: "Errore di rete", variant: "destructive" })
    }
  }

  const handleReso = async (id: string, estimate: Estimate) => {
    if (estimate.stockStatus !== 'SCARICATO') {
      toast({ title: "Attenzione", description: "Puoi effettuare il reso solo su preventivi già scaricati.", variant: "destructive" })
      return
    }
    if (estimate.returnStatus === 'RESO') {
      toast({ title: "Già reso", description: "Questo preventivo è già stato reso.", variant: "destructive" })
      return
    }
    if (!confirm('Effettuare il RESO? Le quantità verranno ripristinate in magazzino.')) return
    try {
      const res = await fetch(`/api/estimates/${id}/reso`, { method: 'POST' })
      const result = await res.json()
      if (result.success) {
        toast({ title: "Reso effettuato", description: "Le quantità sono state ripristinate in magazzino." })
        fetchEstimates()
      } else { 
        toast({ title: "Errore", description: result.error || "Errore reso", variant: "destructive" })
      }
    } catch { 
      toast({ title: "Errore", description: "Errore di rete", variant: "destructive" })
    }
  }

  const handleGenerateDdt = async (id: string, source: 'estimate' | 'invoice') => {
    if (!confirm(`Vuoi generare un DDT da questo ${source === 'estimate' ? 'preventivo' : 'fattura'}?`)) return
    try {
      const res = await fetch(`/api/ddts/generate/${id}?source=${source}`, { method: 'POST' })
      const result = await res.json()
      if (result.success) {
        toast({
          title: "DDT generato",
          description: result.message || "DDT generato con successo!",
        })
        fetchEstimates()
      } else { 
        toast({
          title: "Errore",
          description: result.error || "Errore generazione DDT",
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

  const handleDuplicate = async (id: string) => {
    if (!confirm('Vuoi duplicare questo preventivo?')) return
    try {
      const res = await fetch(`/api/duplicate/${id}?type=estimate`, { method: 'POST' })
      const result = await res.json()
      if (result.success) {
        toast({
          title: "Duplicato",
          description: "Preventivo duplicato con successo!",
        })
        fetchEstimates()
        fetchStats()
      } else { 
        toast({
          title: "Errore",
          description: result.error || "Errore duplicazione",
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

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  if (loading && estimates.length === 0) {
    return (
      <PageShell title="Preventivi" description="Gestione preventivi e offerte commerciali" icon={Calculator} theme="estimates">
        <PageShellLoading label="Caricamento preventivi..." theme="estimates" />
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Preventivi"
      description="Gestione preventivi e offerte commerciali"
      icon={Calculator}
      theme="estimates"
      actions={
        <>
          <Button variant="outline" size="sm" onClick={fetchEstimates} className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <RefreshCw className="h-4 w-4 mr-1.5" />Aggiorna
          </Button>
          <Button size="sm" onClick={handleCreateEstimate} className="border border-violet-400/40 bg-violet-500 text-white hover:bg-violet-600 font-semibold shadow-[0_14px_30px_-18px_rgba(139,92,246,0.75)]">
            <Plus className="h-4 w-4 mr-1.5" />Crea Preventivo
          </Button>
        </>
      }
    >
      <div className="space-y-6">

        {/* WFP-style Action Toolbar */}
        <Card className="border-slate-200">
          <CardContent className="py-2.5 px-4">
            <div className="flex flex-wrap gap-2 items-center">
              <Button size="sm" variant="outline" onClick={() => activeEstimate && handleEditEstimate(activeEstimate)}
                disabled={!activeEstimate} className="text-xs h-8">
                <Edit className="h-3.5 w-3.5 mr-1.5" />Modifica / Saldi
              </Button>
              <Button size="sm" variant="outline" onClick={() => activeEstimate && handleScaricaMerce(activeEstimate.id)}
                disabled={!activeEstimate || activeEstimate.stockStatus === 'SCARICATO'} className="text-xs h-8">
                <Package className="h-3.5 w-3.5 mr-1.5" />Scarica Merce
              </Button>
              <Button size="sm" variant="outline" onClick={() => activeEstimate && handleConvertToInvoice(activeEstimate.id, activeEstimate)}
                disabled={!activeEstimate} className="text-xs h-8 text-blue-600 border-blue-300 hover:bg-blue-50">
                <FileCheck className="h-3.5 w-3.5 mr-1.5" />Crea Fattura
              </Button>
              <Button size="sm" variant="outline" onClick={() => activeEstimate && handleGenerateDdt(activeEstimate.id, 'estimate')}
                disabled={!activeEstimate} className="text-xs h-8">
                <Truck className="h-3.5 w-3.5 mr-1.5" />Trasforma in DDT
              </Button>
              <div className="w-px h-6 bg-gray-200 mx-1" />
              <Button size="sm" variant="outline" onClick={() => activeEstimate ? handleUpdatePaymentStatus(activeEstimate.id, 'PAGATO') : handleMarkAllPaid()}
                disabled={bulkLoading || (!activeEstimate && estimates.length === 0)} className="text-xs h-8 text-green-700 border-green-300 hover:bg-green-50">
                <CheckSquare className="h-3.5 w-3.5 mr-1.5" />{activeEstimate ? 'Segna Pagato' : 'Segna Pagato Tutto'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => activeEstimate && handleCancelPayment(activeEstimate.id)}
                disabled={!activeEstimate} className="text-xs h-8 text-red-600 border-red-300 hover:bg-red-50">
                <XSquare className="h-3.5 w-3.5 mr-1.5" />Annulla Pag.
              </Button>
              <div className="w-px h-6 bg-gray-200 mx-1" />
              <Button size="sm" variant="outline" onClick={handleExportCSV} className="text-xs h-8">
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />Esporta CSV
              </Button>
              <Button size="sm" variant="outline" onClick={() => activeEstimate && openPrintDocument('estimate', activeEstimate.id)}
                disabled={!activeEstimate} className="text-xs h-8">
                <Printer className="h-3.5 w-3.5 mr-1.5" />Stampa
              </Button>
              <Button size="sm" variant="outline" onClick={() => activeEstimate && handleDelete(activeEstimate.id)}
                disabled={!activeEstimate} className="text-xs h-8 text-red-600 border-red-300 hover:bg-red-50">
                <Trash2 className="h-3.5 w-3.5 mr-1.5" />Elimina
              </Button>
              {activeEstimate && (
                <span className="ml-auto text-xs text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded-md">
                  Selezionato: {activeEstimate.number}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
              <Card className="border-l-4 border-l-violet-500">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-violet-600 uppercase tracking-wide">Totale Preventivi</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">{stats.totalEstimates}</p>
                      <p className="mt-1 text-xs text-slate-500">{stats.byStatus.DRAFT || 0} bozze • {stats.byStatus.SENT || 0} inviati</p>
                    </div>
                    <div className="p-3 rounded-xl bg-violet-100">
                      <ClipboardList className="h-6 w-6 text-violet-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
              <Card className="border-l-4 border-l-emerald-500">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Valore Totale</p>
                      <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(stats.totalValue)}</p>
                      <p className="mt-1 text-xs text-slate-500">Media: {formatCurrency(stats.averageValue)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-100">
                      <DollarSign className="h-6 w-6 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Accettati</p>
                      <p className="text-2xl font-bold text-green-700 mt-1">{stats.byStatus.ACCEPTED || 0}</p>
                      <p className="mt-1 text-xs text-slate-500">{stats.byStatus.REJECTED || 0} rifiutati</p>
                    </div>
                    <div className="p-3 rounded-xl bg-green-100">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Da Incassare</p>
                      <p className="text-2xl font-bold text-orange-700 mt-1">{formatCurrency(stats.totalBalance)}</p>
                      <p className="mt-1 text-xs text-slate-500">Incassato: {formatCurrency(stats.totalPaid)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-orange-100">
                      <AlertTriangle className="h-6 w-6 text-orange-600" />
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
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Cerca preventivi per numero, cliente..."
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
                    <SelectItem value="SENT">Inviato</SelectItem>
                    <SelectItem value="ACCEPTED">Accettato</SelectItem>
                    <SelectItem value="DELIVERED">Consegnato</SelectItem>
                    <SelectItem value="REJECTED">Rifiutato</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedPaymentStatus} onValueChange={setSelectedPaymentStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Pagamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti</SelectItem>
                    <SelectItem value="NON PAGATO">Non pagato</SelectItem>
                    <SelectItem value="PARZIALMENTE PAGATO">Parziale</SelectItem>
                    <SelectItem value="PAGATO">Pagato</SelectItem>
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

        {/* Estimates Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista Preventivi ({estimates.length})</CardTitle>
            <CardDescription>Tutti i preventivi con dettagli e stato</CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeTable theme="estimates">
              <TableHeader className={getThemeTableHeaderClassName('estimates')}>
                <TableRow>
                  <TableHead className={getThemeTableHeadClassName('estimates', 'cursor-pointer')} onClick={() => handleSort('number')}>
                    <div className="flex items-center">
                      N° Preventivo
                      {sortBy === 'number' && <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                  </TableHead>
                  <TableHead className={getThemeTableHeadClassName('estimates')}>Cliente</TableHead>
                  <TableHead className={getThemeTableHeadClassName('estimates', 'cursor-pointer')} onClick={() => handleSort('issueDate')}>
                    <div className="flex items-center">
                      Data
                      {sortBy === 'issueDate' && <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                  </TableHead>
                  <TableHead className={getThemeTableHeadClassName('estimates')}>Stato Scarico</TableHead>
                  <TableHead className={getThemeTableHeadClassName('estimates')}>Stato Fattura</TableHead>
                  <TableHead className={getThemeTableHeadClassName('estimates')}>Pagamento</TableHead>
                  <TableHead className={getThemeTableHeadClassName('estimates', 'cursor-pointer')} onClick={() => handleSort('totalAmount')}>
                    <div className="flex items-center">
                      Totale
                      {sortBy === 'totalAmount' && <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                    </div>
                  </TableHead>
                  <TableHead className={getThemeTableHeadClassName('estimates')}>Saldo</TableHead>
                  <TableHead className={getThemeTableHeadClassName('estimates', 'sticky right-0 z-10 min-w-[88px] bg-violet-50/95 text-right')}>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {estimates.map((estimate) => (
                  <TableRow
                    key={estimate.id}
                    className={getThemeTableRowClassName('estimates', { selected: activeEstimate?.id === estimate.id }, 'cursor-pointer transition-colors')}
                    onClick={(e) => handleRowSelect(e, estimate)}
                    onDoubleClick={() => handleEstimateClick(estimate)}
                  >
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(estimate.status)}
                        <div>
                          <div className="font-semibold text-slate-900">{estimate.number}</div>
                          <div className="mt-1">{getStatusBadge(estimate.status)}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-slate-900">{estimate.customer?.name || 'N/A'}</div>
                        {estimate.customer?.email && (
                          <div className="text-sm text-slate-500">{estimate.customer.email}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-800">
                        <div className="font-medium text-slate-900">{formatDate(estimate.issueDate)}</div>
                        {estimate.dueDate && (
                          <div className="text-slate-500">Scad: {formatDate(estimate.dueDate)}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStockStatusBadge(estimate.stockStatus)}</TableCell>
                    <TableCell>{getInvoiceStatusBadge(estimate.invoiceStatus)}</TableCell>
                    <TableCell>{getPaymentStatusBadge(estimate.paymentStatus)}</TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900">{formatCurrency(estimate.totalAmount)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-slate-900">
                        {formatCurrency(estimate.balanceAmount)}
                      </div>
                    </TableCell>
                    <TableCell className={getThemeTableStickyCellClassName('estimates', { selected: activeEstimate?.id === estimate.id }, 'sticky right-0 z-10 min-w-[88px] text-right')}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className={getThemeTableActionButtonClassName('estimates')} onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Dettagli
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditEstimate(estimate)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifica
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openPrintDocument('estimate', estimate.id)}>
                            <Printer className="h-4 w-4 mr-2" />
                            Stampa
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => downloadPrintDocument('estimate', estimate.id)}>
                            <Download className="h-4 w-4 mr-2" />
                            Scarica PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(estimate.id, 'SENT')}>
                            <Send className="h-4 w-4 mr-2" />
                            Segna Inviato
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleUpdateStatus(estimate.id, 'ACCEPTED') }}>
                            <CheckCircle className="h-4 w-4 mr-2" />Accetta
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleUpdateStatus(estimate.id, 'DELIVERED') }}>
                            <Package className="h-4 w-4 mr-2" />Segna Consegnato
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleUpdateStatus(estimate.id, 'REJECTED') }}>
                            <XCircle className="h-4 w-4 mr-2" />
                            Segna Rifiutato
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleUpdatePaymentStatus(estimate.id, 'PAGATO') }}>
                            <CheckSquare className="h-4 w-4 mr-2 text-green-600" />
                            Segna Pagato
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCancelPayment(estimate.id) }}>
                            <XSquare className="h-4 w-4 mr-2 text-red-600" />
                            Annulla Pagamento
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(estimate.id)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplica
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(estimate.id)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Elimina
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {estimates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <EmptyState
                        icon={ClipboardList}
                        title="Nessun preventivo trovato"
                        description="Non ci sono preventivi da mostrare con i filtri correnti."
                        actionLabel="Crea il primo preventivo"
                        onAction={handleCreateEstimate}
                        className={getThemeTableEmptyStateClassName('estimates')}
                        actionClassName={getThemeTableEmptyStateActionClassName('estimates')}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </ThemeTable>
          </CardContent>
        </Card>

        {/* Estimate Details Dialog */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className={getPopupDialogContentClassName("max-w-4xl max-h-[90vh] overflow-y-auto")}>
            <PopupHeader
              theme="estimates"
              title={`Preventivo ${selectedEstimate?.number || ''}`}
              description="Dettagli completi del preventivo"
            />
            
            {selectedEstimate && (
              <div className="space-y-6 p-6">
                {/* Header info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informazioni Generali</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Numero</span>
                        <span className="font-medium">{selectedEstimate.number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Data Emissione</span>
                        <span>{formatDate(selectedEstimate.issueDate)}</span>
                      </div>
                      {selectedEstimate.dueDate && (
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Scadenza</span>
                          <span>{formatDate(selectedEstimate.dueDate)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Stato</span>
                        {getStatusBadge(selectedEstimate.status)}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Pagamento</span>
                        {getPaymentStatusBadge(selectedEstimate.paymentStatus)}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Scarico Magazzino</span>
                        {getStockStatusBadge(selectedEstimate.stockStatus)}
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Fatturazione</span>
                        {getInvoiceStatusBadge(selectedEstimate.invoiceStatus)}
                      </div>
                      {selectedEstimate.paymentMethod && (
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Metodo Pagamento</span>
                          <span>{selectedEstimate.paymentMethod}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Cliente</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <User className="h-10 w-10 rounded-lg bg-slate-100 p-2 text-slate-500" />
                        <div>
                          <div className="font-medium">{selectedEstimate.customer?.name}</div>
                          {selectedEstimate.customer?.email && (
                            <div className="text-sm text-slate-500">{selectedEstimate.customer.email}</div>
                          )}
                          {selectedEstimate.customer?.phone && (
                            <div className="text-sm text-slate-500">{selectedEstimate.customer.phone}</div>
                          )}
                        </div>
                      </div>
                      {selectedEstimate.customer?.vatNumber && (
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">P.IVA</span>
                          <span>{selectedEstimate.customer.vatNumber}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Items table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Righe Preventivo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Descrizione</TableHead>
                          <TableHead className="text-right">Q.tà</TableHead>
                          <TableHead className="text-right">Prezzo</TableHead>
                          <TableHead className="text-right">Sconto</TableHead>
                          <TableHead className="text-right">IVA</TableHead>
                          <TableHead className="text-right">Totale</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedEstimate.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{item.description}</div>
                                {item.product && (
                                  <div className="text-sm text-slate-500">
                                    {item.product.name} {item.product.sku && `(${item.product.sku})`}
                                  </div>
                                )}
                                {item.code && (
                                  <div className="text-sm text-slate-500">Cod: {item.code}</div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              {item.quantity} {item.unit}
                            </TableCell>
                            <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                            <TableCell className="text-right">
                              {item.discount > 0 ? `${item.discount}%` : '-'}
                            </TableCell>
                            <TableCell className="text-right">{item.vatRate}%</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item.totalPrice)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    {/* Totals */}
                    <div className="mt-4 border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Subtotale</span>
                        <span>{formatCurrency(selectedEstimate.subtotal)}</span>
                      </div>
                      {selectedEstimate.discountAmount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Sconto</span>
                          <span className="text-red-600">-{formatCurrency(selectedEstimate.discountAmount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">IVA</span>
                        <span>{formatCurrency(selectedEstimate.taxAmount)}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>Totale</span>
                        <span>{formatCurrency(selectedEstimate.totalAmount)}</span>
                      </div>
                      {selectedEstimate.paidAmount > 0 && (
                        <>
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Pagato</span>
                            <span>{formatCurrency(selectedEstimate.paidAmount)}</span>
                          </div>
                          <div className="flex justify-between text-sm font-medium text-orange-600">
                            <span>Saldo</span>
                            <span>{formatCurrency(selectedEstimate.balanceAmount)}</span>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Notes */}
                {visibleInternalNotes || selectedEstimate.notes ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Note</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedEstimate.notes && (
                        <div>
                          <label className="text-sm font-medium text-slate-600">Note</label>
                          <p className="text-sm mt-1">{selectedEstimate.notes}</p>
                        </div>
                      )}
                      {visibleInternalNotes && (
                        <div>
                          <label className="text-sm font-medium text-slate-600">Note Interne</label>
                          <p className="mt-1 text-sm text-slate-500">{visibleInternalNotes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : null}

                {/* Actions */}
                <div className="flex justify-end space-x-4">
                  <Button variant="outline" onClick={() => openPrintDocument('estimate', selectedEstimate!.id)}><Printer className="h-4 w-4 mr-2" />Stampa</Button>
                  <Button variant="outline" onClick={() => downloadPrintDocument('estimate', selectedEstimate!.id)}><Download className="h-4 w-4 mr-2" />Scarica PDF</Button>
                  <Button
                    variant="outline"
                    disabled={selectedEstimate!.stockStatus !== 'SCARICATO'}
                    className={selectedEstimate!.stockStatus !== 'SCARICATO' ? 'border-slate-200 text-slate-400' : 'text-blue-600 border-blue-300 hover:bg-blue-50'}
                    onClick={() => handleConvertToInvoice(selectedEstimate!.id, selectedEstimate!)}
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    {selectedEstimate!.invoiceStatus === 'FATTURATO' ? 'Già Fatturato' : 'Genera Fattura'}
                  </Button>
                  <Button variant="outline" onClick={() => handleGenerateDdt(selectedEstimate!.id, 'estimate')}>
                    <Truck className="h-4 w-4 mr-2" />DDT
                  </Button>
                  {selectedEstimate!.stockStatus === 'SCARICATO' && selectedEstimate!.returnStatus !== 'RESO' && (
                    <Button
                      variant="outline"
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                      onClick={() => handleScaricaMerce(selectedEstimate!.id)}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Scarica Merce
                    </Button>
                  )}
                  <Button className={getPopupPrimaryButtonClassName('estimates')} onClick={() => { setShowDetails(false); handleEditEstimate(selectedEstimate!) }}>
                    <Edit className="h-4 w-4 mr-2" />Modifica
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

      {/* Estimate Form Modal */}
      <EstimateForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={handleFormSuccess}
        estimate={editingEstimate}
      />
      </div>
    </PageShell>
  )
}

