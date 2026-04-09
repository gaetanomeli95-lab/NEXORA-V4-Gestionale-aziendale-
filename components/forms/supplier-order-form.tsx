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
import { Plus, Trash2, Search, UserPlus, X, BookOpen } from 'lucide-react'
import { ContactPickerDialog } from '@/components/ui/contact-picker-dialog'

interface Supplier {
  id: string
  name: string
  email?: string
  phone?: string
}

interface Product {
  id: string
  name: string
  sku?: string
  code?: string
  unitPrice: number
  costPrice?: number
  stockQuantity?: number
  unitOfMeasure: string
  supplierId?: string
  supplierName?: string
}

interface SOItemData {
  id: string
  productId?: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
  taxRate: number
  notes: string
}

interface SupplierOrderFormProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  order?: any
}

export function SupplierOrderForm({ open, onClose, onSuccess, order }: SupplierOrderFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [showSupplierPicker, setShowSupplierPicker] = useState(false)
  const [showProductSelect, setShowProductSelect] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)

  // Inline new supplier
  const [showNewSupplier, setShowNewSupplier] = useState(false)
  const [newSuppName, setNewSuppName] = useState('')
  const [newSuppEmail, setNewSuppEmail] = useState('')
  const [newSuppPhone, setNewSuppPhone] = useState('')
  const [newSuppVat, setNewSuppVat] = useState('')
  const [newSuppCity, setNewSuppCity] = useState('')
  const [newSuppSaving, setNewSuppSaving] = useState(false)

  const [number, setNumber] = useState('')
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<SOItemData[]>([])

  useEffect(() => {
    if (open) {
      fetchSuppliers()
      fetchProducts()
      if (order) {
        setSelectedSupplier(order.supplier || null)
        setNumber(order.number || '')
        setOrderDate(order.orderDate?.split('T')[0] || new Date().toISOString().split('T')[0])
        setNotes(order.notes || '')
        setItems(order.items?.map((item: any) => ({
          id: item.id || Date.now().toString(),
          productId: item.productId,
          description: item.description || '',
          quantity: item.quantity || 1,
          unit: item.unit || 'pz',
          unitPrice: item.unitPrice || 0,
          totalPrice: item.totalPrice || 0,
          taxRate: item.taxRate || 22,
          notes: item.notes || '',
        })) || [])
      } else {
        resetForm()
      }
    }
  }, [open, order])

  const resetForm = () => {
    setSelectedSupplier(null)
    setNumber('')
    setOrderDate(new Date().toISOString().split('T')[0])
    setNotes('')
    setItems([])
    setShowNewSupplier(false)
    setNewSuppName(''); setNewSuppEmail(''); setNewSuppPhone('')
    setNewSuppVat(''); setNewSuppCity('')
  }

  const handleCreateInlineSupplier = async () => {
    if (!newSuppName.trim()) {
      toast({ title: 'Errore', description: 'Il nome fornitore è obbligatorio', variant: 'destructive' })
      return
    }
    setNewSuppSaving(true)
    try {
      const res = await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newSuppName.trim(),
          email: newSuppEmail || undefined,
          phone: newSuppPhone || undefined,
          vatNumber: newSuppVat || undefined,
          city: newSuppCity || undefined,
        })
      })
      const result = await res.json()
      if (result.success) {
        const created = result.data
        setSuppliers(prev => [created, ...prev])
        setSelectedSupplier(created)
        setShowNewSupplier(false)
        setNewSuppName(''); setNewSuppEmail(''); setNewSuppPhone('')
        setNewSuppVat(''); setNewSuppCity('')
        toast({ title: 'Fornitore creato', description: `${created.name} aggiunto con successo` })
      } else {
        toast({ title: 'Errore', description: result.error || 'Errore creazione fornitore', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Errore', description: 'Errore di rete', variant: 'destructive' })
    } finally {
      setNewSuppSaving(false)
    }
  }

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers?limit=500')
      const result = await response.json()
      if (result.success) setSuppliers(result.data?.suppliers || result.data || [])
    } catch (error) { console.error('Error fetching suppliers:', error) }
  }

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products?limit=500')
      const result = await res.json()
      if (result.success) setProducts(result.data.products || [])
    } catch { /* ignore */ }
  }

  const calcItem = (item: SOItemData): SOItemData => {
    const totalPrice = (item.quantity || 1) * (item.unitPrice || 0)
    return { ...item, totalPrice }
  }

  const addManualItem = () => {
    setItems(prev => [...prev, {
      id: `temp-${Date.now()}`,
      description: 'Nuovo articolo',
      quantity: 1,
      unit: 'pz',
      unitPrice: 0,
      totalPrice: 0,
      taxRate: 22,
      notes: ''
    }])
  }
  const addProduct = (product: Product) => {
    setItems(prev => [...prev, {
      id: `temp-${Date.now()}`,
      productId: product.id,
      description: product.name,
      quantity: 1,
      unit: product.unitOfMeasure || 'pz',
      unitPrice: product.costPrice || product.unitPrice || 0,
      totalPrice: product.costPrice || product.unitPrice || 0,
      taxRate: 22,
      notes: ''
    }])
    setShowProductSelect(false)
    setProductSearch('')
  }

  const updateItem = (id: string, updates: Partial<SOItemData>) => {
    setItems(prev => prev.map(item => item.id === id ? calcItem({ ...item, ...updates }) : item))
  }

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const totalAmount = items.reduce((s, i) => s + i.totalPrice, 0)
  const fmt = (n: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n)

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.sku?.toLowerCase().includes(productSearch.toLowerCase())
    const matchSupplier = selectedSupplier ? p.supplierId === selectedSupplier.id : true
    return matchSearch && matchSupplier
  })

  const hasSupplierProducts = selectedSupplier
    ? products.some(p => p.supplierId === selectedSupplier.id)
    : true

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSupplier) { toast({ title: "Campo obbligatorio", description: "Seleziona un fornitore", variant: "destructive" }); return }
    if (!number) { toast({ title: "Campo obbligatorio", description: "Inserisci il numero ordine", variant: "destructive" }); return }
    if (items.length === 0) { toast({ title: "Campo obbligatorio", description: "Aggiungi almeno una riga", variant: "destructive" }); return }
    setLoading(true)
    try {
      const payload = {
        supplierId: selectedSupplier.id,
        number,
        orderDate,
        notes: notes || undefined,
        items: items.map(item => ({
          id: item.id,
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
          notes: item.notes || undefined,
        })),
      }
      const response = await fetch(order ? `/api/supplier-orders/${order.id}` : '/api/supplier-orders', {
        method: order ? 'PATCH' : 'POST',
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
      console.error('Error saving supplier order:', error)
      toast({ title: "Errore", description: "Errore durante il salvataggio", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={getPopupDialogContentClassName("max-w-5xl max-h-[90vh] overflow-y-auto")}>
        <PopupHeader
          theme="supplierOrders"
          title={order ? 'Modifica Ordine Fornitore' : 'Nuovo Ordine Fornitore'}
          description="Ordine di acquisto al fornitore"
        />

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Supplier */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Fornitore</CardTitle></CardHeader>
            <CardContent>
              {selectedSupplier ? (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-indigo-50">
                  <div>
                    <div className="font-medium">{selectedSupplier.name}</div>
                    {selectedSupplier.email && <div className="text-sm text-gray-500">{selectedSupplier.email}</div>}
                    {selectedSupplier.phone && <div className="text-sm text-gray-500">{selectedSupplier.phone}</div>}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setSelectedSupplier(null)}>Cambia</Button>
                </div>
              ) : showNewSupplier ? (
                <div className="border rounded-lg p-4 bg-indigo-50 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-indigo-800 flex items-center gap-2"><UserPlus className="h-4 w-4" />Nuovo Fornitore</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowNewSupplier(false)}><X className="h-4 w-4" /></Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label>Nome / Ragione Sociale *</Label>
                      <Input value={newSuppName} onChange={e => setNewSuppName(e.target.value)} placeholder="Es. Rossi Forniture Srl" />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input type="email" value={newSuppEmail} onChange={e => setNewSuppEmail(e.target.value)} placeholder="info@fornitore.it" />
                    </div>
                    <div>
                      <Label>Telefono</Label>
                      <Input value={newSuppPhone} onChange={e => setNewSuppPhone(e.target.value)} placeholder="+39 ..." />
                    </div>
                    <div>
                      <Label>P.IVA / Cod. Fiscale</Label>
                      <Input value={newSuppVat} onChange={e => setNewSuppVat(e.target.value)} placeholder="IT12345678901" />
                    </div>
                    <div>
                      <Label>Città</Label>
                      <Input value={newSuppCity} onChange={e => setNewSuppCity(e.target.value)} placeholder="Milano" />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-1">
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowNewSupplier(false)}>Annulla</Button>
                    <Button type="button" size="sm" onClick={handleCreateInlineSupplier} disabled={newSuppSaving}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white">
                      {newSuppSaving ? 'Creazione...' : 'Crea e Seleziona'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button type="button" className="flex-1 h-12 text-base border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700" variant="outline" onClick={() => setShowSupplierPicker(true)}>
                    <BookOpen className="h-5 w-5 mr-2" />Apri Rubrica Fornitori
                  </Button>
                  <Button type="button" variant="outline" className="h-12" onClick={() => setShowNewSupplier(true)} title="Crea nuovo fornitore">
                    <UserPlus className="h-5 w-5 mr-2" />O aggiungi nuovo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <ContactPickerDialog
            open={showSupplierPicker}
            onClose={() => setShowSupplierPicker(false)}
            onSelect={(s) => setSelectedSupplier(s as Supplier)}
            apiUrl="/api/suppliers"
            theme="supplierOrders"
            title="Seleziona Fornitore"
            placeholder="Cerca fornitore..."
            onCreateNew={(name) => { setShowNewSupplier(true); setNewSuppName(name) }}
          />

          {/* General */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Informazioni Ordine</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Numero Ordine</Label>
                  <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="ORD-FOR-2024-001" required />
                </div>
                <div>
                  <Label>Data Ordine</Label>
                  <Input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
                </div>
                <div>
                  <Label>Note</Label>
                  <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Note ordine..." />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Articoli Ordinati
                <Button type="button" onClick={() => setShowProductSelect(true)}><Plus className="h-4 w-4 mr-2" />Aggiungi Articolo</Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {items.length > 0 ? (
                <div className="space-y-3">
                  {items.map((item) => {
                    const linkedProduct = item.productId ? products.find(product => product.id === item.productId) : undefined

                    return (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                        <div className="md:col-span-2">
                          <Label>Descrizione</Label>
                          <Input value={item.description} onChange={(e) => updateItem(item.id, { description: e.target.value })} />
                          {linkedProduct && (
                            <div className="mt-1 text-xs text-gray-500">
                              {linkedProduct.sku || linkedProduct.code || linkedProduct.name} • Giacenza attuale: {linkedProduct.stockQuantity || 0} {linkedProduct.unitOfMeasure || item.unit}
                            </div>
                          )}
                        </div>
                        <div>
                          <Label>Q.tà</Label>
                          <Input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })} min="0" step="0.01" />
                        </div>
                        <div>
                          <Label>Prezzo Acquisto</Label>
                          <Input type="number" value={item.unitPrice} onChange={(e) => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })} min="0" step="0.01" />
                        </div>
                        <div>
                          <Label>Totale</Label>
                          <div className="h-10 flex items-center font-medium">{fmt(item.totalPrice)}</div>
                        </div>
                        <div className="flex items-end">
                          <Button type="button" variant="outline" size="sm" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </div>
                  )})}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">Nessun articolo. Clicca "Aggiungi Articolo" per iniziare.</div>
              )}

              {showProductSelect && (
                <div className="border rounded-lg p-4 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Seleziona Prodotto</h4>
                    <Button type="button" variant="outline" onClick={() => setShowProductSelect(false)}>Annulla</Button>
                  </div>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder={selectedSupplier ? "Cerca tra i prodotti del fornitore..." : "Seleziona prima un fornitore..."}
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      onFocus={() => { if (selectedSupplier) setShowProductSelect(true); else toast({title: "Attenzione", description: "Seleziona prima un fornitore", variant: "default"}) }}
                      className="w-64 text-sm"
                    />
                  </div>
                  {selectedSupplier && !hasSupplierProducts && (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-2">
                      ⚠️ Nessun prodotto associato a <strong>{selectedSupplier.name}</strong>. Mostra tutti i prodotti.
                    </p>
                  )}
                  <div className="max-h-60 overflow-y-auto">
                    {filteredProducts.map(p => (
                      <div key={p.id} className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0" onClick={() => addProduct(p)}>
                        <div className="text-sm font-medium">{p.name}</div>
                        <div className="text-xs text-gray-500">
                          {[p.sku || p.code, `Costo: ${fmt(p.costPrice || p.unitPrice || 0)}`, `Giacenza: ${p.stockQuantity || 0} ${p.unitOfMeasure || 'pz'}`].filter(Boolean).join(' • ')}
                        </div>
                      </div>
                    ))}
                    {filteredProducts.length === 0 && (
                      <div className="p-3 text-sm text-gray-500 text-center">Nessun prodotto trovato per questo fornitore</div>
                    )}
                  </div>
                  <Button type="button" variant="outline" className="w-full mt-4" onClick={addManualItem}>Aggiungi Riga Manuale</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Total */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between text-lg font-bold">
                <span>Totale Ordine</span>
                <span>{fmt(totalAmount)}</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onClose}>Annulla</Button>
            <Button type="submit" disabled={loading} className={getPopupPrimaryButtonClassName('supplierOrders')}>
              {loading ? 'Salvataggio...' : (order ? 'Aggiorna' : 'Crea') + ' Ordine'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
