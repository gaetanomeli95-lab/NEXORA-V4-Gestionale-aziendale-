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
  Receipt,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  MoreHorizontal,
  DollarSign,
  User,
  RefreshCw,
  Printer,
  Copy,
  CreditCard,
  FileText,
  Truck,
  Globe,
  ExternalLink,
  Settings,
  Zap
} from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { InvoiceForm } from '@/components/forms/invoice-form'
import { getPopupDialogContentClassName, getPopupPrimaryButtonClassName } from '@/components/layout/module-theme'
import { downloadPrintDocument, openPrintDocument } from '@/lib/print-url'
import { formatDateTime } from '@/lib/utils'
import { PageShell, PageShellLoading } from '@/components/layout/page-shell'
import { PopupHeader } from '@/components/ui/popup-header'

interface InvoiceCustomer {
  id: string
  name: string
  email?: string
  phone?: string
  vatNumber?: string
  fiscalCode?: string
  address?: string
  city?: string
  province?: string
  zipCode?: string
}

interface InvoiceItem {
  id: string
  productId?: string
  product?: { id: string; name: string; sku?: string } | null
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  taxRate: number
  taxAmount: number
}

interface Invoice {
  id: string
  number: string
  customerId: string
  customer: InvoiceCustomer
  issueDate: string
  dueDate?: string
  status: string
  subtotal: number
  taxAmount: number
  totalAmount: number
  discountAmount?: number
  paidAmount?: number
  paymentMethod?: string
  notes?: string
  items: InvoiceItem[]
  createdAt: string
  updatedAt: string
}

interface InvoiceStatsData {
  [status: string]: { count: number; amount: number }
}

interface EInvoiceProvider {
  id: string
  name: string
  logo?: string
  website: string
  description: string
  features: string[]
  isActive: boolean
}

