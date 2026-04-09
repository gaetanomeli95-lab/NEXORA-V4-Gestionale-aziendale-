"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, Plus, Filter, Download, Upload, Edit, Trash2, Eye, CreditCard,
  DollarSign, Calendar, TrendingUp, TrendingDown, AlertTriangle, CheckCircle,
  Clock, MoreHorizontal, Banknote, Building, RefreshCw, FileText,
  ArrowUpRight, ArrowDownRight, Wallet, Receipt, X
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from "@/hooks/use-toast"
import { PaymentForm } from '@/components/forms/payment-form'
import { getPopupDialogContentClassName, getPopupPrimaryButtonClassName } from '@/components/layout/module-theme'
import { PageShell, PageShellLoading } from '@/components/layout/page-shell'
import { PopupHeader } from '@/components/ui/popup-header'
import { downloadPrintDocument, openPrintDocument } from '@/lib/print-url'
import { formatDateTime } from '@/lib/utils'

const EXPENSE_CATEGORIES = [
  'Forniture', 'Affitto', 'Utenze', 'Personale', 'Trasporto', 'Marketing',
  'Manutenzione', 'Tasse', 'Consulenze', 'Attrezzatura', 'Ordine Fornitore', 'Generale', 'Altro'
]
const PAYMENT_METHODS_EXP = ['CONTANTI', 'BONIFICO', 'CARTA', 'ASSEGNO', 'PAYPAL', 'ALTRO']
function getTodayStr() { return new Date().toISOString().split('T')[0] }

interface Payment {
  id: string
  invoiceId?: string | null
  invoice?: {
    number: string
    customer: {
      name: string
      email?: string
    }
    totalAmount: number
    dueDate: string
  } | null
  estimate?: {
    number: string
  } | null
  order?: {
    number: string
  } | null
  customer?: {
    name: string
    email?: string
  } | null
  amount: number
  paymentDate?: string
  method: string
  status: string
  reference?: string
  notes?: string
  entryType?: 'PAYMENT' | 'EXPENSE'
  category?: string | null
  createdAt: string
  updatedAt: string
}

interface PaymentStats {
  totalPayments: number
  totalRevenue: number
  pendingPayments: number
  overduePayments: number
  averagePayment: number
  paymentMethods: Record<string, { count: number; amount: number }>
  monthlyTrend: Array<{
    month: string
    revenue: number
    payments: number
  }>
  upcomingPayments: Array<{
    invoiceId: string
    invoiceNumber: string
    customerName: string
    amount: number
    dueDate: string
    daysUntilDue: number
  }>
  overdueInvoices: Array<{
    invoiceId: string
    invoiceNumber: string
    customerName: string
    amount: number
    daysOverdue: number
  }>
}

