"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Search, Plus, Edit, Trash2, Wrench, CheckCircle, Clock,
  XCircle, AlertTriangle, MoreHorizontal, RefreshCw, User,
  Printer, Package, DollarSign, Phone, BookOpen, Download, UserPlus
} from 'lucide-react'
import { ContactPickerDialog } from '@/components/ui/contact-picker-dialog'
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { formatDateTime } from '@/lib/utils'
import { getPopupDialogContentClassName, getPopupPrimaryButtonClassName } from '@/components/layout/module-theme'
import { PageShell } from '@/components/layout/page-shell'
import { PopupHeader } from '@/components/ui/popup-header'
import { downloadPrintDocument, openPrintDocument } from '@/lib/print-url'

interface RepairCustomer {
  id: string
  name: string
  email?: string
  phone?: string
}

interface Repair {
  id: string
  number: string
  repairDate: string
  deliveryDate?: string
  status: string
  paymentStatus: string
  description?: string
  brand?: string
  model?: string
  serialNumber?: string
  itemsPayload?: string
  subtotal: number
  depositAmount: number
  paidAmount: number
  totalAmount: number
  balanceAmount: number
  notes?: string
  internalNotes?: string
  customer?: RepairCustomer | null
  createdAt: string
}

interface RepairDetail extends Repair {
  previousRepairs?: Array<{
    id: string
    number: string
    repairDate: string
    status: string
    model?: string | null
    brand?: string | null
    totalAmount: number
  }>
  customerSales?: Array<{
    id: string
    number: string
    issueDate: string
    totalAmount: number
  }>
  warrantyInsight?: {
    status: 'ACTIVE' | 'EXPIRED' | 'UNKNOWN'
    warrantyMonths: number
    expiresAt?: string | null
    message: string
    sourceInvoice?: {
      id: string
      number: string
      issueDate: string
      totalAmount: number
    } | null
  }
}

const STATUS_OPTIONS = ['IN LAVORAZIONE', 'PRONTO', 'CONSEGNATO', 'ANNULLATO']
const PAYMENT_OPTIONS = ['NON PAGATO', 'ACCONTO', 'PAGATO']

const statusConfig: Record<string, { label: string; class: string; icon: any }> = {
  'IN LAVORAZIONE': { label: 'In Lavorazione', class: 'bg-blue-100 text-blue-700', icon: Wrench },
  'PRONTO': { label: 'Pronto', class: 'bg-green-100 text-green-700', icon: CheckCircle },
  'CONSEGNATO': { label: 'Consegnato', class: 'bg-emerald-100 text-emerald-700', icon: Package },
  'ANNULLATO': { label: 'Annullato', class: 'bg-red-100 text-red-700', icon: XCircle },
}

const paymentConfig: Record<string, { label: string; rowClass: string }> = {
  'NON PAGATO': { label: 'Non Pagato', rowClass: 'bg-red-50 hover:bg-red-100' },
  'ACCONTO': { label: 'Acconto', rowClass: 'bg-yellow-50 hover:bg-yellow-100' },
  'PAGATO': { label: 'Pagato', rowClass: 'bg-green-50 hover:bg-green-100' },
}

const emptyForm = {
  customerId: '',
  repairDate: new Date().toISOString().split('T')[0],
  deliveryDate: '',
  status: 'IN LAVORAZIONE',
  paymentStatus: 'NON PAGATO',
  description: '',
  brand: '',
  model: '',
  serialNumber: '',
  totalAmount: 0,
  depositAmount: 0,
  paidAmount: 0,
  notes: '',
  internalNotes: '',
}

