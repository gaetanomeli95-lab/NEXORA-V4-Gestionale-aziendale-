"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, Plus, Download, Edit, Trash2, Users, Building, Building2,
  Phone, Mail, MapPin, RefreshCw 
} from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { getPopupDialogContentClassName, getPopupPrimaryButtonClassName } from '@/components/layout/module-theme'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { PageShell, PageShellLoading } from '@/components/layout/page-shell'
import { PopupHeader } from '@/components/ui/popup-header'
import { ThemeTable, getThemeTableActionButtonClassName, getThemeTableEmptyStateActionClassName, getThemeTableEmptyStateClassName, getThemeTableHeadClassName, getThemeTableHeaderClassName, getThemeTableRowClassName, getThemeTableStickyCellClassName } from '@/components/ui/theme-table'

interface Supplier {
  id: string
  name: string
  contactName?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  vatNumber?: string
  _count?: {
    products: number
  }
}

export default function SuppliersPage() {
  const { toast } = useToast()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
  const [formData, setFormData] = useState<Partial<Supplier>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/suppliers')
      const result = await response.json()
      if (result.success) {
        setSuppliers(result.data.suppliers || [])
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenNew = () => {
    setEditingSupplier(null)
    setFormData({ name: '', contactName: '', phone: '', email: '', address: '', city: '', vatNumber: '' })
    setShowForm(true)
  }

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier(sup)
    setFormData({ 
      name: sup.name, 
      contactName: sup.contactName || '',
      phone: sup.phone || '',
      email: sup.email || '',
      address: sup.address || '',
      city: sup.city || '',
      vatNumber: sup.vatNumber || ''
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name?.trim()) return
    setSaving(true)
    try {
      const url = editingSupplier ? `/api/suppliers/${editingSupplier.id}` : '/api/suppliers'
      const method = editingSupplier ? 'PATCH' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const result = await response.json()
      if (result.success) {
        toast({ title: 'Salvato', description: 'Fornitore salvato con successo' })
        setShowForm(false)
        fetchSuppliers()
      } else {
        toast({ title: 'Errore', description: result.error || 'Errore salvataggio', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Errore', description: 'Errore di rete', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo fornitore?')) return
    try {
      const res = await fetch(`/api/suppliers/${id}`, { method: 'DELETE' })
      const result = await res.json()
      if (result.success) {
        toast({ title: 'Eliminato', description: 'Fornitore eliminato' })
        fetchSuppliers()
      } else {
        toast({ title: 'Errore', description: result.error || 'Impossibile eliminare', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Errore', description: 'Errore di rete', variant: 'destructive' })
    }
  }

  const handleExportCSV = () => {
    const rows = [
      ['Ragione Sociale', 'Contatto', 'Email', 'Telefono', 'P.IVA', 'Città'],
      ...suppliers.map(s => [
        s.name, s.contactName || '', s.email || '', s.phone || '', s.vatNumber || '', s.city || ''
      ])
    ]
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'fornitori.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.contactName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.vatNumber || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <PageShell
      title="Fornitori"
      description="Gestione rubrica fornitori"
      icon={Building2}
      theme="suppliers"
      actions={
        <>
          <Button variant="outline" size="sm" onClick={fetchSuppliers} className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <RefreshCw className="h-4 w-4 mr-1.5" />Aggiorna
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <Download className="h-4 w-4 mr-1.5" />Esporta
          </Button>
          <Button size="sm" onClick={handleOpenNew} className="border border-slate-400/40 bg-slate-600 text-white hover:bg-slate-700 font-semibold shadow-[0_14px_30px_-18px_rgba(71,85,105,0.75)]">
            <Plus className="h-4 w-4 mr-1.5" />Nuovo Fornitore
          </Button>
        </>
      }
    >
      <div className="space-y-6">

        {/* List */}
        <Card>
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Lista Fornitori</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                <Input placeholder="Cerca fornitore..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-9" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6">
                <PageShellLoading label="Caricamento fornitori..." theme="suppliers" className="min-h-[220px]" />
              </div>
            ) : filteredSuppliers.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={Building}
                  title="Nessun dato trovato"
                  description="Non ci sono fornitori da mostrare con i filtri correnti."
                  actionLabel="Crea il primo Fornitore"
                  onAction={handleOpenNew}
                  className={getThemeTableEmptyStateClassName('suppliers')}
                  actionClassName={getThemeTableEmptyStateActionClassName('suppliers')}
                />
              </div>
            ) : (
              <ThemeTable theme="suppliers">
                <TableHeader className={getThemeTableHeaderClassName('suppliers')}>
                  <TableRow>
                    <TableHead className={getThemeTableHeadClassName('suppliers')}>Ragione Sociale</TableHead>
                    <TableHead className={getThemeTableHeadClassName('suppliers')}>Contatti</TableHead>
                    <TableHead className={getThemeTableHeadClassName('suppliers')}>Indirizzo</TableHead>
                    <TableHead className={getThemeTableHeadClassName('suppliers')}>P.IVA</TableHead>
                    <TableHead className={getThemeTableHeadClassName('suppliers', 'sticky right-0 z-10 min-w-[88px] bg-slate-100/95 text-right')}>Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map(sup => (
                    <TableRow key={sup.id} className={getThemeTableRowClassName('suppliers')}>
                      <TableCell className="font-semibold text-slate-900">
                        {sup.name}
                        {sup.contactName && <div className="mt-1 flex items-center text-xs font-medium text-slate-500"><Users className="mr-1 h-3 w-3" />{sup.contactName}</div>}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          {sup.phone && <div className="flex items-center text-slate-700"><Phone className="mr-2 h-3 w-3" />{sup.phone}</div>}
                          {sup.email && <div className="flex items-center text-slate-700"><Mail className="mr-2 h-3 w-3" />{sup.email}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-700">
                          {sup.address && <div>{sup.address}</div>}
                          {sup.city && <div className="font-medium text-slate-500">{sup.city}</div>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-semibold text-slate-800">{sup.vatNumber || '-'}</TableCell>
                      <TableCell className={getThemeTableStickyCellClassName('suppliers', undefined, 'sticky right-0 z-10 min-w-[88px] text-right')}>
                        <Button variant="ghost" size="sm" className={getThemeTableActionButtonClassName('suppliers')} onClick={() => handleOpenEdit(sup)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-rose-600 hover:bg-rose-50 hover:text-rose-700" onClick={() => handleDelete(sup.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </ThemeTable>
            )}
          </CardContent>
        </Card>

        {/* Dialog Form */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className={getPopupDialogContentClassName("max-w-2xl")}>
            <PopupHeader
              theme="suppliers"
              title={editingSupplier ? 'Modifica Fornitore' : 'Nuovo Fornitore'}
              description="Gestisci i dati anagrafici del fornitore"
            />
            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label>Ragione Sociale *</Label>
                  <Input value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} required autoFocus />
                </div>
                <div>
                  <Label>Nome Contatto</Label>
                  <Input value={formData.contactName || ''} onChange={e => setFormData({ ...formData, contactName: e.target.value })} />
                </div>
                <div>
                  <Label>Partita IVA / C.F.</Label>
                  <Input value={formData.vatNumber || ''} onChange={e => setFormData({ ...formData, vatNumber: e.target.value })} />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input type="email" value={formData.email || ''} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div>
                  <Label>Telefono</Label>
                  <Input value={formData.phone || ''} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <Label>Indirizzo</Label>
                  <Input value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <Label>Città</Label>
                  <Input value={formData.city || ''} onChange={e => setFormData({ ...formData, city: e.target.value })} />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annulla</Button>
                <Button type="submit" disabled={saving || !formData.name?.trim()} className={getPopupPrimaryButtonClassName('suppliers')}>
                  {saving ? 'Salvataggio...' : 'Salva'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </PageShell>
  )
}