export default function PaymentsPage() {
  const { toast } = useToast()
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<PaymentStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedMethod, setSelectedMethod] = useState('all')
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [sortBy, setSortBy] = useState('paymentDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [showPaymentDetails, setShowPaymentDetails] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [formInvoiceId, setFormInvoiceId] = useState<string | undefined>(undefined)

  // Registra Spesa
  const [showExpenseDialog, setShowExpenseDialog] = useState(false)
  const [expCategory, setExpCategory] = useState('Generale')
  const [expDescription, setExpDescription] = useState('')
  const [expAmount, setExpAmount] = useState('')
  const [expMethod, setExpMethod] = useState('CONTANTI')
  const [expDate, setExpDate] = useState(getTodayStr())
  const [expNotes, setExpNotes] = useState('')
  const [expLoading, setExpLoading] = useState(false)

  const refreshPaymentsData = async () => {
    await Promise.all([fetchPayments(), fetchStats()])
  }

  const handleSaveExpense = async () => {
    if (!expAmount || parseFloat(expAmount) <= 0) {
      toast({ title: 'Errore', description: 'Inserisci un importo valido', variant: 'destructive' })
      return
    }
    setExpLoading(true)
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: expCategory,
          description: expDescription || expCategory,
          amount: parseFloat(expAmount),
          paymentMethod: expMethod,
          expenseDate: expDate,
          notes: expNotes
        })
      })
      const result = await res.json()
      if (result.success) {
        toast({ title: 'Spesa registrata', description: `€ ${parseFloat(expAmount).toFixed(2)} — ${expCategory}` })
        await refreshPaymentsData()
        setShowExpenseDialog(false)
        setExpAmount(''); setExpDescription(''); setExpNotes('')
        setExpCategory('Generale'); setExpMethod('CONTANTI'); setExpDate(getTodayStr())
      } else {
        toast({ title: 'Errore', description: result.error || 'Errore registrazione', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Errore', description: 'Errore di rete', variant: 'destructive' })
    } finally {
      setExpLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
    fetchStats()
  }, [searchQuery, selectedStatus, selectedMethod, selectedPeriod, sortBy, sortOrder, currentPage])

  const fetchPayments = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search: searchQuery,
        status: selectedStatus !== 'all' ? selectedStatus : '',
        method: selectedMethod !== 'all' ? selectedMethod : '',
        period: selectedPeriod,
        sortBy,
        sortOrder,
        page: currentPage.toString(),
        limit: '500'
      })

      const response = await fetch(`/api/payments?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setPayments(result.data.payments || result.data || [])
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/payments/stats')
      const result = await response.json()
      
      if (result.success) {
        setStats(result.data)
      }
    } catch (error) {
      console.error('Error fetching payment stats:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PAID: { label: 'Pagato', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
      PENDING: { label: 'In attesa', className: 'bg-slate-100 text-slate-700 border-slate-200' },
      OVERDUE: { label: 'Scaduto', className: 'bg-red-100 text-red-700 border-red-200' },
      PARTIAL: { label: 'Parziale', className: 'bg-amber-100 text-amber-700 border-amber-200' },
      CANCELLED: { label: 'Annullato', className: 'bg-zinc-100 text-zinc-600 border-zinc-200' }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    return <Badge className={config.className}>{config.label}</Badge>
  }

  const handleAction = async (id: string, action: 'cancel' | 'delete') => {
    const confirmMessage = action === 'cancel' 
      ? 'Vuoi davvero annullare questo pagamento? Verrà escluso dal Libro Cassa e i totali del documento verranno aggiornati.'
      : 'Vuoi ELIMINARE DEFINITIVAMENTE questo pagamento? Questa azione non è reversibile e i totali del documento verranno ricalcolati.';
    
    if (!confirm(confirmMessage)) return;
    
    try {
      const url = `/api/payments/${id}`;
      const method = action === 'cancel' ? 'PATCH' : 'DELETE';
      const body = action === 'cancel' ? JSON.stringify({ status: 'CANCELLED' }) : undefined;
      
      const res = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body
      });
      
      const result = await res.json();
      
      if (result.success) {
        toast({ title: 'Successo', description: result.message });
        await refreshPaymentsData()
      } else {
        toast({ title: 'Errore', description: result.error || 'Operazione fallita', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Errore', description: 'Errore di rete', variant: 'destructive' });
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Vuoi eliminare definitivamente questa spesa registrata?')) return

    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE'
      })

      const result = await res.json()

      if (result.success) {
        toast({ title: 'Successo', description: result.message || 'Spesa eliminata' })
        await refreshPaymentsData()
        setShowPaymentDetails(false)
      } else {
        toast({ title: 'Errore', description: result.error || 'Eliminazione fallita', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Errore', description: 'Errore di rete', variant: 'destructive' })
    }
  }

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'BANK_TRANSFER': return <Building className="h-4 w-4" />
      case 'CASH': return <Banknote className="h-4 w-4" />
      case 'CREDIT_CARD': return <CreditCard className="h-4 w-4" />
      case 'PAYPAL': return <Wallet className="h-4 w-4" />
      default: return <CreditCard className="h-4 w-4" />
    }
  }

  const getMethodLabel = (method: string) => {
    const methodConfig = {
      BANK_TRANSFER: 'Bonifico Bancario',
      CASH: 'Contanti',
      CREDIT_CARD: 'Carta di Credito',
      PAYPAL: 'PayPal',
      CHECK: 'Assegno',
      STRIPE: 'Stripe'
    }
    
    return methodConfig[method as keyof typeof methodConfig] || method
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

  const isExpenseEntry = (payment: Payment) => payment.entryType === 'EXPENSE'

  const getPaymentDocumentLabel = (payment: Payment) => {
    if (isExpenseEntry(payment)) {
      return payment.reference || 'Spesa'
    }

    return payment.invoice?.number || payment.estimate?.number || payment.order?.number || payment.reference || 'Pagamento libero'
  }

  const getPaymentCustomerLabel = (payment: Payment) => {
    if (isExpenseEntry(payment)) {
      return payment.category || 'Spesa manuale'
    }

    return payment.invoice?.customer?.name || payment.customer?.name || 'Nessun documento associato'
  }

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getOverdueDays = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = today.getTime() - due.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const handlePaymentClick = (payment: Payment) => {
    setSelectedPayment(payment)
    setShowPaymentDetails(true)
  }

  const filteredPayments = payments.filter((payment) => {
    const normalizedSearch = searchQuery.toLowerCase()
    const matchesSearch =
      getPaymentDocumentLabel(payment).toLowerCase().includes(normalizedSearch) ||
      getPaymentCustomerLabel(payment).toLowerCase().includes(normalizedSearch) ||
      getMethodLabel(payment.method).toLowerCase().includes(normalizedSearch) ||
      (payment.reference || '').toLowerCase().includes(normalizedSearch)

    const matchesStatus = selectedStatus === 'all' || payment.status === selectedStatus
    const matchesMethod = selectedMethod === 'all' || payment.method === selectedMethod

    return matchesSearch && matchesStatus && matchesMethod
  })

  const paymentStats: PaymentStats = stats ?? {
    totalPayments: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    overduePayments: 0,
    averagePayment: 0,
    paymentMethods: {},
    monthlyTrend: [],
    upcomingPayments: [],
    overdueInvoices: []
  }
  const topPaymentMethod = Object.keys(paymentStats.paymentMethods)[0] || 'N/A'
  const topPaymentMethodCount = Object.values(paymentStats.paymentMethods)[0]?.count || 0
  const topPaymentMethodLabel = topPaymentMethod === 'N/A' ? topPaymentMethod : getMethodLabel(topPaymentMethod)

  return (
    <PageShell
      title="Pagamenti"
      description="Gestione pagamenti e scadenzario"
      icon={CreditCard}
      theme="payments"
      actions={
        <>
          <Button variant="outline" size="sm" onClick={refreshPaymentsData} className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <RefreshCw className="h-4 w-4 mr-1.5" />Aggiorna
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowExpenseDialog(true)} className="border border-amber-300/60 bg-amber-500/90 text-white hover:bg-amber-600 hover:text-white shadow-[0_14px_30px_-18px_rgba(245,158,11,0.7)]">
            <Receipt className="h-4 w-4 mr-1.5" />Registra Spesa
          </Button>
          <Button size="sm" onClick={() => { setFormInvoiceId(undefined); setShowPaymentForm(true) }} className="border border-emerald-400/40 bg-emerald-500 text-white hover:bg-emerald-600 font-semibold shadow-[0_14px_30px_-18px_rgba(16,185,129,0.75)]">
            <Plus className="h-4 w-4 mr-1.5" />Registra Incasso
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
                      <p className="text-sm text-slate-500">Incassato Totale</p>
                      <p className="metric-value mt-1 text-2xl font-bold text-slate-900">{formatCurrency(paymentStats.totalRevenue)}</p>
                      <p className="mt-1 text-xs text-slate-500">{paymentStats.totalPayments} pagamenti</p>
                    </div>
                    <div className="p-3 rounded-xl bg-green-100">
                      <DollarSign className="h-6 w-6 text-green-600" />
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
                      <p className="text-sm text-slate-500">In Attesa</p>
                      <p className="metric-value mt-1 text-2xl font-bold text-slate-900">{paymentStats.pendingPayments}</p>
                      <p className="mt-1 text-xs text-slate-500">{paymentStats.overduePayments} scaduti</p>
                    </div>
                    <div className="p-3 rounded-xl bg-orange-100">
                      <Clock className="h-6 w-6 text-orange-600" />
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
                      <p className="text-sm text-slate-500">Media Pagamento</p>
                      <p className="metric-value mt-1 text-2xl font-bold text-slate-900">{formatCurrency(paymentStats.averagePayment)}</p>
                      <p className="text-xs text-gray-500 mt-1">Per transazione</p>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-100">
                      <TrendingUp className="h-6 w-6 text-blue-600" />
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
                      <p className="text-sm text-slate-500">Top Method</p>
                      <p className="mt-1 truncate text-2xl font-bold text-slate-900">{topPaymentMethodLabel}</p>
                      <p className="text-xs text-gray-500 mt-1">{topPaymentMethodCount} transazioni</p>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-100">
                      <CreditCard className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

        {/* Upcoming and Overdue Payments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Scadenze Prossime
                </CardTitle>
                <CardDescription>
                  Pagamenti in arrivo nei prossimi 30 giorni
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentStats.upcomingPayments.slice(0, 5).length > 0 ? paymentStats.upcomingPayments.slice(0, 5).map((payment) => (
                    <div key={payment.invoiceId} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium">{payment.invoiceNumber}</p>
                        <p className="text-sm text-gray-600">{payment.customerName}</p>
                        <p className="text-xs text-gray-500">
                          Scade: {formatDate(payment.dueDate)} ({payment.daysUntilDue} giorni)
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(payment.amount)}</p>
                        <Badge variant="outline" className="text-xs">
                          {payment.daysUntilDue <= 7 ? 'Imminente' : 'Programmato'}
                        </Badge>
                      </div>
                    </div>
                  )) : (
                    <EmptyState
                      icon={Calendar}
                      title="Nessun dato disponibile"
                      description="Non ci sono scadenze imminenti da mostrare."
                      className="py-10"
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Pagamenti Scaduti
                </CardTitle>
                <CardDescription>
                  Fatture con pagamenti in ritardo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentStats.overdueInvoices.slice(0, 5).length > 0 ? paymentStats.overdueInvoices.slice(0, 5).map((invoice) => (
                    <div key={invoice.invoiceId} className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                      <div>
                        <p className="font-medium text-red-900">{invoice.invoiceNumber}</p>
                        <p className="text-sm text-red-700">{invoice.customerName}</p>
                        <p className="text-xs text-red-600">
                          Scaduto da {invoice.daysOverdue} giorni
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-red-900">{formatCurrency(invoice.amount)}</p>
                        <Badge variant="destructive" className="text-xs">
                          Urgente
                        </Badge>
                      </div>
                    </div>
                  )) : (
                    <EmptyState
                      icon={AlertTriangle}
                      title="Nessun dato disponibile"
                      description="Non ci sono pagamenti scaduti da gestire."
                      className="py-10"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Cerca pagamenti..."
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
                    <SelectItem value="PAID">Pagati</SelectItem>
                    <SelectItem value="PENDING">In attesa</SelectItem>
                    <SelectItem value="OVERDUE">Scaduti</SelectItem>
                    <SelectItem value="PARTIAL">Parziali</SelectItem>
                    <SelectItem value="CANCELLED">Annullati</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Metodo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i metodi</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bonifico</SelectItem>
                    <SelectItem value="CASH">Contanti</SelectItem>
                    <SelectItem value="CREDIT_CARD">Carta di Credito</SelectItem>
                    <SelectItem value="PAYPAL">PayPal</SelectItem>
                    <SelectItem value="CHECK">Assegno</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Oggi</SelectItem>
                    <SelectItem value="week">Questa settimana</SelectItem>
                    <SelectItem value="month">Questo mese</SelectItem>
                    <SelectItem value="quarter">Questo trimestre</SelectItem>
                    <SelectItem value="year">Quest'anno</SelectItem>
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

        {/* Payments Table */}
        <Card>
          <CardHeader>
            <CardTitle>Elenco Pagamenti ({filteredPayments.length})</CardTitle>
            <CardDescription>
              Gestione completa pagamenti e scadenzario
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && payments.length === 0 ? (
              <PageShellLoading label="Caricamento pagamenti..." theme="payments" />
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer"
                    onClick={() => handleSort('paymentDate')}
                  >
                    <div className="flex items-center">
                      Data
                      {sortBy === 'paymentDate' && (
                        <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Fattura</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Importo</TableHead>
                  <TableHead>Metodo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Scadenza</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((payment) => {
                  const isExpense = isExpenseEntry(payment)
                  const dueDate = payment.invoice?.dueDate || null
                  const daysUntilDue = dueDate ? getDaysUntilDue(dueDate) : null
                  const isOverdue = daysUntilDue !== null && daysUntilDue < 0 && payment.status !== 'PAID'
                  
                  return (
                    <TableRow 
                      key={payment.id}
                      className={`cursor-pointer hover:bg-gray-50 ${isExpense ? 'bg-rose-50/40' : payment.status === 'CANCELLED' ? 'bg-zinc-50' : isOverdue ? 'bg-red-50' : ''}`}
                      onClick={() => handlePaymentClick(payment)}
                    >
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium">
                            {payment.paymentDate ? formatDate(payment.paymentDate) : 'Non pagato'}
                          </div>
                          <div className="text-gray-500">
                            {formatDate(payment.createdAt)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{getPaymentDocumentLabel(payment)}</div>
                        {payment.reference && (
                          <div className="text-sm text-gray-500">Ref: {payment.reference}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{getPaymentCustomerLabel(payment)}</div>
                          {payment.invoice?.customer?.email && (
                            <div className="text-sm text-gray-500">{payment.invoice.customer.email}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className={`font-medium ${isExpense ? 'text-red-600' : 'text-green-600'}`}>
                            {isExpense ? '-' : '+'}{formatCurrency(payment.amount)}
                          </div>
                          <div className="text-gray-500">
                            {isExpense ? 'Spesa registrata' : payment.invoice ? `di ${formatCurrency(payment.invoice.totalAmount)}` : 'Incasso libero'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {getMethodIcon(payment.method)}
                          <span className="ml-2 text-sm">{getMethodLabel(payment.method)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{isExpense ? <Badge className="bg-rose-100 text-rose-700 border-rose-200">Spesa</Badge> : getStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{dueDate ? formatDate(dueDate) : '-'}</div>
                          {daysUntilDue !== null && (
                            <div className={`text-xs ${
                              daysUntilDue < 0 ? 'text-red-600' : 
                              daysUntilDue <= 7 ? 'text-orange-600' : 'text-green-600'
                            }`}>
                              {daysUntilDue < 0 ? `Scaduto da ${Math.abs(daysUntilDue)} giorni` :
                               daysUntilDue === 0 ? 'Scade oggi' :
                               `Tra ${daysUntilDue} giorni`}
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
                            <DropdownMenuItem onClick={() => { setSelectedPayment(payment); setShowPaymentDetails(true) }}>
                              <Eye className="mr-2 h-4 w-4" /> Dettagli
                            </DropdownMenuItem>
                            {!isExpense && payment.status !== 'CANCELLED' && (
                              <DropdownMenuItem onClick={() => handleAction(payment.id, 'cancel')}>
                                <X className="mr-2 h-4 w-4 text-orange-600" /> <span className="text-orange-600">Annulla</span>
                              </DropdownMenuItem>
                            )}
                            {!isExpense && <DropdownMenuItem onClick={() => handleAction(payment.id, 'delete')}>
                              <Trash2 className="mr-2 h-4 w-4 text-red-600" /> <span className="text-red-600">Elimina</span>
                            </DropdownMenuItem>}
                            {isExpense && <DropdownMenuItem onClick={() => handleDeleteExpense(payment.id)}>
                              <Trash2 className="mr-2 h-4 w-4 text-red-600" /> <span className="text-red-600">Elimina Spesa</span>
                            </DropdownMenuItem>}
                            {!isExpense && <DropdownMenuItem onClick={() => { window.open(`/api/payments/${payment.id}/receipt`, '_blank') }}>
                              <FileText className="h-4 w-4 mr-2" />
                              Ricevuta
                            </DropdownMenuItem>}
                            {payment.invoiceId && (
                              <DropdownMenuItem onClick={() => downloadPrintDocument('invoice', payment.invoiceId!)}>
                                <Download className="h-4 w-4 mr-2" />
                                Scarica PDF Fattura
                              </DropdownMenuItem>
                            )}
                            {payment.invoiceId && (
                              <DropdownMenuItem onClick={() => { setFormInvoiceId(payment.invoiceId || undefined); setShowPaymentForm(true) }}>
                              <CreditCard className="h-4 w-4 mr-2" />
                              Registra Rata
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filteredPayments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-8">
                      <EmptyState
                        icon={CreditCard}
                        title="Nessun dato disponibile"
                        description="Non ci sono pagamenti da mostrare con i filtri correnti."
                        actionLabel="Registra il primo incasso"
                        onAction={() => { setFormInvoiceId(undefined); setShowPaymentForm(true) }}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>

        {/* Payment Details Dialog */}
        <Dialog open={showPaymentDetails} onOpenChange={setShowPaymentDetails}>
          <DialogContent className={getPopupDialogContentClassName("max-w-4xl max-h-[90vh] overflow-y-auto")}>
            <PopupHeader
              theme="payments"
              title="Dettagli Pagamento"
              description="Informazioni complete pagamento e fattura associata"
            />
            
            {selectedPayment && (
              <div className="space-y-6 p-6">
                {/* Payment Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informazioni Pagamento</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Importo</label>
                        <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedPayment.amount)}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Data Pagamento</label>
                        <p>
                          {selectedPayment.paymentDate 
                            ? formatDate(selectedPayment.paymentDate)
                            : 'Non ancora pagato'
                          }
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Metodo</label>
                          <div className="flex items-center">
                            {getMethodIcon(selectedPayment.method)}
                            <span className="ml-2">{getMethodLabel(selectedPayment.method)}</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Stato</label>
                          <div>{isExpenseEntry(selectedPayment) ? <Badge className="bg-rose-100 text-rose-700 border-rose-200">Spesa</Badge> : getStatusBadge(selectedPayment.status)}</div>
                        </div>
                      </div>
                      
                      {selectedPayment.reference && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Riferimento</label>
                          <p>{selectedPayment.reference}</p>
                        </div>
                      )}

                      {selectedPayment.category && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Categoria</label>
                          <p>{selectedPayment.category}</p>
                        </div>
                      )}
                      
                      {selectedPayment.notes && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Note</label>
                          <p>{selectedPayment.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Documento Associato</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedPayment.invoice ? (
                        <>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Fattura</label>
                            <p className="font-medium">{selectedPayment.invoice.number}</p>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium text-gray-600">Cliente</label>
                            <p>{selectedPayment.invoice.customer.name}</p>
                            {selectedPayment.invoice.customer.email && (
                              <p className="text-sm text-gray-500">{selectedPayment.invoice.customer.email}</p>
                            )}
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium text-gray-600">Importo Fattura</label>
                            <p>{formatCurrency(selectedPayment.invoice.totalAmount)}</p>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium text-gray-600">Data Scadenza</label>
                            <p>{formatDate(selectedPayment.invoice.dueDate)}</p>
                          </div>
                          
                          <div>
                            <label className="text-sm font-medium text-gray-600">Saldo Rimanente</label>
                            <p className={`font-bold ${
                              (selectedPayment.invoice.totalAmount - selectedPayment.amount) > 0 
                                ? 'text-orange-600' 
                                : 'text-green-600'
                            }`}>
                              {formatCurrency(selectedPayment.invoice.totalAmount - selectedPayment.amount)}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Documento associato</label>
                            <p className="font-medium">
                              {isExpenseEntry(selectedPayment)
                                ? 'Spesa manuale / uscita contabile'
                                : selectedPayment.estimate?.number || selectedPayment.order?.number || 'Nessuna fattura collegata'}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Descrizione</label>
                            <p>
                              {isExpenseEntry(selectedPayment)
                                ? selectedPayment.reference || selectedPayment.category || 'Spesa registrata manualmente'
                                : selectedPayment.reference || 'Pagamento libero / non legato a una fattura'}
                            </p>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4">
                  {selectedPayment.invoiceId && (
                    <Button variant="outline" onClick={() => { setShowPaymentDetails(false); setFormInvoiceId(selectedPayment.invoiceId || undefined); setShowPaymentForm(true) }}>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Registra Rata
                    </Button>
                  )}
                  {selectedPayment.invoiceId && (
                    <Button onClick={() => openPrintDocument('invoice', selectedPayment.invoiceId!)} className={getPopupPrimaryButtonClassName('payments')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Stampa Fattura
                    </Button>
                  )}
                  {selectedPayment.invoiceId && (
                    <Button variant="outline" onClick={() => downloadPrintDocument('invoice', selectedPayment.invoiceId!)}>
                      <Download className="h-4 w-4 mr-2" />
                      Scarica PDF
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <PaymentForm
        open={showPaymentForm}
        onClose={() => setShowPaymentForm(false)}
        onSuccess={() => { setShowPaymentForm(false); void refreshPaymentsData() }}
        invoiceId={formInvoiceId}
      />

      {/* Registra Spesa Dialog */}
      <Dialog open={showExpenseDialog} onOpenChange={setShowExpenseDialog}>
        <DialogContent className={getPopupDialogContentClassName("max-w-lg")}>
          <PopupHeader
            theme="cashBook"
            title="Registra Spesa"
            description="Aggiungi una uscita di cassa aziendale"
            icon={Receipt}
          />
          <div className="space-y-4 p-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoria *</Label>
                <Select value={expCategory} onValueChange={setExpCategory}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Data *</Label>
                <Input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} className="mt-1" />
              </div>
            </div>
            <div>
              <Label>Descrizione</Label>
              <Input value={expDescription} onChange={e => setExpDescription(e.target.value)}
                placeholder="Es. Acquisto materiali, pagamento affitto..." className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Importo (€) *</Label>
                <Input type="number" min="0" step="0.01" value={expAmount}
                  onChange={e => setExpAmount(e.target.value)}
                  placeholder="0.00" className="mt-1" />
              </div>
              <div>
                <Label>Metodo Pagamento</Label>
                <Select value={expMethod} onValueChange={setExpMethod}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS_EXP.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Note</Label>
              <Textarea value={expNotes} onChange={e => setExpNotes(e.target.value)}
                placeholder="Note aggiuntive..." rows={2} className="mt-1" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setShowExpenseDialog(false)}>Annulla</Button>
              <Button onClick={handleSaveExpense} disabled={expLoading} className={getPopupPrimaryButtonClassName('cashBook')}>
                {expLoading ? 'Salvataggio...' : 'Registra Spesa'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}