export default function InvoicesPage() {
  const { toast } = useToast()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [stats, setStats] = useState<InvoiceStatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null)
  const [showEInvoiceDialog, setShowEInvoiceDialog] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string>('aruba')
  const [eInvoiceProviders, setEInvoiceProviders] = useState<EInvoiceProvider[]>([])
  const [invoiceForEInvoice, setInvoiceForEInvoice] = useState<Invoice | null>(null)
  const [showProviderSelector, setShowProviderSelector] = useState(false)
  const [savedProvider, setSavedProvider] = useState<string>('aruba')

  useEffect(() => {
    fetchInvoices()
    loadEInvoiceProviders()
  }, [searchQuery, selectedStatus, currentPage])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      })
      if (selectedStatus !== 'all') params.set('status', selectedStatus)

      const response = await fetch(`/api/invoices?${params}`)
      const result = await response.json()
      
      if (result.success) {
        let invoiceList = result.data.invoices || []
        if (searchQuery) {
          const q = searchQuery.toLowerCase()
          invoiceList = invoiceList.filter((inv: Invoice) =>
            inv.number.toLowerCase().includes(q) ||
            inv.customer?.name?.toLowerCase().includes(q)
          )
        }
        setInvoices(invoiceList)
        setTotalPages(result.data.pagination?.pages || 1)
        setStats(result.data.stats || null)
      }
    } catch (error) {
      console.error('Error fetching invoices:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateInvoice = () => { setEditingInvoice(null); setShowForm(true) }
  const handleEditInvoice = (inv: Invoice) => { setEditingInvoice(inv); setShowForm(true) }
  const handleFormSuccess = () => { setShowForm(false); setEditingInvoice(null); fetchInvoices() }

  const loadEInvoiceProviders = async () => {
    // Mock providers - in production, fetch from API
    const mockProviders: EInvoiceProvider[] = [
      {
        id: 'aruba',
        name: 'Aruba Fatturazione',
        website: 'https://fatturazione.aruba.it',
        description: 'Servizio completo con conservazione sostitutiva',
        features: ['Fattura PA', 'Fattura B2B', 'Conservazione', 'Firma digitale'],
        isActive: true
      },
      {
        id: 'infocert',
        name: 'InfoCert',
        website: 'https://fattura.infocert.it',
        description: 'Piattaforma professionale per fatturazione elettronica',
        features: ['Fattura PA/B2B', 'Conservazione', 'App mobile', 'API'],
        isActive: true
      },
      {
        id: 'teamsystem',
        name: 'TeamSystem',
        website: 'https://digital.teamsystem.com',
        description: 'Soluzione integrata gestione documenti fiscali',
        features: ['Fatturazione', 'Conservazione', 'Firma digitale', 'ERP'],
        isActive: true
      },
      {
        id: 'sdi',
        name: 'SDI Diretto',
        website: 'https://www.agenziaentrate.gov.it',
        description: 'Sistema ufficiale Agenzia delle Entrate',
        features: ['Invio SDI', 'Notifiche', 'Esito invio', 'Consulenza'],
        isActive: false
      }
    ]
    setEInvoiceProviders(mockProviders)
    
    // Load saved provider from localStorage
    const saved = localStorage.getItem('selectedEInvoiceProvider')
    if (saved) {
      setSavedProvider(saved)
      setSelectedProvider(saved)
    }
  }

  const saveProvider = (providerId: string) => {
    localStorage.setItem('selectedEInvoiceProvider', providerId)
    setSavedProvider(providerId)
    setSelectedProvider(providerId)
    setShowProviderSelector(false)
    
    const provider = eInvoiceProviders.find(p => p.id === providerId)
    toast({
      title: "Provider Aggiornato",
      description: `Provider impostato: ${provider?.name}`,
    })
  }

  const handleEInvoice = (invoice: Invoice) => {
    setInvoiceForEInvoice(invoice)
    setShowEInvoiceDialog(true)
  }

  const handleSendEInvoice = async () => {
    if (!invoiceForEInvoice) return

    const provider = eInvoiceProviders.find(p => p.id === selectedProvider)
    if (!provider) return

    try {
      // In production, this would integrate with the provider's API
      toast({
        title: "Invio in corso...",
        description: `Sto inviando la fattura ${invoiceForEInvoice.number} a ${provider.name}`,
      })

      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Open provider website in new tab
      window.open(provider.website, '_blank')

      toast({
        title: "Fattura Elettronica Inviata",
        description: `La fattura è stata preparata per l'invio tramite ${provider.name}`,
      })

      setShowEInvoiceDialog(false)
      setInvoiceForEInvoice(null)
    } catch (error) {
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'invio della fattura elettronica",
        variant: "destructive",
      })
    }
  }

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/invoices/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      const result = await res.json()
      if (result.success) {
        fetchInvoices()
        if (selectedInvoice?.id === id) setSelectedInvoice(result.data)
      } else {
        toast({
          title: "Errore",
          description: result.error || 'Errore aggiornamento stato',
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

  const handleGenerateDdt = async (id: string) => {
    if (!confirm('Vuoi generare un DDT da questa fattura?')) return
    try {
      const res = await fetch(`/api/ddts/generate/${id}?source=invoice`, { method: 'POST' })
      const result = await res.json()
      if (result.success) {
        toast({
          title: "DDT generato",
          description: result.message || 'DDT generato con successo!',
        })
        fetchInvoices()
      } else {
        toast({
          title: "Errore",
          description: result.error || 'Errore generazione DDT',
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
    if (!confirm('Vuoi duplicare questa fattura?')) return
    try {
      const res = await fetch(`/api/duplicate/${id}?type=invoice`, { method: 'POST' })
      const result = await res.json()
      if (result.success) {
        toast({
          title: "Duplicato",
          description: 'Fattura duplicata con successo!',
        })
        fetchInvoices()
      } else {
        toast({
          title: "Errore",
          description: result.error || 'Errore duplicazione',
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
    if (!confirm('Sei sicuro di voler eliminare questa fattura?')) return
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: 'DELETE' })
      const result = await res.json()
      if (result.success) {
        setShowDetails(false)
        setSelectedInvoice(null)
        fetchInvoices()
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return formatDateTime(dateString)
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; cls: string }> = {
      DRAFT:     { label: 'Bozza',    cls: 'bg-slate-100 text-slate-700 border border-slate-300' },
      SENT:      { label: 'Inviata',  cls: 'bg-blue-100 text-blue-700 border border-blue-300' },
      PAID:      { label: 'Pagata',   cls: 'bg-green-100 text-green-700 border border-green-300' },
      PARTIAL:   { label: 'Parziale', cls: 'bg-orange-100 text-orange-700 border border-orange-300' },
      PARTIALLY_PAID: { label: 'Parziale', cls: 'bg-orange-100 text-orange-700 border border-orange-300' },
      OVERDUE:   { label: 'Scaduta',  cls: 'bg-red-100 text-red-700 border border-red-300' },
      CANCELLED: { label: 'Annullata',cls: 'bg-slate-100 text-slate-500 border border-slate-300' },
    }
    const c = config[status] || { label: status, cls: 'bg-slate-100 text-slate-600' }
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${c.cls}`}>{c.label}</span>
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT': return <Clock className="h-4 w-4 text-slate-500" />
      case 'SENT': return <Send className="h-4 w-4 text-blue-500" />
      case 'PAID': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'PARTIAL':
      case 'PARTIALLY_PAID':
        return <CreditCard className="h-4 w-4 text-orange-500" />
      case 'OVERDUE': return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'CANCELLED': return <XCircle className="h-4 w-4 text-slate-400" />
      default: return <FileText className="h-4 w-4 text-slate-500" />
    }
  }

  const totalInvoices = stats ? Object.values(stats).reduce((sum, s) => sum + s.count, 0) : invoices.length
  const totalAmount = stats ? Object.values(stats).reduce((sum, s) => sum + s.amount, 0) : 0
  const paidAmount = stats?.PAID?.amount || 0
  const overdueCount = stats?.OVERDUE?.count || 0

  if (loading && invoices.length === 0) {
    return (
      <PageShell title="Fatture" description="Gestione fatturazione e documenti fiscali" icon={FileText} theme="invoices">
        <PageShellLoading label="Caricamento fatture..." theme="invoices" />
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Fatture"
      description="Gestione fatturazione e documenti fiscali"
      icon={FileText}
      theme="invoices"
      actions={
        <>
          <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
            <Globe className="h-4 w-4 text-blue-100" />
            <span className="text-sm text-blue-50">E-Fattura:</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowProviderSelector(true)}
              className="h-6 px-2 text-xs font-medium text-white hover:bg-white/20"
            >
              {eInvoiceProviders.find(p => p.id === savedProvider)?.name || 'Seleziona'}
              <Settings className="h-3 w-3 ml-1" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={fetchInvoices} className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <RefreshCw className="h-4 w-4 mr-1.5" />Aggiorna
          </Button>
          <Button size="sm" onClick={handleCreateInvoice} className="border border-blue-400/40 bg-blue-600 text-white hover:bg-blue-700 font-semibold shadow-[0_14px_30px_-18px_rgba(37,99,235,0.75)]">
            <Plus className="h-4 w-4 mr-1.5" />Nuova Fattura
          </Button>
        </>
      }
    >
      <div className="space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">Totale Fatture</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{totalInvoices}</p>
                    <p className="mt-1 text-xs text-slate-500">{stats?.DRAFT?.count || 0} bozze • {stats?.SENT?.count || 0} inviate</p>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-100">
                    <Receipt className="h-6 w-6 text-blue-600" />
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
                    <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Fatturato Totale</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(totalAmount)}</p>
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
                    <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">Incassato</p>
                    <p className="text-2xl font-bold text-green-700 mt-1">{formatCurrency(paidAmount)}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-green-100">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">Scadute</p>
                    <p className="text-2xl font-bold text-red-700 mt-1">{overdueCount}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-red-100">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Cerca fatture per numero, cliente..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti gli stati</SelectItem>
                  <SelectItem value="DRAFT">Bozza</SelectItem>
                  <SelectItem value="SENT">Inviata</SelectItem>
                  <SelectItem value="PAID">Pagata</SelectItem>
                  <SelectItem value="PARTIAL">Parziale</SelectItem>
                  <SelectItem value="OVERDUE">Scaduta</SelectItem>
                  <SelectItem value="CANCELLED">Annullata</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista Fatture ({invoices.length})</CardTitle>
            <CardDescription>Tutte le fatture emesse</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Fattura</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data Emissione</TableHead>
                  <TableHead>Scadenza</TableHead>
                  <TableHead>Stato</TableHead>
                  <TableHead className="text-right">Totale</TableHead>
                  <TableHead className="sticky right-0 z-10 min-w-[88px] bg-white text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow
                    key={invoice.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => { setSelectedInvoice(invoice); setShowDetails(true) }}
                  >
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(invoice.status)}
                        <span className="font-medium">{invoice.number}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-slate-900">{invoice.customer?.name || 'N/A'}</div>
                      {invoice.customer?.email && (
                        <div className="text-sm text-slate-500">{invoice.customer.email}</div>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(invoice.issueDate)}</TableCell>
                    <TableCell>{invoice.dueDate ? formatDate(invoice.dueDate) : '-'}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(invoice.totalAmount)}</TableCell>
                    <TableCell className="sticky right-0 z-10 min-w-[88px] bg-white text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />Dettagli</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditInvoice(invoice)}><Edit className="h-4 w-4 mr-2" />Modifica</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openPrintDocument('invoice', invoice.id)}><Printer className="h-4 w-4 mr-2" />Stampa</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => downloadPrintDocument('invoice', invoice.id)}><Download className="h-4 w-4 mr-2" />Scarica PDF</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEInvoice(invoice)}><Globe className="h-4 w-4 mr-2" />Fattura Elettronica</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(invoice.id, 'SENT')}><Send className="h-4 w-4 mr-2" />Segna Inviata</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(invoice.id, 'PAID')}><CheckCircle className="h-4 w-4 mr-2" />Segna Pagata</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(invoice.id)}><Copy className="h-4 w-4 mr-2" />Duplica</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(invoice.id)}><Trash2 className="h-4 w-4 mr-2" />Elimina</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {invoices.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8">
                      <EmptyState
                        icon={Receipt}
                        title="Nessun dato disponibile"
                        description="Non ci sono fatture da mostrare con i filtri correnti."
                        actionLabel="Crea la prima Fattura"
                        onAction={handleCreateInvoice}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-6">
                <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>Precedente</Button>
                <span className="text-sm text-slate-600">Pagina {currentPage} di {totalPages}</span>
                <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>Successiva</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice Details Dialog */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className={getPopupDialogContentClassName("max-w-4xl max-h-[90vh] overflow-y-auto")}>
            <PopupHeader
              theme="invoices"
              title={`Fattura ${selectedInvoice?.number || ''}`}
              description="Dettagli completi della fattura"
            />
            
            {selectedInvoice && (
              <div className="space-y-6 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader><CardTitle className="text-lg">Informazioni Generali</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Numero</span>
                        <span className="font-medium">{selectedInvoice.number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Data Emissione</span>
                        <span>{formatDate(selectedInvoice.issueDate)}</span>
                      </div>
                      {selectedInvoice.dueDate && (
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Scadenza</span>
                          <span>{formatDate(selectedInvoice.dueDate)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-600">Stato</span>
                        {getStatusBadge(selectedInvoice.status)}
                      </div>
                      {selectedInvoice.paymentMethod && (
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-600">Metodo Pagamento</span>
                          <span>{selectedInvoice.paymentMethod}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-lg">Cliente</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <User className="h-10 w-10 rounded-lg bg-slate-100 p-2 text-slate-500" />
                        <div>
                          <div className="font-medium">{selectedInvoice.customer?.name}</div>
                          {selectedInvoice.customer?.email && <div className="text-sm text-slate-500">{selectedInvoice.customer.email}</div>}
                          {selectedInvoice.customer?.phone && <div className="text-sm text-slate-500">{selectedInvoice.customer.phone}</div>}
                        </div>
                      </div>
                      {selectedInvoice.customer?.vatNumber && (
                        <div className="flex justify-between"><span className="text-sm text-slate-600">P.IVA</span><span>{selectedInvoice.customer.vatNumber}</span></div>
                      )}
                      {selectedInvoice.customer?.fiscalCode && (
                        <div className="flex justify-between"><span className="text-sm text-slate-600">C.F.</span><span>{selectedInvoice.customer.fiscalCode}</span></div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader><CardTitle className="text-lg">Righe Fattura</CardTitle></CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Descrizione</TableHead>
                          <TableHead className="text-right">Q.tà</TableHead>
                          <TableHead className="text-right">Prezzo</TableHead>
                          <TableHead className="text-right">IVA</TableHead>
                          <TableHead className="text-right">Totale</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedInvoice.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <div className="font-medium">{item.description}</div>
                              {item.product && <div className="text-sm text-slate-500">{item.product.name}</div>}
                            </TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                            <TableCell className="text-right">{item.taxRate}%</TableCell>
                            <TableCell className="text-right font-medium">{formatCurrency(item.totalPrice)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="mt-4 border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm"><span className="text-slate-600">Subtotale</span><span>{formatCurrency(selectedInvoice.subtotal)}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-slate-600">IVA</span><span>{formatCurrency(selectedInvoice.taxAmount)}</span></div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2"><span>Totale</span><span>{formatCurrency(selectedInvoice.totalAmount)}</span></div>
                    </div>
                  </CardContent>
                </Card>

                {selectedInvoice.notes && (
                  <Card>
                    <CardHeader><CardTitle className="text-lg">Note</CardTitle></CardHeader>
                    <CardContent><p className="text-sm">{selectedInvoice.notes}</p></CardContent>
                  </Card>
                )}

                <div className="flex justify-end space-x-4">
                  <Button variant="outline" onClick={() => openPrintDocument('invoice', selectedInvoice!.id)}><Printer className="h-4 w-4 mr-2" />Stampa</Button>
                  <Button variant="outline" onClick={() => downloadPrintDocument('invoice', selectedInvoice!.id)}><Download className="h-4 w-4 mr-2" />Scarica PDF</Button>
                  <Button variant="outline" onClick={() => handleEInvoice(selectedInvoice!)}><Globe className="h-4 w-4 mr-2" />Fattura Elettronica</Button>
                  <Button variant="outline" onClick={() => handleGenerateDdt(selectedInvoice!.id)}><Truck className="h-4 w-4 mr-2" />Genera DDT</Button>
                  <Button variant="outline"><Send className="h-4 w-4 mr-2" />Invia</Button>
                  <Button className={getPopupPrimaryButtonClassName('invoices')} onClick={() => { setShowDetails(false); handleEditInvoice(selectedInvoice!) }}><Edit className="h-4 w-4 mr-2" />Modifica</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <InvoiceForm
          open={showForm}
          onClose={() => setShowForm(false)}
          onSuccess={handleFormSuccess}
          invoice={editingInvoice}
        />

        {/* Electronic Invoice Dialog */}
        <Dialog open={showEInvoiceDialog} onOpenChange={setShowEInvoiceDialog}>
          <DialogContent className={getPopupDialogContentClassName("max-w-2xl max-h-[90vh] overflow-y-auto")}>
            <PopupHeader
              theme="invoices"
              title="Fattura Elettronica"
              description="Seleziona il provider per l'invio della fattura elettronica"
              icon={Globe}
            />
            
            {invoiceForEInvoice && (
              <div className="space-y-6 p-6">
                {/* Invoice Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Dettagli Fattura</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-slate-600">Numero:</span>
                        <span className="font-medium ml-2">{invoiceForEInvoice.number}</span>
                      </div>
                      <div>
                        <span className="text-sm text-slate-600">Cliente:</span>
                        <span className="font-medium ml-2">{invoiceForEInvoice.customer?.name}</span>
                      </div>
                      <div>
                        <span className="text-sm text-slate-600">Data:</span>
                        <span className="font-medium ml-2">{formatDate(invoiceForEInvoice.issueDate)}</span>
                      </div>
                      <div>
                        <span className="text-sm text-slate-600">Importo:</span>
                        <span className="font-medium ml-2">{formatCurrency(invoiceForEInvoice.totalAmount)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Provider Selection */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-slate-700">
                    Seleziona Provider Fatturazione Elettronica
                  </label>
                  <div className="space-y-3">
                    {eInvoiceProviders.filter(provider => provider.isActive).map((provider) => (
                      <Card 
                        key={provider.id}
                        className={`cursor-pointer transition-all ${
                          selectedProvider === provider.id 
                            ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' 
                            : 'hover:border-slate-300'
                        }`}
                        onClick={() => setSelectedProvider(provider.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-medium">{provider.name}</h3>
                                {selectedProvider === provider.id && (
                                  <Badge variant="default" className="text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Selezionato
                                  </Badge>
                                )}
                              </div>
                              <p className="mb-3 text-sm text-slate-600">{provider.description}</p>
                              <div className="flex flex-wrap gap-1">
                                {provider.features.slice(0, 3).map((feature, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {feature}
                                  </Badge>
                                ))}
                                {provider.features.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{provider.features.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.open(provider.website, '_blank')
                                }}
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                Sito
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-4 border-t">
                  <Button variant="outline" onClick={() => setShowEInvoiceDialog(false)}>
                    Annulla
                  </Button>
                  <Button 
                    onClick={handleSendEInvoice}
                    className={getPopupPrimaryButtonClassName('invoices')}
                    disabled={!selectedProvider}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Invia Fattura Elettronica
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Provider Selector Dialog */}
        <Dialog open={showProviderSelector} onOpenChange={setShowProviderSelector}>
          <DialogContent className={getPopupDialogContentClassName("max-w-3xl max-h-[90vh] overflow-y-auto")}>
            <PopupHeader
              theme="invoices"
              title="Seleziona Provider Fatturazione Elettronica"
              description="Scegli il provider per l'invio delle fatture elettroniche. La selezione verrà salvata automaticamente."
              icon={Globe}
            />
            
            <div className="space-y-4 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {eInvoiceProviders.map((provider) => (
                  <Card 
                    key={provider.id}
                    className={`cursor-pointer transition-all ${
                      savedProvider === provider.id 
                        ? 'ring-2 ring-blue-500 border-blue-500 bg-blue-50' 
                        : provider.isActive 
                          ? 'hover:border-slate-300 hover:shadow-md'
                          : 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-400'
                    }`}
                    onClick={() => provider.isActive && saveProvider(provider.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{provider.name}</h3>
                          {!provider.isActive && (
                            <Badge variant="secondary" className="text-xs">
                              Non disponibile
                            </Badge>
                          )}
                          {savedProvider === provider.id && (
                            <Badge variant="default" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Attivo
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            window.open(provider.website, '_blank')
                          }}
                        >
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Sito
                        </Button>
                      </div>
                      
                      <p className="mb-3 text-sm text-slate-600">{provider.description}</p>
                      
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-slate-700">Caratteristiche:</p>
                        <div className="flex flex-wrap gap-1">
                          {provider.features.map((feature, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {savedProvider === provider.id && (
                        <div className="mt-3 p-2 bg-green-100 rounded text-xs text-green-700">
                          ✅ Provider impostato come predefinito
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => setShowProviderSelector(false)}>
                  Chiudi
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageShell>
  )
}

