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
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { PopupHeader } from '@/components/ui/popup-header'
import { CalendarIcon, Plus, Trash2, Search, UserPlus, X, CreditCard, Receipt, BookOpen } from 'lucide-react'
import { ContactPickerDialog } from '@/components/ui/contact-picker-dialog'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

interface Customer {
  id: string
  name: string
  email?: string
  vatNumber?: string
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
  stockQuantity?: number
  trackStock?: boolean
  unitPrice: number
  costPrice?: number
  unitOfMeasure: string
  category?: { name: string }
}

interface EstimateItem {
  id: string
  productId?: string
  product?: Product
  code?: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
  discount: number
  taxRate: number
  taxAmount: number
  notes?: string
}

interface EstimateFormData {
  customerId?: string
  number: string
  issueDate: Date
  dueDate?: Date
  deliveryDate?: Date
  paymentMethod?: string
  notes?: string
  internalNotes?: string
  items: EstimateItem[]
}

interface EstimateFormProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  estimate?: any // For edit mode
}

interface PaymentRow {
  id: string
  date: string
  amount: number
  method: string
  type: 'ACCONTO' | 'SALDO'
  note: string
}

const PAYMENT_METHODS_LIST = ['CONTANTI', 'BONIFICO', 'CARTA', 'ASSEGNO', 'PAYPAL', 'ALTRO']
const DELIVERY_ADDRESS_MARKER = '[[DELIVERY_ADDRESS]]:'

const buildCustomerAddress = (customer?: Customer | null) => {
  if (!customer) return ''

  const structuredAddress = [
    customer.address,
    [customer.postalCode, customer.city].filter(Boolean).join(' '),
    customer.province,
    customer.country
  ].filter(Boolean).join(', ')

  return customer.shippingAddress || customer.billingAddress || structuredAddress
}

const parseEstimateInternalNotes = (value?: string) => {
  if (!value) {
    return {
      visibleNotes: '',
      deliveryAddress: ''
    }
  }

  let deliveryAddress = ''
  const visibleNotes = value
    .split('\n')
    .filter((line) => {
      if (line.startsWith(DELIVERY_ADDRESS_MARKER)) {
        deliveryAddress = line.slice(DELIVERY_ADDRESS_MARKER.length).trim()
        return false
      }

      return true
    })
    .join('\n')
    .trim()

  return {
    visibleNotes,
    deliveryAddress
  }
}

const composeEstimateInternalNotes = (visibleNotes?: string, deliveryAddress?: string) => {
  const parts: string[] = []

  if (visibleNotes?.trim()) {
    parts.push(visibleNotes.trim())
  }

  if (deliveryAddress?.trim()) {
    parts.push(`${DELIVERY_ADDRESS_MARKER}${deliveryAddress.trim()}`)
  }

  return parts.join('\n')
}

