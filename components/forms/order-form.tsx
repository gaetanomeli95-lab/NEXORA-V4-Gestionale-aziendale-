"use client"

import { useState, useEffect } from 'react'
import { useToast } from "@/hooks/use-toast"
import { getPopupDialogContentClassName, getPopupPrimaryButtonClassName } from '@/components/layout/module-theme'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { PopupHeader } from '@/components/ui/popup-header'
import { Plus, Trash2, Search, BookOpen, Package, UserPlus, X, CreditCard, Receipt } from 'lucide-react'
import { ContactPickerDialog } from '@/components/ui/contact-picker-dialog'
import { ProductPickerDialog } from '@/components/ui/product-picker-dialog'

interface Customer {
  id: string
  name: string
  email?: string
  address?: string
  city?: string
  province?: string
  postalCode?: string
  country?: string
  billingAddress?: string
  shippingAddress?: string
}

interface Product {
  id: string
  name: string
  sku?: string
  code?: string
  unitPrice: number
  unitOfMeasure: string
}

interface OrderItem {
  id: string
  productId?: string
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface OrderFormProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  order?: any
}

export function OrderForm({ open, onClose, onSuccess, order }: OrderFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [showCustomerPicker, setShowCustomerPicker] = useState(false)
  const [showProductPicker, setShowProductPicker] = useState(false)

  // Inline new customer
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [newCustName, setNewCustName] = useState('')
  const [newCustEmail, setNewCustEmail] = useState('')
  const [newCustPhone, setNewCustPhone] = useState('')
  const [newCustVat, setNewCustVat] = useState('')
  const [newCustCity, setNewCustCity] = useState('')
  const [newCustSaving, setNewCustSaving] = useState(false)

  // WFP-style payment history
  interface PaymentRow { id: string; date: string; amount: number; method: string; note: string }
  const PAYMENT_METHODS_LIST = ['CONTANTI', 'BONIFICO', 'CARTA', 'ASSEGNO', 'PAYPAL', 'ALTRO']
  const [paymentRows, setPaymentRows] = useState<PaymentRow[]>([])
  
  const addPaymentRow = () => setPaymentRows(prev => [...prev, {
    id: Date.now().toString(), date: new Date().toISOString().split('T')[0],
    amount: 0, method: 'CONTANTI', note: ''
  }])
  const removePaymentRow = (id: string) => setPaymentRows(prev => prev.filter(r => r.id !== id))
  const updatePaymentRow = (id: string, updates: Partial<PaymentRow>) =>
    setPaymentRows(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const [priority, setPriority] = useState('MEDIUM')
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('')
  const [shippingAddress, setShippingAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<OrderItem[]>([])

  useEffect(() => {
    if (open) {
      fetchCustomers()
      fetchProducts()
      if (order) {
        setSelectedCustomer(order.customer || null)
        setPriority(order.priority || 'MEDIUM')
        setExpectedDeliveryDate(order.expectedDeliveryDate?.split('T')[0] || '')
        setShippingAddress(order.shippingAddress || '')
        setNotes(order.notes || '')
        setItems(order.items?.map((item: any) => ({
          id: item.id || String(Date.now()),
          productId: item.productId,
          description: item.description || item.productName || '',
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          totalPrice: item.totalPrice || 0,
        })) || [])
        setPaymentRows(order.payments?.map((p: any) => ({
          id: p.id || Date.now().toString() + Math.random(),
          date: p.paymentDate ? p.paymentDate.split('T')[0] : new Date().toISOString().split('T')[0],
          amount: p.amount || 0,
          method: p.method || 'CONTANTI',
          note: p.note || ''
        })) || [])
      } else {
        resetForm()
      }
    }
  }, [open, order])

  const resetForm = () => {
    setSelectedCustomer(null)
    setPriority('MEDIUM')
    setExpectedDeliveryDate('')
    setShippingAddress('')
    setNotes('')
    setItems([])
    setPaymentRows([])
    setCustomerSearch('')
    setProductSearch('')
  }

  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers?limit=500')
      const result = await res.json()
      if (result.success) setCustomers(result.data.customers || [])
    } catch { /* ignore */ }
  }

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products?limit=500&status=ACTIVE')
      const result = await res.json()
      if (result.success) setProducts(result.data.products || [])
    } catch { /* ignore */ }
  }

  const addItem = (product?: Product) => {
    if (product) {
      setItems(prev => [...prev, {
        id: Date.now().toString(),
        productId: product.id,
        description: product.name,
        quantity: 1,
        unitPrice: product.unitPrice,
        totalPrice: product.unitPrice,
      }])
    } else {
      setItems(prev => [...prev, {
        id: Date.now().toString(),
        description: '',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0,
      }])
    }
  }

  const updateItem = (id: string, field: string, value: any) => {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item
      const updated = { ...item, [field]: value }
      if (field === 'quantity' || field === 'unitPrice') {
        updated.totalPrice = updated.quantity * updated.unitPrice
      }
      return updated
    }))
  }

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id))

  const totalAmount = items.reduce((sum, i) => sum + i.totalPrice, 0)
  const formatCurrency = (n: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n)

  const buildCustomerAddress = (customer: Customer) => {
    const structuredAddress = [
      customer.address,
      [customer.postalCode, customer.city].filter(Boolean).join(' '),
      customer.province,
      customer.country
    ].filter(Boolean).join(', ')

    return customer.shippingAddress || customer.billingAddress || structuredAddress
  }

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(customerSearch.toLowerCase())
  )
  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku?.toLowerCase().includes(productSearch.toLowerCase())
  )

  const handleCreateInlineCustomer = async () => {
    if (!newCustName.trim()) {
      toast({ title: 'Errore', description: 'Il nome cliente è obbligatorio', variant: 'destructive' })
      return
    }
    setNewCustSaving(true)
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCustName.trim(),
          email: newCustEmail || undefined,
          phone: newCustPhone || undefined,
          vatNumber: newCustVat || undefined,
          city: newCustCity || undefined,
          type: 'COMPANY',
          status: 'ACTIVE'
        })
      })
      const result = await res.json()
      if (result.success) {
        const created = result.data
        setCustomers(prev => [created, ...prev])
        setSelectedCustomer(created)
        setShippingAddress(buildCustomerAddress(created))
        setShowNewCustomer(false)
        setNewCustName(''); setNewCustEmail(''); setNewCustPhone('')
        setNewCustVat(''); setNewCustCity('')
        toast({ title: 'Cliente creato', description: `${created.name} aggiunto con successo` })
      } else {
        toast({ title: 'Errore', description: result.error || 'Errore creazione cliente', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Errore', description: 'Errore di rete', variant: 'destructive' })
    } finally {
      setNewCustSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer) { toast({ title: "Campo obbligatorio", description: "Seleziona un cliente", variant: "destructive" }); return }
    if (items.length === 0) { toast({ title: "Campo obbligatorio", description: "Aggiungi almeno un articolo", variant: "destructive" }); return }

    const shouldDeductStock = !order && items.some((item) => Boolean(item.productId))
      ? window.confirm('Vuoi scaricare la merce dal magazzino?')
      : false

    setLoading(true)
    try {
      const totalAmount = items.reduce((sum, i) => sum + i.totalPrice, 0)
      const totalVersato = paymentRows.reduce((sum, r) => sum + (r.amount || 0), 0)
      const paymentStatus = totalVersato >= totalAmount && totalAmount > 0 ? 'PAID'
        : totalVersato > 0 ? 'PARTIAL' : 'PENDING'

      const payload = {
        customerId: selectedCustomer.id,
        priority,
        expectedDeliveryDate: expectedDeliveryDate || undefined,
        shippingAddress: shippingAddress || undefined,
        notes: notes || undefined,
        status: paymentStatus === 'PAID' ? 'COMPLETED' : 'PENDING',
        paymentStatus,
        amountPaid: totalVersato,
        items: items.map(item => ({
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })),
        payments: paymentRows.map(r => ({ date: r.date, amount: r.amount, method: r.method, note: r.note })),
        deductStock: shouldDeductStock,
      }
      const url = order ? `/api/orders/${order.id}` : '/api/orders'
      const method = order ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await res.json()
      if (result.success) {
        onSuccess?.()
        onClose()
      } else {
        toast({ title: "Errore", description: result.error || 'Errore durante il salvataggio', variant: "destructive" })
      }
    } catch {
      toast({ title: "Errore", description: "Errore di rete", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={getPopupDialogContentClassName("max-w-5xl max-h-[90vh] overflow-y-auto")}>
        <PopupHeader
          theme="orders"
          title={order ? 'Modifica Ordine Cliente' : 'Nuovo Ordine Cliente'}
          description="Inserisci i dati dell'ordine"
        />

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedCustomer ? (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                  <div>
                    <div className="font-medium">{selectedCustomer.name}</div>
                    {selectedCustomer.email && <div className="text-sm text-gray-500">{selectedCustomer.email}</div>}
                    {selectedCustomer.address && <div className="text-sm text-gray-500">{selectedCustomer.address}</div>}
                  </div>
                  <Button type="button" variant="outline" onClick={() => setSelectedCustomer(null)}>Cambia</Button>
                </div>
              ) : showNewCustomer ? (
                <div className="border rounded-lg p-4 bg-green-50 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-green-800 flex items-center gap-2"><UserPlus className="h-4 w-4" />Nuovo Cliente</span>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setShowNewCustomer(false)}><X className="h-4 w-4" /></Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div><Label>Nome / Ragione Sociale *</Label><Input value={newCustName} onChange={e => setNewCustName(e.target.value)} placeholder="Es. Mario Rossi Srl" /></div>
                    <div><Label>Email</Label><Input type="email" value={newCustEmail} onChange={e => setNewCustEmail(e.target.value)} placeholder="info@esempio.it" /></div>
                    <div><Label>Telefono</Label><Input value={newCustPhone} onChange={e => setNewCustPhone(e.target.value)} placeholder="+39 ..." /></div>
                    <div><Label>P.IVA</Label><Input value={newCustVat} onChange={e => setNewCustVat(e.target.value)} placeholder="IT12345678901" /></div>
                    <div><Label>Città</Label><Input value={newCustCity} onChange={e => setNewCustCity(e.target.value)} placeholder="Milano" /></div>
                  </div>
                  <div className="flex gap-2 justify-end pt-1">
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowNewCustomer(false)}>Annulla</Button>
                    <Button type="button" size="sm" onClick={handleCreateInlineCustomer} disabled={newCustSaving}>{newCustSaving ? 'Creazione...' : 'Crea e Seleziona'}</Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button type="button" className="flex-1 h-12 text-base border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700" variant="outline" onClick={() => setShowCustomerPicker(true)}>
                    <BookOpen className="h-5 w-5 mr-2" />Apri Rubrica Clienti
                  </Button>
                  <Button type="button" variant="outline" className="h-12" onClick={() => setShowNewCustomer(true)} title="Crea nuovo cliente">
                    <UserPlus className="h-5 w-5 mr-2" />O aggiungi nuovo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <ContactPickerDialog
            open={showCustomerPicker}
            onClose={() => setShowCustomerPicker(false)}
            onSelect={(c) => {
              const customer = c as Customer
              setSelectedCustomer(customer)
              setShippingAddress(buildCustomerAddress(customer))
            }}
            apiUrl="/api/customers"
            title="Seleziona Cliente"
            placeholder="Cerca cliente..."
            theme="orders"
            onCreateNew={(name) => { setShowNewCustomer(true); setNewCustName(name) }}
          />

          {/* Dettagli ordine */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Dettagli Ordine</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Priorità</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Bassa</SelectItem>
                      <SelectItem value="MEDIUM">Media</SelectItem>
                      <SelectItem value="HIGH">Alta</SelectItem>
                      <SelectItem value="URGENT">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Data Consegna Prevista</Label>
                  <Input type="date" value={expectedDeliveryDate} onChange={(e) => setExpectedDeliveryDate(e.target.value)} />
                </div>
                <div>
                  <Label>Indirizzo di Spedizione</Label>
                  <Input value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} placeholder="Via, Città, CAP" />
                </div>
              </div>
              <div className="mt-4">
                <Label>Note</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Note sull'ordine..." />
              </div>
            </CardContent>
          </Card>

          {/* Articoli */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Articoli
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setShowProductPicker(true)}>
                    <Package className="h-4 w-4 mr-1" />Aggiungi da Magazzino
                  </Button>
                  <Button type="button" size="sm" onClick={() => addItem()}><Plus className="h-4 w-4 mr-1" />Riga Manuale</Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {items.length > 0 ? (
                <div className="space-y-3">
                  {items.map(item => (
                    <div key={item.id} className="border rounded-lg p-3">
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
                        <div className="md:col-span-2">
                          <Label className="text-xs">Descrizione</Label>
                          <Input value={item.description} onChange={(e) => updateItem(item.id, 'description', e.target.value)} placeholder="Descrizione articolo" />
                        </div>
                        <div>
                          <Label className="text-xs">Quantità</Label>
                          <Input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} min="0" step="1" />
                        </div>
                        <div>
                          <Label className="text-xs">Prezzo Unit. (€)</Label>
                          <Input type="number" value={item.unitPrice} onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)} min="0" step="0.01" />
                        </div>
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <Label className="text-xs">Totale</Label>
                            <div className="text-sm font-medium p-2 border rounded bg-gray-50">{formatCurrency(item.totalPrice)}</div>
                          </div>
                          <Button type="button" variant="outline" size="sm" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="flex justify-end border-t pt-3">
                    <div className="text-lg font-bold">Totale Ordine: {formatCurrency(totalAmount)}</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">Seleziona un prodotto o aggiungi una riga manuale</div>
              )}
            </CardContent>
          </Card>

          <ProductPickerDialog
            open={showProductPicker}
            onClose={() => setShowProductPicker(false)}
            onSelect={(p) => addItem(p as Product)}
            apiUrl="/api/products"
            theme="orders"
            title="Seleziona Prodotto dal Magazzino"
            placeholder="Cerca per nome, SKU, codice..."
          />

          {/* Riepilogo e Acconti */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="h-5 w-5 text-blue-600" />
                Pagamenti e Acconti
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-700 flex items-center gap-2 text-sm">
                    <CreditCard className="h-4 w-4 text-blue-500" />
                    Storico Acconti / Saldi
                  </span>
                  <Button type="button" size="sm" onClick={addPaymentRow}
                    className="bg-green-600 hover:bg-green-700 text-white h-7 px-2 text-xs">
                    <Plus className="h-3 w-3 mr-1" /> Aggiungi Acconto
                  </Button>
                </div>
                {paymentRows.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Data</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Importo</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Metodo</th>
                          <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Nota</th>
                          <th className="px-3 py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {paymentRows.map(row => (
                          <tr key={row.id} className="border-t hover:bg-slate-50/50">
                            <td className="px-2 py-1.5">
                              <Input type="date" value={row.date}
                                onChange={e => updatePaymentRow(row.id, { date: e.target.value })}
                                className="h-8 text-xs w-36" />
                            </td>
                            <td className="px-2 py-1.5">
                              <Input type="number" min="0" step="0.01" value={row.amount || ''}
                                onChange={e => updatePaymentRow(row.id, { amount: parseFloat(e.target.value) || 0 })}
                                placeholder="0.00" className="h-8 text-xs w-28" />
                            </td>
                            <td className="px-2 py-1.5">
                              <Select value={row.method} onValueChange={v => updatePaymentRow(row.id, { method: v })}>
                                <SelectTrigger className="h-8 text-xs w-32"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  {PAYMENT_METHODS_LIST.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="px-2 py-1.5">
                              <Input value={row.note} onChange={e => updatePaymentRow(row.id, { note: e.target.value })}
                                placeholder="Note opzionali" className="h-8 text-xs" />
                            </td>
                            <td className="px-2 py-1.5 text-right">
                              <Button type="button" variant="ghost" size="sm" onClick={() => removePaymentRow(row.id)}
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6 bg-slate-50 border rounded-lg border-dashed">
                    <p className="text-sm text-gray-500">Nessun pagamento registrato. Clicca &quot;Aggiungi Acconto&quot; per iniziare.</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-6 border-t pt-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-1">Totale Ordine</p>
                  <p className="text-xl font-bold">{formatCurrency(totalAmount)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-1">Totale Versato</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(paymentRows.reduce((sum, r) => sum + (r.amount || 0), 0))}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500 mb-1">Da Pagare</p>
                  <p className="text-xl font-bold text-orange-600">
                    {formatCurrency(Math.max(0, totalAmount - paymentRows.reduce((sum, r) => sum + (r.amount || 0), 0)))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onClose}>Annulla</Button>
            <Button type="submit" disabled={loading} className={getPopupPrimaryButtonClassName('orders')}>
              {loading ? 'Salvataggio...' : (order ? 'Aggiorna' : 'Crea') + ' Ordine'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
