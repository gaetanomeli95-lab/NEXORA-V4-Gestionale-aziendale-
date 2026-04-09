"use client"

import { useState, useEffect } from 'react'
import { useToast } from "@/hooks/use-toast"
import { getPopupDialogContentClassName, getPopupPrimaryButtonClassName } from '@/components/layout/module-theme'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { PopupHeader } from '@/components/ui/popup-header'
import { Plus, Trash2, Search } from 'lucide-react'

interface Customer {
  id: string
  name: string
  email?: string
  address?: string
  city?: string
}

interface DdtItemData {
  id: string
  code: string
  description: string
  quantity: number
  unit: string
  notes: string
}

interface DdtFormProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  ddt?: any
}

export function DdtForm({ open, onClose, onSuccess, ddt }: DdtFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [showCustomerSelect, setShowCustomerSelect] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const [number, setNumber] = useState('')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [transportMethod, setTransportMethod] = useState('')
  const [referenceNumber, setReferenceNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<DdtItemData[]>([])

  useEffect(() => {
    if (open) {
      fetchCustomers()
      if (ddt) {
        setSelectedCustomer(ddt.customer || null)
        setNumber(ddt.number || '')
        setIssueDate(ddt.issueDate?.split('T')[0] || new Date().toISOString().split('T')[0])
        setTransportMethod(ddt.transportMethod || '')
        setReferenceNumber(ddt.referenceNumber || '')
        setNotes(ddt.notes || '')
        setItems(ddt.items?.map((item: any, i: number) => ({
          id: item.id || String(Date.now() + i),
          code: item.code || '',
          description: item.description || '',
          quantity: item.quantity || 1,
          unit: item.unit || 'pz',
          notes: item.notes || '',
        })) || [])
      } else {
        resetForm()
      }
    }
  }, [open, ddt])

  const resetForm = () => {
    setSelectedCustomer(null)
    setNumber('')
    setIssueDate(new Date().toISOString().split('T')[0])
    setTransportMethod('')
    setReferenceNumber('')
    setNotes('')
    setItems([])
  }

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers?limit=500')
      const result = await response.json()
      if (result.success) setCustomers(result.data.customers || [])
    } catch (error) { console.error('Error fetching customers:', error) }
  }

  const addItem = () => {
    setItems(prev => [...prev, {
      id: Date.now().toString(),
      code: '',
      description: '',
      quantity: 1,
      unit: 'pz',
      notes: '',
    }])
  }

  const updateItem = (id: string, updates: Partial<DdtItemData>) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item))
  }

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!number) { toast({ title: "Campo obbligatorio", description: "Inserisci il numero DDT", variant: "destructive" }); return }
    if (items.length === 0) { toast({ title: "Campo obbligatorio", description: "Aggiungi almeno una riga", variant: "destructive" }); return }
    setLoading(true)
    try {
      const payload = {
        customerId: selectedCustomer?.id,
        number,
        issueDate,
        transportMethod: transportMethod || undefined,
        referenceNumber: referenceNumber || undefined,
        notes: notes || undefined,
        items: items.map(item => ({
          code: item.code,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          notes: item.notes || undefined,
        })),
      }
      const response = await fetch('/api/ddts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json()
      if (result.success) {
        onSuccess?.()
        onClose()
      } else {
        toast({ title: "Errore", description: result.error || 'Errore durante il salvataggio', variant: "destructive" })
      }
    } catch (error) {
      console.error('Error saving DDT:', error)
      toast({ title: "Errore", description: "Errore durante il salvataggio", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={getPopupDialogContentClassName("max-w-5xl max-h-[90vh] overflow-y-auto")}>
        <PopupHeader
          theme="ddts"
          title={ddt ? 'Modifica DDT' : 'Nuovo DDT'}
          description="Documento di trasporto"
        />

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Customer */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Destinatario</CardTitle></CardHeader>
            <CardContent>
              {selectedCustomer ? (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                  <div>
                    <div className="font-medium">{selectedCustomer.name}</div>
                    {selectedCustomer.address && <div className="text-sm text-gray-500">{selectedCustomer.address}{selectedCustomer.city ? `, ${selectedCustomer.city}` : ''}</div>}
                  </div>
                  <Button type="button" variant="outline" onClick={() => setSelectedCustomer(null)}>Cambia</Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input placeholder="Cerca destinatario..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} onFocus={() => setShowCustomerSelect(true)} className="pl-10" />
                  </div>
                  {showCustomerSelect && customerSearch && (
                    <div className="border rounded-lg max-h-60 overflow-y-auto">
                      {filteredCustomers.length > 0 ? filteredCustomers.map(c => (
                        <div key={c.id} className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0" onClick={() => { setSelectedCustomer(c); setShowCustomerSelect(false); setCustomerSearch('') }}>
                          <div className="font-medium">{c.name}</div>
                          {c.city && <div className="text-sm text-gray-500">{c.city}</div>}
                        </div>
                      )) : <div className="p-3 text-gray-500 text-center">Nessun destinatario trovato</div>}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* General */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Informazioni DDT</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Numero DDT</Label>
                  <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="DDT-2024-001" required />
                </div>
                <div>
                  <Label>Data</Label>
                  <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
                </div>
                <div>
                  <Label>Mezzo di Trasporto</Label>
                  <Input value={transportMethod} onChange={(e) => setTransportMethod(e.target.value)} placeholder="Corriere, Mezzo proprio..." />
                </div>
                <div>
                  <Label>Rif. Documento</Label>
                  <Input value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} placeholder="Tracking, Rif. fattura..." />
                </div>
              </div>
              <div className="mt-4">
                <Label>Note</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Note di consegna..." rows={2} />
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Merce Trasportata
                <Button type="button" onClick={addItem}><Plus className="h-4 w-4 mr-2" />Aggiungi Riga</Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {items.length > 0 ? (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                        <div>
                          <Label>Codice</Label>
                          <Input value={item.code} onChange={(e) => updateItem(item.id, { code: e.target.value })} placeholder="Codice" />
                        </div>
                        <div className="md:col-span-2">
                          <Label>Descrizione</Label>
                          <Input value={item.description} onChange={(e) => updateItem(item.id, { description: e.target.value })} placeholder="Descrizione merce" />
                        </div>
                        <div>
                          <Label>Quantità</Label>
                          <Input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })} min="0" step="0.01" />
                        </div>
                        <div>
                          <Label>U.M.</Label>
                          <Input value={item.unit} onChange={(e) => updateItem(item.id, { unit: e.target.value })} placeholder="pz" />
                        </div>
                        <div className="flex items-end">
                          <Button type="button" variant="outline" size="sm" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">Nessuna merce. Clicca "Aggiungi Riga" per iniziare.</div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onClose}>Annulla</Button>
            <Button type="submit" disabled={loading} className={getPopupPrimaryButtonClassName('ddts')}>
              {loading ? 'Salvataggio...' : (ddt ? 'Aggiorna' : 'Crea') + ' DDT'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