export function EstimateForm({ open, onClose, onSuccess, estimate }: EstimateFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [showCustomerPicker, setShowCustomerPicker] = useState(false)
  const [showProductSelect, setShowProductSelect] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)

  // Inline new customer
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [newCustName, setNewCustName] = useState('')
  const [newCustEmail, setNewCustEmail] = useState('')
  const [newCustPhone, setNewCustPhone] = useState('')
  const [newCustVat, setNewCustVat] = useState('')
  const [newCustCity, setNewCustCity] = useState('')
  const [newCustSaving, setNewCustSaving] = useState(false)

  // WFP-style payment history
  const [paymentRows, setPaymentRows] = useState<PaymentRow[]>([])
  const [globalDiscount, setGlobalDiscount] = useState(0)
  const [deliveryAddress, setDeliveryAddress] = useState('')

  const addPaymentRow = () => setPaymentRows(prev => [...prev, {
    id: Date.now().toString(), date: new Date().toISOString().split('T')[0],
    amount: 0, method: 'CONTANTI', type: 'ACCONTO', note: ''
  }])
  const removePaymentRow = (id: string) => setPaymentRows(prev => prev.filter(r => r.id !== id))
  const updatePaymentRow = (id: string, updates: Partial<PaymentRow>) =>
    setPaymentRows(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))

  const [formData, setFormData] = useState<EstimateFormData>({
    number: '',
    issueDate: new Date(),
    paymentMethod: 'BANK_TRANSFER',
    items: []
  })

  useEffect(() => {
    if (open) {
      fetchCustomers()
      fetchProducts()
      if (estimate) {
        const parsedInternalNotes = parseEstimateInternalNotes(estimate.internalNotes)
        // Edit mode - populate form
        setFormData({
          customerId: estimate.customerId,
          number: estimate.number,
          issueDate: estimate.issueDate ? new Date(estimate.issueDate) : new Date(),
          dueDate: estimate.dueDate ? new Date(estimate.dueDate) : undefined,
          deliveryDate: estimate.deliveryDate ? new Date(estimate.deliveryDate) : undefined,
          paymentMethod: estimate.paymentMethod || undefined,
          notes: estimate.notes || undefined,
          internalNotes: parsedInternalNotes.visibleNotes || undefined,
          items: estimate.items?.map((item: any) => ({
            id: item.id,
            productId: item.productId,
            code: item.code,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit || 'pz',
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            discount: item.discount || 0,
            taxRate: item.taxRate ?? 22,
            taxAmount: item.taxAmount || 0,
            notes: item.notes
          })) || []
        })
        setSelectedCustomer(estimate.customer || null)
        setDeliveryAddress(parsedInternalNotes.deliveryAddress || buildCustomerAddress(estimate.customer || null))
        setGlobalDiscount(estimate.discountAmount || 0)
        setPaymentRows(estimate.payments?.map((p: any) => ({
          id: p.id || Date.now().toString() + Math.random(),
          date: p.paymentDate ? p.paymentDate.split('T')[0] : new Date().toISOString().split('T')[0],
          amount: p.amount || 0,
          method: p.method || 'CONTANTI',
          type: p.type || 'ACCONTO',
          note: p.note || ''
        })) || [])
      } else {
        // New mode - generate number
        generateEstimateNumber()
        setSelectedCustomer(null)
        setDeliveryAddress('')
        setGlobalDiscount(0)
        setPaymentRows([])
        setFormData({
          number: '',
          issueDate: new Date(),
          paymentMethod: 'BANK_TRANSFER',
          items: []
        })
      }
    }
  }, [open, estimate])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers?limit=500')
      const result = await response.json()
      if (result.success) {
        setCustomers(result.data.customers || [])
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/products?limit=500')
      const result = await response.json()
      if (result.success) {
        setProducts(result.data.products || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const generateEstimateNumber = async () => {
    try {
      const year = new Date().getFullYear()
      const response = await fetch('/api/estimates/stats')
      const result = await response.json()
      if (result.success) {
        const count = result.data.totalEstimates || 0
        const number = `PRE-${year}-${String(count + 1).padStart(3, '0')}`
        setFormData(prev => ({ ...prev, number }))
      }
    } catch (error) {
      console.error('Error generating number:', error)
      const year = new Date().getFullYear()
      setFormData(prev => ({ ...prev, number: `PRE-${year}-001` }))
    }
  }

  const calculateItemTotals = (item: EstimateItem): EstimateItem => {
    const quantity = item.quantity || 1
    const unitPrice = item.unitPrice || 0
    const discount = item.discount || 0
    const taxRate = item.taxRate ?? 22
    
    const discountedPrice = unitPrice * (1 - discount / 100)
    const totalPrice = quantity * discountedPrice
    const taxAmount = totalPrice * (taxRate / 100)
    
    return {
      ...item,
      quantity,
      unitPrice,
      totalPrice,
      taxAmount
    }
  }

  const addItem = (product?: Product) => {
    const newItem: EstimateItem = {
      id: Date.now().toString(),
      productId: product?.id,
      product: product,
      code: product?.code || product?.sku || '',
      description: product?.name || '',
      quantity: 1,
      unit: product?.unitOfMeasure || 'pz',
      unitPrice: product?.unitPrice || 0,
      totalPrice: 0,
      discount: 0,
      taxRate: 22,
      taxAmount: 0
    }
    
    const calculatedItem = calculateItemTotals(newItem)
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, calculatedItem]
    }))
    setShowProductSelect(false)
    setProductSearch('')
  }

  const updateItem = (itemId: string, updates: Partial<EstimateItem>) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const updated = { ...item, ...updates }
          return calculateItemTotals(updated)
        }
        return item
      })
    }))
  }

  const removeItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }))
  }

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.totalPrice, 0)
    const taxAmount = formData.items.reduce((sum, item) => sum + item.taxAmount, 0)
    const grossTotal = subtotal + taxAmount
    const discountedTotal = Math.max(0, grossTotal - (globalDiscount || 0))
    const totalVersato = paymentRows.reduce((sum, r) => sum + (r.amount || 0), 0)
    const daPagare = Math.max(0, discountedTotal - totalVersato)
    const paymentStatus = totalVersato >= discountedTotal && discountedTotal > 0 ? 'PAGATO'
      : totalVersato > 0 ? 'PARZIALMENTE PAGATO' : 'NON PAGATO'
    return { subtotal, taxAmount, grossTotal, discountedTotal, totalVersato, daPagare, paymentStatus, totalAmount: discountedTotal }
  }

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
        setDeliveryAddress(buildCustomerAddress(created))
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

  const handleCustomerSelection = (customer: Customer) => {
    const registryAddress = buildCustomerAddress(customer)
    let nextDeliveryAddress = registryAddress

    if (registryAddress) {
      const keepRegistryAddress = window.confirm(`Mantenere lo stesso indirizzo in anagrafica?\n\n${registryAddress}\n\nPremi "Annulla" per digitare l'indirizzo manualmente.`)

      if (!keepRegistryAddress) {
        const manualAddress = window.prompt('Digita l\'indirizzo manualmente per questo preventivo.', deliveryAddress || registryAddress)
        nextDeliveryAddress = manualAddress?.trim() || registryAddress
      }
    } else {
      const manualAddress = window.prompt('Il cliente non ha un indirizzo completo in anagrafica. Digita l\'indirizzo manualmente per questo preventivo.', deliveryAddress || '')
      nextDeliveryAddress = manualAddress?.trim() || ''
    }

    setSelectedCustomer(customer)
    setDeliveryAddress(nextDeliveryAddress)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedCustomer) {
      toast({ title: "Campo obbligatorio", description: "Seleziona un cliente", variant: "destructive" })
      return
    }
    
    if (formData.items.length === 0) {
      toast({ title: "Campo obbligatorio", description: "Aggiungi almeno una riga al preventivo", variant: "destructive" })
      return
    }

    const canDeductStock = formData.items.some((item) => Boolean(item.productId)) && estimate?.stockStatus !== 'SCARICATO'
    const shouldDeductStock = canDeductStock
      ? window.confirm('Vuoi scaricare la merce dal magazzino?')
      : false
    
    setLoading(true)
    
    try {
      const { subtotal: sub, taxAmount: tax, discountedTotal: tot, totalVersato, daPagare, paymentStatus: pStatus } = calculateTotals()

      const payload = {
        ...formData,
        customerId: selectedCustomer.id,
        paymentStatus: pStatus,
        depositAmount: paymentRows.filter(r => r.type === 'ACCONTO').reduce((s, r) => s + r.amount, 0),
        paidAmount: totalVersato,
        balanceAmount: daPagare,
        discountAmount: globalDiscount,
        payments: paymentRows.map(r => ({ date: r.date, amount: r.amount, method: r.method, type: r.type, note: r.note })),
        issueDate: formData.issueDate.toISOString(),
        dueDate: formData.dueDate?.toISOString(),
        deliveryDate: formData.deliveryDate?.toISOString(),
        internalNotes: composeEstimateInternalNotes(formData.internalNotes, deliveryAddress),
        items: formData.items.map(item => ({
          productId: item.productId,
          code: item.code,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          discount: item.discount,
          taxRate: item.taxRate,
          notes: item.notes
        }))
      }

      const isEdit = Boolean(estimate?.id)
      const url = isEdit ? `/api/estimates/${estimate.id}` : '/api/estimates'
      const method = isEdit ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      const result = await response.json()
      
      if (result.success) {
        if (shouldDeductStock && result.data?.id) {
          const stockResponse = await fetch(`/api/estimates/${result.data.id}/scarica`, {
            method: 'POST'
          })
          const stockResult = await stockResponse.json()

          if (!stockResponse.ok || !stockResult.success) {
            toast({
              title: 'Preventivo salvato con avviso',
              description: stockResult.error || 'Il preventivo è stato salvato ma lo scarico di magazzino non è riuscito.',
              variant: 'destructive'
            })
          }
        }

        onSuccess?.()
        onClose()
      } else {
        toast({ title: "Errore", description: result.error || 'Errore durante il salvataggio', variant: "destructive" })
      }
    } catch (error) {
      console.error('Error saving estimate:', error)
      toast({ title: "Errore", description: "Errore durante il salvataggio", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.sku?.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.code?.toLowerCase().includes(productSearch.toLowerCase())
  )

  const { subtotal, taxAmount, totalAmount } = calculateTotals()

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={getPopupDialogContentClassName("max-w-6xl max-h-[90vh] overflow-y-auto")}>
        <PopupHeader
          theme="estimates"
          title={estimate ? 'Modifica Preventivo' : 'Nuovo Preventivo'}
          description={estimate ? 'Modifica i dettagli del preventivo' : 'Crea un nuovo preventivo'}
        />

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Customer Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedCustomer ? (
                <div className="space-y-3 rounded-lg border bg-blue-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-medium">{selectedCustomer.name}</div>
                      {selectedCustomer.email && <div className="text-sm text-gray-500">{selectedCustomer.email}</div>}
                      {selectedCustomer.vatNumber && <div className="text-sm text-gray-500">P.IVA: {selectedCustomer.vatNumber}</div>}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => { setSelectedCustomer(null); setDeliveryAddress('') }}>Cambia</Button>
                  </div>
                  <div>
                    <Label>Indirizzo documento / consegna</Label>
                    <Textarea
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      rows={2}
                      placeholder="Indirizzo usato per questo preventivo"
                    />
                  </div>
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
            onSelect={(c) => handleCustomerSelection(c as Customer)}
            apiUrl="/api/customers"
            title="Seleziona Cliente"
            placeholder="Cerca per nome, email, telefono, P.IVA..."
            theme="estimates"
            onCreateNew={(name) => { setShowNewCustomer(true); setNewCustName(name) }}
          />

          {/* General Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informazioni Generali</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="number">Numero Preventivo</Label>
                  <Input
                    id="number"
                    value={formData.number}
                    onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                    placeholder="Auto-generato"
                  />
                </div>
                
                <div>
                  <Label>Data Emissione</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {format(formData.issueDate, 'PPP', { locale: it })}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.issueDate}
                        onSelect={(date) => date && setFormData(prev => ({ ...prev, issueDate: date }))}
                        locale={it}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <Label>Data Scadenza</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.dueDate ? format(formData.dueDate, 'PPP', { locale: it }) : 'Seleziona'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.dueDate}
                        onSelect={(date) => setFormData(prev => ({ ...prev, dueDate: date }))}
                        locale={it}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <Label htmlFor="paymentMethod">Metodo Pagamento</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BANK_TRANSFER">Bonifico Bancario</SelectItem>
                      <SelectItem value="CASH">Contanti</SelectItem>
                      <SelectItem value="CREDIT_CARD">Carta di Credito</SelectItem>
                      <SelectItem value="PAYPAL">PayPal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="notes">Note Cliente</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Note visibili al cliente..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="internalNotes">Note Interne</Label>
                  <Textarea
                    id="internalNotes"
                    value={formData.internalNotes || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, internalNotes: e.target.value }))}
                    placeholder="Note interne..."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Righe Preventivo
                <Button type="button" onClick={() => setShowProductSelect(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi Riga
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {formData.items.length > 0 ? (
                <div className="space-y-4">
                  {formData.items.map((item, index) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-4">
                        <div className="lg:col-span-2">
                          <Label>Codice</Label>
                          <Input
                            value={item.code || ''}
                            onChange={(e) => updateItem(item.id, { code: e.target.value })}
                            placeholder="Codice articolo"
                          />
                        </div>
                        
                        <div className="lg:col-span-2">
                          <Label>Descrizione</Label>
                          <Input
                            value={item.description}
                            onChange={(e) => updateItem(item.id, { description: e.target.value })}
                            placeholder="Descrizione"
                          />
                        </div>
                        
                        <div>
                          <Label>Quantità</Label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, { quantity: parseFloat(e.target.value) || 0 })}
                            min="0"
                            step="0.01"
                          />
                        </div>
                        
                        <div>
                          <Label>U.M.</Label>
                          <Input
                            value={item.unit}
                            onChange={(e) => updateItem(item.id, { unit: e.target.value })}
                            placeholder="pz"
                          />
                        </div>
                        
                        <div>
                          <Label>Prezzo Unit.</Label>
                          <Input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updateItem(item.id, { unitPrice: parseFloat(e.target.value) || 0 })}
                            min="0"
                            step="0.01"
                          />
                        </div>
                        
                        <div>
                          <Label>Sconto %</Label>
                          <Input
                            type="number"
                            value={item.discount}
                            onChange={(e) => updateItem(item.id, { discount: parseFloat(e.target.value) || 0 })}
                            min="0"
                            max="100"
                            step="0.1"
                          />
                        </div>
                        
                        <div>
                          <Label>IVA %</Label>
                          <Input
                            type="number"
                            value={item.taxRate}
                            onChange={(e) => updateItem(item.id, { taxRate: parseFloat(e.target.value) || 0 })}
                            min="0"
                            max="100"
                            step="0.1"
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <div className="text-sm text-gray-600">
                          Totale riga: {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(item.totalPrice + item.taxAmount)}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {item.product?.trackStock && (
                        <div className="mt-1 text-xs font-medium text-blue-600">
                          Giacenza reale: {item.product.stockQuantity ?? 0} {item.product.unitOfMeasure || item.unit}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nessuna riga aggiunta. Clicca "Aggiungi Riga" per iniziare.
                </div>
              )}
              
              {/* Product Selection Modal */}
              {showProductSelect && (
                <div className="border rounded-lg p-4 mt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium">Seleziona Prodotto</h4>
                    <Button type="button" variant="outline" onClick={() => setShowProductSelect(false)}>
                      Annulla
                    </Button>
                  </div>
                  
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Cerca prodotto..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto">
                    {filteredProducts.length > 0 ? (
                      filteredProducts.map(product => (
                        <div
                          key={product.id}
                          className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                          onClick={() => addItem(product)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-gray-500">
                                {product.sku && `SKU: ${product.sku}`}
                                {product.code && ` • Cod: ${product.code}`}
                              </div>
                              {product.category && <Badge variant="outline" className="mt-1">{product.category.name}</Badge>}
                              {product.trackStock && (
                                <div className="mt-1 text-xs font-medium text-blue-600">
                                  Giacenza reale: {product.stockQuantity ?? 0} {product.unitOfMeasure}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="font-medium">
                                {new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(product.unitPrice)}
                              </div>
                              <div className="text-sm text-gray-500">{product.unitOfMeasure}</div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-gray-500 text-center">Nessun prodotto trovato</div>
                    )}
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => addItem()}
                  >
                    Aggiungi Riga Manuale
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Riepilogo + Storico Pagamenti (WFP style) */}
          {(() => {
            const { subtotal: st, taxAmount: tax, grossTotal, discountedTotal, totalVersato, daPagare, paymentStatus: pSt } = calculateTotals()
            const fmt = (n: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n)
            return (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-blue-600" />
                    Riepilogo e Pagamenti
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Sconto globale */}
                  <div className="flex items-center gap-3">
                    <Label className="whitespace-nowrap text-gray-600">Sconto Totale (€):</Label>
                    <Input type="number" min="0" step="0.01" value={globalDiscount || ''}
                      onChange={e => setGlobalDiscount(parseFloat(e.target.value) || 0)}
                      placeholder="0.00" className="w-36 h-8" />
                  </div>

                  {/* Storico Pagamenti */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-700 flex items-center gap-2 text-sm">
                        <CreditCard className="h-4 w-4 text-blue-500" />
                        Storico Pagamenti (Acconti / Saldi)
                      </span>
                      <Button type="button" size="sm" onClick={addPaymentRow}
                        className="bg-green-600 hover:bg-green-700 text-white h-7 px-2 text-xs">
                        <Plus className="h-3 w-3 mr-1" /> Aggiungi
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
                              <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">Tipo</th>
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
                                  <Select value={row.type} onValueChange={v => updatePaymentRow(row.id, { type: v as 'ACCONTO' | 'SALDO' })}>
                                    <SelectTrigger className="h-8 text-xs w-28"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="ACCONTO">Acconto</SelectItem>
                                      <SelectItem value="SALDO">Saldo</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </td>
                                <td className="px-2 py-1.5">
                                  <Input value={row.note}
                                    onChange={e => updatePaymentRow(row.id, { note: e.target.value })}
                                    placeholder="Nota..." className="h-8 text-xs" />
                                </td>
                                <td className="px-2 py-1.5">
                                  <Button type="button" variant="ghost" size="sm"
                                    onClick={() => removePaymentRow(row.id)}
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0">
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="border border-dashed rounded-lg p-3 text-center text-gray-400 text-xs">
                        Nessun pagamento registrato — clicca "+&nbsp;Aggiungi" per aggiungere acconti o saldi
                      </div>
                    )}
                  </div>

                  {/* Totali finali */}
                  <div className="flex justify-end">
                    <div className="w-72 space-y-1.5 bg-slate-50 rounded-xl p-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Totale Netto</span>
                        <span>{fmt(st)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Totale IVA</span>
                        <span>{fmt(tax)}</span>
                      </div>
                      {globalDiscount > 0 && (
                        <div className="flex justify-between text-sm text-orange-600">
                          <span>Sconto</span>
                          <span>- {fmt(globalDiscount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-bold text-base border-t pt-2 mt-1">
                        <span>TOTALE LORDO</span>
                        <span>{fmt(discountedTotal)}</span>
                      </div>
                      {totalVersato > 0 && (
                        <div className="flex justify-between text-sm text-green-600 font-medium">
                          <span>Totale Versato</span>
                          <span className="text-green-600">- {fmt(totalVersato)}</span>
                        </div>
                      )}
                      <div className={`flex justify-between font-bold text-xl border-t pt-2 ${
                        daPagare === 0 && discountedTotal > 0 ? 'text-green-600' : daPagare > 0 ? 'text-red-600' : 'text-gray-700'
                      }`}>
                        <span>DA PAGARE</span>
                        <span>{fmt(daPagare)}</span>
                      </div>
                      <div className="pt-1">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                          pSt === 'PAGATO' ? 'bg-green-100 text-green-700'
                          : pSt === 'PARZIALMENTE PAGATO' ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                        }`}>{pSt}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })()}

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit" disabled={loading} className={getPopupPrimaryButtonClassName('estimates')}>
              {loading ? 'Salvataggio...' : (estimate ? 'Aggiorna' : 'Crea') + ' Preventivo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
