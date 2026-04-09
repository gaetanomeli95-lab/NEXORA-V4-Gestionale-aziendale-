"use client"

import { useState, useEffect } from 'react'
import { useToast } from "@/hooks/use-toast"
import { getPopupDialogContentClassName, getPopupPrimaryButtonClassName } from '@/components/layout/module-theme'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { PopupHeader } from '@/components/ui/popup-header'
import { Plus, Trash2, CalendarIcon, FileText, Search, BookOpen, UserPlus } from 'lucide-react'
import { ContactPickerDialog } from '@/components/ui/contact-picker-dialog'

interface Customer {
  id: string
  name: string
  email?: string
  vatNumber?: string
  fiscalCode?: string
}

interface Product {
  id: string
  name: string
  sku?: string
  code?: string
  unitPrice: number
  unitOfMeasure: string
  category?: { name: string }
}

interface InvoiceItemData {
  id: string
  productId?: string
  code?: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
  discount: number
  taxRate: number
  taxAmount: number
}

interface InvoiceFormProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  invoice?: any
}

export function InvoiceForm({ open, onClose, onSuccess, invoice }: InvoiceFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [showCustomerPicker, setShowCustomerPicker] = useState(false)
  const [showProductSelect, setShowProductSelect] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  const [number, setNumber] = useState('')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<InvoiceItemData[]>([])

  useEffect(() => {
    if (open) {
      fetchProducts()
      if (invoice) {
        setSelectedCustomer(invoice.customer || null)
        setNumber(invoice.number || '')
        setIssueDate(invoice.issueDate?.split('T')[0] || new Date().toISOString().split('T')[0])
        setDueDate(invoice.dueDate?.split('T')[0] || '')
        setPaymentMethod(invoice.paymentMethod || 'BANK_TRANSFER')
        setNotes(invoice.notes || '')
        setItems(invoice.items?.map((item: any) => ({
          id: item.id || Date.now().toString(),
          productId: item.productId,
          code: item.code || '',
          description: item.description || '',
          quantity: item.quantity || 1,
          unit: item.unit || 'pz',
          unitPrice: item.unitPrice || 0,
          totalPrice: item.totalPrice || 0,
          discount: item.discount || 0,
          taxRate: item.taxRate || 22,
          taxAmount: item.taxAmount || 0,
        })) || [])
      } else {
        resetForm()
      }
    }
  }, [open, invoice])

  const resetForm = () => {
    setSelectedCustomer(null)
    setNumber('')
    setIssueDate(new Date().toISOString().split('T')[0])
    setDueDate('')
    setPaymentMethod('BANK_TRANSFER')
    setNotes('')
    setItems([])
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=500')
      const result = await response.json()
      if (result.success) setProducts(result.data.products || [])
    } catch (error) { console.error('Error fetching products:', error) }
  }

  const calcItem = (item: InvoiceItemData): InvoiceItemData => {
    const qty = item.quantity || 1
    const price = item.unitPrice || 0
    const disc = item.discount || 0
    const tax = item.taxRate || 22
    const totalPrice = qty * price * (1 - disc / 100)
    const taxAmount = totalPrice * (tax / 100)
    return { ...item, totalPrice, taxAmount }
  }

  const addItem = (product?: Product) => {
    const newItem: InvoiceItemData = {
      id: Date.now().toString(),
      productId: product?.id,
      code: product?.code || product?.sku || '',
      description: product?.name || '',
      quantity: 1,
      unit: product?.unitOfMeasure || 'pz',
      unitPrice: product?.unitPrice || 0,
      totalPrice: 0,
      discount: 0,
      taxRate: 22,
      taxAmount: 0,
    }
    setItems(prev => [...prev, calcItem(newItem)])
    setShowProductSelect(false)
    setProductSearch('')
  }

  const updateItem = (id: string, updates: Partial<InvoiceItemData>) => {
    setItems(prev => prev.map(item => item.id === id ? calcItem({ ...item, ...updates }) : item))
  }

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }

  const subtotal = items.reduce((s, i) => s + i.totalPrice, 0)
  const taxAmount = items.reduce((s, i) => s + i.taxAmount, 0)
  const totalAmount = subtotal + taxAmount

  const fmt = (n: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n)

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku?.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.code?.toLowerCase().includes(productSearch.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer) { toast({ title: "Campo obbligatorio", description: "Seleziona un cliente", variant: "destructive" }); return }
    if (items.length === 0) { toast({ title: "Campo obbligatorio", description: "Aggiungi almeno una riga", variant: "destructive" }); return }

    const shouldDeductStock = !invoice && items.some((item) => Boolean(item.productId))
      ? window.confirm('Vuoi scaricare la merce dal magazzino?')
      : false

    setLoading(true)
    try {
      const payload = {
        customerId: selectedCustomer.id,
        items: items.map(item => ({
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          taxRate: item.taxRate,
        })),
        issueDate,
        dueDate: dueDate || undefined,
        paymentMethod,
        notes: notes || undefined,
        deductStock: shouldDeductStock,
      }
      const response = await fetch('/api/invoices', {
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
      console.error('Error saving invoice:', error)
      toast({ title: "Errore", description: "Errore durante il salvataggio", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={getPopupDialogContentClassName("max-w-6xl max-h-[90vh] overflow-y-auto")}>
        <PopupHeader
          theme="invoices"
          title={invoice ? 'Modifica Fattura' : 'Nuova Fattura'}
          description={invoice ? 'Modifica i dettagli della fattura' : 'Crea una nuova fattura'}
        />

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Customer */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Cliente</CardTitle></CardHeader>
            <CardContent>
              {selectedCustomer ? (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                  <div>
                    <div className="font-medium">{selectedCustomer.name}</div>
                    {selectedCustomer.email && <div className="text-sm text-gray-500">{selectedCustomer.email}</div>}
                    {selectedCustomer.vatNumber && <div className="text-sm text-gray-500">P.IVA: {selectedCustomer.vatNumber}</div>}
                  </div>
                  <Button type="button" variant="outline" onClick={() => setShowCustomerPicker(true)}>Cambia</Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowCustomerPicker(true)}>
                    <BookOpen className="h-4 w-4 mr-2" />Apri Rubrica Clienti
                  </Button>
                  <Button type="button" variant="outline" onClick={() => window.location.href = '/customers'} title="Crea nuovo cliente">
                    <UserPlus className="h-4 w-4 mr-2" />O aggiungi nuovo
                  </Button>
                </div>
              )}
              <ContactPickerDialog
                open={showCustomerPicker}
                onClose={() => setShowCustomerPicker(false)}
                onSelect={(c) => { setSelectedCustomer(c as Customer); setShowCustomerPicker(false) }}
                apiUrl="/api/customers"
                theme="invoices"
                title="Seleziona Cliente"
                placeholder="Cerca cliente..."
              />
            </CardContent>
          </Card>

          {/* General */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Informazioni Generali</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Numero Fattura</Label>
                  <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Auto-generato" />
                </div>
                <div>
                  <Label>Data Emissione</Label>
                  <Input type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
                </div>
                <div>
                  <Label>Data Scadenza</Label>
                  <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
                <div>
                  <Label>Metodo Pagamento</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BANK_TRANSFER">Bonifico Bancario</SelectItem>
                      <SelectItem value="CASH">Contanti</SelectItem>
                      <SelectItem value="CREDIT_CARD">Carta di Credito</SelectItem>
                      <SelectItem value="PAYPAL">PayPal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-4">
                <Label>Note</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Note fattura..." rows={2} />
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Righe Fattura
                <Button type="button" onClick={() => setShowProductSelect(true)}><Plus className="h-4 w-4 mr-2" />Aggiungi Riga</Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {items.length > 0 ? (
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-7 gap-3 items-end">
                        <div className="md:col-span-2">
                          <Label>Descrizione</Label>
                          <Input value={item.description} onChange={(e) => updateItem(item.id, { description: e.target.value })} />
                        </div>
                        <div>
                          <Label>Q.tà</Label>
                          <Input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })} min="0" step="0.01" />
                        </div>
                        <div>
                          <Label>Prezzo</Label>
                          <Input type="number" value={item.unitPrice} onChange={(e) => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })} min="0" step="0.01" />
                        </div>
                        <div>
                          <Label>Sconto %</Label>
                          <Input type="number" value={item.discount} onChange={(e) => updateItem(item.id, { discount: parseFloat(e.target.value) || 0 })} min="0" max="100" />
                        </div>
                        <div>
                          <Label>IVA %</Label>
                          <Input type="number" value={item.taxRate} onChange={(e) => updateItem(item.id, { taxRate: parseFloat(e.target.value) || 0 })} min="0" />
                        </div>
                        <div className="flex items-end justify-between">
                          <span className="text-sm font-medium">{fmt(item.totalPrice + item.taxAmount)}</span>
                          <Button type="button" variant="outline" size="sm" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">Nessuna riga. Clicca "Aggiungi Riga" per iniziare.</div>
              )}

              {showProductSelect && (
                <div className="border rounded-lg p-4 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Seleziona Prodotto</h4>
                    <Button type="button" variant="outline" onClick={() => setShowProductSelect(false)}>Annulla</Button>
                  </div>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input placeholder="Cerca prodotto..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="pl-10" />
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {filteredProducts.map(p => (
                      <div key={p.id} className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0" onClick={() => addItem(p)}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{p.name}</div>
                            <div className="text-sm text-gray-500">{p.sku || p.code || ''}</div>
                          </div>
                          <div className="font-medium">{fmt(p.unitPrice)}</div>
                        </div>
                      </div>
                    ))}
                    {filteredProducts.length === 0 && <div className="p-3 text-gray-500 text-center">Nessun prodotto trovato</div>}
                  </div>
                  <Button type="button" variant="outline" className="w-full mt-4" onClick={() => addItem()}>Aggiungi Riga Manuale</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-600">Subtotale</span><span>{fmt(subtotal)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-600">IVA</span><span>{fmt(taxAmount)}</span></div>
                <div className="flex justify-between text-lg font-bold border-t pt-2"><span>Totale</span><span>{fmt(totalAmount)}</span></div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onClose}>Annulla</Button>
            <Button type="submit" disabled={loading} className={getPopupPrimaryButtonClassName('invoices')}>
              {loading ? 'Salvataggio...' : (invoice ? 'Aggiorna' : 'Crea') + ' Fattura'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