export default function RepairsPage() {
  const { toast } = useToast()
  const [repairs, setRepairs] = useState<Repair[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterPayment, setFilterPayment] = useState('ALL')
  const [showForm, setShowForm] = useState(false)
  const [editingRepair, setEditingRepair] = useState<Repair | null>(null)
  const [selectedRepair, setSelectedRepair] = useState<RepairDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [formLoading, setFormLoading] = useState(false)
  const [customers, setCustomers] = useState<RepairCustomer[]>([])
  const [showCustomerPicker, setShowCustomerPicker] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<RepairCustomer | null>(null)

  useEffect(() => { fetchRepairs(); fetchCustomers() }, [])

  const fetchRepairs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/repairs?limit=500&tenantId=demo-tenant')
      const result = await res.json()
      if (result.success) setRepairs(result.data.repairs || [])
    } catch { toast({ title: 'Errore', description: 'Errore caricamento riparazioni', variant: 'destructive' }) }
    finally { setLoading(false) }
  }

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers?limit=500')
      const result = await res.json()
      if (result.success) setCustomers(result.data?.customers || result.data || [])
    } catch { /* ignore */ }
  }

  const update = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }))

  const openNew = () => {
    setEditingRepair(null)
    setForm({ ...emptyForm })
    setSelectedCustomer(null)
    setShowForm(true)
  }

  const openEdit = (repair: Repair) => {
    setEditingRepair(repair)
    setSelectedCustomer(repair.customer || null)
    setForm({
      customerId: repair.customer?.id || '',
      repairDate: repair.repairDate?.split('T')[0] || new Date().toISOString().split('T')[0],
      deliveryDate: repair.deliveryDate?.split('T')[0] || '',
      status: repair.status,
      paymentStatus: repair.paymentStatus,
      description: repair.description || '',
      brand: repair.brand || '',
      model: repair.model || '',
      serialNumber: repair.serialNumber || '',
      totalAmount: repair.totalAmount,
      depositAmount: repair.depositAmount,
      paidAmount: repair.paidAmount,
      notes: repair.notes || '',
      internalNotes: repair.internalNotes || '',
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.description && !form.brand) {
      toast({ title: 'Attenzione', description: 'Inserisci almeno una descrizione o il brand del dispositivo', variant: 'destructive' })
      return
    }
    setFormLoading(true)
    try {
      const payload = {
        ...form,
        customerId: selectedCustomer?.id || null,
        totalAmount: parseFloat(String(form.totalAmount)) || 0,
        depositAmount: parseFloat(String(form.depositAmount)) || 0,
        paidAmount: parseFloat(String(form.paidAmount)) || 0,
      }
      const url = editingRepair ? `/api/repairs/${editingRepair.id}` : '/api/repairs'
      const method = editingRepair ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const result = await res.json()
      if (result.success) {
        toast({ title: editingRepair ? 'Aggiornata' : 'Creata', description: `Riparazione ${editingRepair ? 'aggiornata' : 'creata'} con successo` })
        setShowForm(false)
        fetchRepairs()
      } else {
        toast({ title: 'Errore', description: result.error || 'Errore salvataggio', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Errore', description: 'Errore di rete', variant: 'destructive' })
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questa riparazione?')) return
    try {
      await fetch(`/api/repairs/${id}`, { method: 'DELETE' })
      toast({ title: 'Eliminata', description: 'Riparazione eliminata' })
      if (selectedRepair?.id === id) setSelectedRepair(null)
      fetchRepairs()
    } catch {
      toast({ title: 'Errore', description: 'Errore eliminazione', variant: 'destructive' })
    }
  }

  const openRepairDetails = async (repair: Repair) => {
    setSelectedRepair(repair)
    setDetailLoading(true)

    try {
      const res = await fetch(`/api/repairs/${repair.id}`)
      const result = await res.json()
      if (result.success && result.data) {
        setSelectedRepair(result.data)
      }
    } catch {
      toast({ title: 'Errore', description: 'Impossibile caricare il dettaglio completo della riparazione', variant: 'destructive' })
    } finally {
      setDetailLoading(false)
    }
  }

  const handleQuickStatus = async (repair: Repair, status: string) => {
    try {
      await fetch(`/api/repairs/${repair.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      fetchRepairs()
      if (selectedRepair?.id === repair.id) {
        await openRepairDetails(repair)
      }
    } catch { /* ignore */ }
  }

  const handleQuickPayment = async (repair: Repair, paymentStatus: string) => {
    try {
      const paidAmount = paymentStatus === 'PAGATO' ? repair.totalAmount : repair.paidAmount
      await fetch(`/api/repairs/${repair.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentStatus, paidAmount })
      })
      fetchRepairs()
      if (selectedRepair?.id === repair.id) {
        await openRepairDetails(repair)
      }
    } catch { /* ignore */ }
  }

  const fmt = (n: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n)
  const fmtDate = (d?: string) => d ? formatDateTime(d) : '—'

  const getWarrantyBadge = (status?: NonNullable<RepairDetail['warrantyInsight']>['status']) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Garanzia Attiva</Badge>
      case 'EXPIRED':
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">Garanzia Scaduta</Badge>
      default:
        return <Badge variant="outline">Garanzia da verificare</Badge>
    }
  }

  const repairTimeline = (repair: Repair) => [
    { key: 'entry', label: 'Accettazione', completed: true, date: repair.repairDate },
    { key: 'working', label: 'In lavorazione', completed: ['IN LAVORAZIONE', 'PRONTO', 'CONSEGNATO'].includes(repair.status), date: repair.status === 'IN LAVORAZIONE' ? repair.repairDate : undefined },
    { key: 'ready', label: 'Pronto', completed: ['PRONTO', 'CONSEGNATO'].includes(repair.status), date: repair.status === 'PRONTO' ? repair.deliveryDate : undefined },
    { key: 'delivered', label: 'Consegnato', completed: repair.status === 'CONSEGNATO', date: repair.status === 'CONSEGNATO' ? repair.deliveryDate : undefined },
  ]

  const filteredRepairs = repairs.filter(r => {
    const matchSearch = !search || [r.number, r.description, r.brand, r.model, r.serialNumber, r.customer?.name]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()))
    const matchStatus = filterStatus === 'ALL' || r.status === filterStatus
    const matchPayment = filterPayment === 'ALL' || r.paymentStatus === filterPayment
    return matchSearch && matchStatus && matchPayment
  })

  const stats = {
    total: repairs.length,
    inProgress: repairs.filter(r => r.status === 'IN LAVORAZIONE').length,
    ready: repairs.filter(r => r.status === 'PRONTO').length,
    unpaid: repairs.filter(r => r.paymentStatus === 'NON PAGATO').length,
    revenue: repairs.filter(r => r.paymentStatus === 'PAGATO').reduce((s, r) => s + r.totalAmount, 0)
  }

  return (
    <PageShell
      title="Riparazioni"
      description="Gestione riparazioni e assistenza tecnica"
      icon={Wrench}
      theme="repairs"
      actions={
        <>
          <Button variant="outline" size="sm" onClick={fetchRepairs} className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"><RefreshCw className="h-4 w-4 mr-1.5" />Aggiorna</Button>
          <Button size="sm" onClick={openNew} className="border border-rose-400/40 bg-rose-500 text-white hover:bg-rose-600 font-semibold shadow-[0_14px_30px_-18px_rgba(244,63,94,0.75)]"><Plus className="h-4 w-4 mr-1.5" />Nuova Riparazione</Button>
        </>
      }
    >
      <div className="space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Totali', value: stats.total, icon: Wrench, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-l-blue-500' },
            { label: 'In Lavorazione', value: stats.inProgress, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-l-orange-500' },
            { label: 'Pronte', value: stats.ready, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', border: 'border-l-green-500' },
            { label: 'Non Pagate', value: stats.unpaid, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100', border: 'border-l-red-500' },
            { label: 'Incassato', value: fmt(stats.revenue), icon: DollarSign, color: 'text-emerald-700', bg: 'bg-emerald-100', border: 'border-l-emerald-500' },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className={`border-l-4 ${s.border}`}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{s.label}</p>
                      <p className={`text-xl font-bold ${s.color} mt-0.5`}>{s.value}</p>
                    </div>
                    <div className={`p-2 rounded-lg ${s.bg}`}>
                      <s.icon className={`h-5 w-5 ${s.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Cerca per numero, cliente, dispositivo..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-44"><SelectValue placeholder="Stato" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tutti gli stati</SelectItem>
                  {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={filterPayment} onValueChange={setFilterPayment}>
                <SelectTrigger className="w-40"><SelectValue placeholder="Pagamento" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tutti</SelectItem>
                  {PAYMENT_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-3" />
                <span className="text-slate-500">Caricamento...</span>
              </div>
            ) : filteredRepairs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <Wrench className="mb-4 h-12 w-12 text-slate-300" />
                <p className="text-lg font-medium text-slate-800">Nessuna riparazione trovata</p>
                <p className="text-sm text-slate-500">Crea una nuova riparazione per iniziare</p>
                <Button className="mt-4" onClick={openNew}><Plus className="h-4 w-4 mr-2" />Nuova Riparazione</Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N°</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Dispositivo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Pagamento</TableHead>
                    <TableHead>Totale</TableHead>
                    <TableHead>Saldo</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRepairs.map(repair => {
                    const pc = paymentConfig[repair.paymentStatus] || { label: repair.paymentStatus, rowClass: 'hover:bg-slate-50' }
                    const sc = statusConfig[repair.status] || { label: repair.status, class: 'bg-slate-100 text-slate-600', icon: Wrench }
                    const StatusIcon = sc.icon
                    return (
                      <TableRow
                        key={repair.id}
                        className={`cursor-pointer transition-colors ${pc.rowClass}`}
                        onClick={() => openRepairDetails(repair)}
                      >
                        <TableCell className="font-mono font-medium text-blue-700">{repair.number}</TableCell>
                        <TableCell>
                          {repair.customer ? (
                            <div>
                              <div className="font-medium">{repair.customer.name}</div>
                              {repair.customer.phone && <div className="text-xs text-slate-500">{repair.customer.phone}</div>}
                            </div>
                          ) : <span className="text-slate-400">—</span>}
                        </TableCell>
                        <TableCell>
                          <div>
                            {repair.brand && <span className="font-medium">{repair.brand}</span>}
                            {repair.model && <span className="ml-1 text-slate-500">{repair.model}</span>}
                            {repair.description && <div className="max-w-[180px] truncate text-xs text-slate-500">{repair.description}</div>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div>{fmtDate(repair.repairDate)}</div>
                          {repair.deliveryDate && <div className="text-xs text-slate-400">Cons: {fmtDate(repair.deliveryDate)}</div>}
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${sc.class}`}>
                            <StatusIcon className="h-3 w-3" />{sc.label}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={repair.paymentStatus === 'PAGATO' ? 'default' : repair.paymentStatus === 'ACCONTO' ? 'secondary' : 'outline'}>
                            {pc.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{fmt(repair.totalAmount)}</TableCell>
                        <TableCell className={repair.balanceAmount > 0 ? 'text-orange-600 font-medium' : 'text-green-600 font-medium'}>
                          {fmt(repair.balanceAmount)}
                        </TableCell>
                        <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(repair)}><Edit className="h-4 w-4 mr-2" />Modifica</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openPrintDocument('repair', repair.id)}><Printer className="h-4 w-4 mr-2" />Stampa</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => downloadPrintDocument('repair', repair.id)}><Download className="h-4 w-4 mr-2" />Scarica PDF</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleQuickStatus(repair, 'PRONTO')}><CheckCircle className="h-4 w-4 mr-2" />Segna Pronto</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleQuickStatus(repair, 'CONSEGNATO')}><Package className="h-4 w-4 mr-2" />Segna Consegnato</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleQuickPayment(repair, 'PAGATO')}><DollarSign className="h-4 w-4 mr-2" />Segna Pagato</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDelete(repair.id)} className="text-red-600"><Trash2 className="h-4 w-4 mr-2" />Elimina</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={!!selectedRepair} onOpenChange={() => setSelectedRepair(null)}>
          <DialogContent className={getPopupDialogContentClassName("max-w-2xl max-h-[90vh] overflow-y-auto")}>
            {selectedRepair && (
              <>
                <PopupHeader
                  theme="repairs"
                  title={`Riparazione ${selectedRepair.number}`}
                  description={`${selectedRepair.brand || ''} ${selectedRepair.model || ''}`.trim() || 'Dettaglio riparazione'}
                />
                <div className="space-y-4 p-6">
                  {detailLoading && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Caricamento dettaglio avanzato riparazione...
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    {repairTimeline(selectedRepair).map((step) => (
                      <div key={step.key} className={`rounded-lg border p-3 ${step.completed ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{step.label}</p>
                        <p className={`mt-1 font-medium ${step.completed ? 'text-green-700' : 'text-slate-500'}`}>
                          {step.completed ? 'Completato' : 'In attesa'}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">{step.date ? fmtDate(step.date) : '—'}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-500">Cliente</p>
                      <p className="font-medium">{selectedRepair.customer?.name || '—'}</p>
                      {selectedRepair.customer?.phone && (
                        <p className="flex items-center gap-1 text-sm text-slate-500"><Phone className="h-3 w-3" />{selectedRepair.customer.phone}</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Data / Consegna Prevista</p>
                      <p className="font-medium">{fmtDate(selectedRepair.repairDate)}</p>
                      {selectedRepair.deliveryDate && <p className="text-sm text-slate-500">{fmtDate(selectedRepair.deliveryDate)}</p>}
                    </div>
                    {selectedRepair.serialNumber && (
                      <div>
                        <p className="text-xs text-slate-500">Seriale</p>
                        <p className="font-mono text-sm">{selectedRepair.serialNumber}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-slate-500">Stato Lavorazione</p>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusConfig[selectedRepair.status]?.class || 'bg-slate-100 text-slate-600'}`}>
                        {statusConfig[selectedRepair.status]?.label || selectedRepair.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-800">Insight Garanzia</p>
                        {getWarrantyBadge(selectedRepair.warrantyInsight?.status)}
                      </div>
                      <p className="text-sm text-slate-600">{selectedRepair.warrantyInsight?.message || 'Nessun dato garanzia disponibile.'}</p>
                      {selectedRepair.warrantyInsight?.sourceInvoice && (
                        <div className="text-sm text-slate-700">
                          <p className="font-medium">Vendita collegata: {selectedRepair.warrantyInsight.sourceInvoice.number}</p>
                          <p className="text-xs text-slate-500">{fmtDate(selectedRepair.warrantyInsight.sourceInvoice.issueDate)} • {fmt(selectedRepair.warrantyInsight.sourceInvoice.totalAmount)}</p>
                        </div>
                      )}
                      {selectedRepair.warrantyInsight?.expiresAt && (
                        <p className="text-xs text-slate-500">Scadenza stimata: {fmtDate(selectedRepair.warrantyInsight.expiresAt)}</p>
                      )}
                    </div>

                    <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                      <p className="text-sm font-semibold text-slate-800">Storico Cliente</p>
                      <p className="text-sm text-slate-600">Riparazioni precedenti: {selectedRepair.previousRepairs?.length || 0}</p>
                      <p className="text-sm text-slate-600">Vendite recenti: {selectedRepair.customerSales?.length || 0}</p>
                      {selectedRepair.previousRepairs && selectedRepair.previousRepairs.length > 0 && (
                        <div className="space-y-1 text-xs text-slate-500">
                          {selectedRepair.previousRepairs.slice(0, 2).map((repair) => (
                            <div key={repair.id}>{repair.number} • {repair.brand || 'Dispositivo'} {repair.model || ''} • {fmtDate(repair.repairDate)}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedRepair.description && (
                    <div>
                      <p className="text-xs text-slate-500">Problema / Descrizione</p>
                      <p className="rounded border bg-slate-50 p-2 text-sm text-slate-800">{selectedRepair.description}</p>
                    </div>
                  )}
                  {selectedRepair.notes && (
                    <div>
                      <p className="text-xs text-slate-500">Note</p>
                      <p className="text-sm">{selectedRepair.notes}</p>
                    </div>
                  )}
                  {!!selectedRepair.internalNotes && (
                    <div>
                      <p className="text-xs text-slate-500">Note Interne</p>
                      <p className="rounded border border-amber-200 bg-amber-50 p-2 text-sm text-slate-800">{selectedRepair.internalNotes}</p>
                    </div>
                  )}
                  <div className="rounded-lg border bg-slate-50 p-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div><p className="text-xs text-slate-500">Totale</p><p className="text-lg font-bold">{fmt(selectedRepair.totalAmount)}</p></div>
                      <div><p className="text-xs text-slate-500">Acconto</p><p className="text-lg font-bold text-yellow-600">{fmt(selectedRepair.depositAmount)}</p></div>
                      <div>
                        <p className="text-xs text-slate-500">Da Pagare</p>
                        <p className={`text-lg font-bold ${selectedRepair.balanceAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {fmt(selectedRepair.balanceAmount)}
                        </p>
                      </div>
                    </div>
                  </div>
                  {selectedRepair.customerSales && selectedRepair.customerSales.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs text-slate-500">Ultime Vendite Cliente</p>
                      <div className="space-y-2">
                        {selectedRepair.customerSales.slice(0, 3).map((sale) => (
                          <div key={sale.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                            <div>
                              <p className="font-medium text-slate-900">{sale.number}</p>
                              <p className="text-xs text-slate-500">{fmtDate(sale.issueDate)}</p>
                            </div>
                            <p className="font-medium text-slate-700">{fmt(sale.totalAmount)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 justify-end">
                    <Button variant="outline" size="sm" onClick={() => openPrintDocument('repair', selectedRepair.id)}>
                      <Printer className="h-4 w-4 mr-2" />Stampa
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => downloadPrintDocument('repair', selectedRepair.id)}>
                      <Download className="h-4 w-4 mr-2" />Scarica PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => { setSelectedRepair(null); openEdit(selectedRepair) }}>
                      <Edit className="h-4 w-4 mr-2" />Modifica
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleQuickStatus(selectedRepair, 'PRONTO')}>
                      <CheckCircle className="h-4 w-4 mr-2" />Segna Pronto
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleQuickStatus(selectedRepair, 'CONSEGNATO')}>
                      <Package className="h-4 w-4 mr-2" />Consegnato
                    </Button>
                    <Button size="sm" className={getPopupPrimaryButtonClassName('repairs')} onClick={() => handleQuickPayment(selectedRepair, 'PAGATO')}>
                      <DollarSign className="h-4 w-4 mr-2" />Pagato
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Form Dialog */}
        <Dialog open={showForm} onOpenChange={() => setShowForm(false)}>
          <DialogContent className={getPopupDialogContentClassName("max-w-3xl max-h-[90vh] overflow-y-auto")}>
            <PopupHeader
              theme="repairs"
              title={editingRepair ? 'Modifica Riparazione' : 'Nuova Riparazione'}
              description="Inserisci i dati della riparazione"
            />
            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              {/* Customer */}
              <div>
                <Label>Cliente</Label>
                {selectedCustomer ? (
                  <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50 mt-1">
                    <div>
                      <div className="font-medium">{selectedCustomer.name}</div>
                      {selectedCustomer.phone && <div className="text-sm text-slate-500">{selectedCustomer.phone}</div>}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setSelectedCustomer(null)}>Cambia</Button>
                  </div>
                ) : (
                  <div className="mt-1 flex gap-2">
                    <Button type="button" className="flex-1 h-11 border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700" variant="outline" onClick={() => setShowCustomerPicker(true)}>
                      <BookOpen className="h-4 w-4 mr-2" />Apri Rubrica Clienti
                    </Button>
                    <Button type="button" variant="outline" className="h-11" onClick={() => window.location.href = '/customers'} title="Crea nuovo cliente">
                      <UserPlus className="h-4 w-4 mr-2" />O aggiungi nuovo
                    </Button>
                  </div>
                )}
              </div>

              {/* Device info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label>Brand / Marca</Label><Input value={form.brand} onChange={e => update('brand', e.target.value)} placeholder="Es. Apple, Samsung" /></div>
                <div><Label>Modello</Label><Input value={form.model} onChange={e => update('model', e.target.value)} placeholder="Es. iPhone 14, S23" /></div>
                <div><Label>Numero Seriale</Label><Input value={form.serialNumber} onChange={e => update('serialNumber', e.target.value)} placeholder="IMEI / Seriale" /></div>
              </div>

              <div><Label>Descrizione Problema *</Label><Textarea value={form.description} onChange={e => update('description', e.target.value)} rows={3} placeholder="Descrivi il problema o il lavoro da eseguire..." /></div>

              {/* Dates & Status */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Data Entrata</Label>
                  <Input type="date" value={form.repairDate} onChange={e => update('repairDate', e.target.value)} />
                </div>
                <div>
                  <Label>Consegna Prevista</Label>
                  <Input type="date" value={form.deliveryDate} onChange={e => update('deliveryDate', e.target.value)} />
                </div>
                <div>
                  <Label>Stato Lavorazione</Label>
                  <Select value={form.status} onValueChange={v => update('status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Stato Pagamento</Label>
                  <Select value={form.paymentStatus} onValueChange={v => update('paymentStatus', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PAYMENT_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              {/* Amounts */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label>Totale (€)</Label><Input type="number" value={form.totalAmount} onChange={e => update('totalAmount', parseFloat(e.target.value) || 0)} min="0" step="0.01" /></div>
                <div><Label>Acconto (€)</Label><Input type="number" value={form.depositAmount} onChange={e => update('depositAmount', parseFloat(e.target.value) || 0)} min="0" step="0.01" /></div>
                <div>
                  <Label>Saldo Residuo</Label>
                  <div className={`h-10 flex items-center font-bold text-lg px-3 border rounded-md ${(form.totalAmount - form.depositAmount - form.paidAmount) > 0 ? 'text-red-600 bg-red-50' : 'text-green-600 bg-green-50'}`}>
                    {fmt(Math.max(0, (parseFloat(String(form.totalAmount)) || 0) - (parseFloat(String(form.depositAmount)) || 0) - (parseFloat(String(form.paidAmount)) || 0)))}
                  </div>
                </div>
              </div>

              <div><Label>Note (visibili al cliente)</Label><Textarea value={form.notes} onChange={e => update('notes', e.target.value)} rows={2} placeholder="Note da comunicare al cliente..." /></div>
              <div><Label>Note Interne</Label><Textarea value={form.internalNotes} onChange={e => update('internalNotes', e.target.value)} rows={2} placeholder="Note interne tecniche..." /></div>

              <div className="flex justify-end gap-3 pt-2 border-t">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annulla</Button>
                <Button type="submit" disabled={formLoading} className={getPopupPrimaryButtonClassName('repairs')}>
                  {formLoading ? 'Salvataggio...' : (editingRepair ? 'Aggiorna' : 'Crea') + ' Riparazione'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      <ContactPickerDialog
        open={showCustomerPicker}
        onClose={() => setShowCustomerPicker(false)}
        onSelect={(c) => setSelectedCustomer(c as RepairCustomer)}
        apiUrl="/api/customers"
        theme="repairs"
        title="Seleziona Cliente"
        placeholder="Cerca per nome, email, telefono..."
      />
      </div>
    </PageShell>
  )
}

