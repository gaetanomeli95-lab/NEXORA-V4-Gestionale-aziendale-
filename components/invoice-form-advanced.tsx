"use client"

import { useState, useEffect } from 'react'
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Trash2, 
  Search, 
  Calculator, 
  FileText, 
  Send, 
  Save, 
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  Building,
  Package,
  Calculator as CalculatorIcon,
  TrendingUp,
  Download,
  Printer,
  Mail,
  Settings,
  HelpCircle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface InvoiceItem {
  id: string
  productId?: string
  productName: string
  productSku?: string
  description: string
  quantity: number
  unitPrice: number
  discount: number
  discountType: 'percentage' | 'fixed'
  taxRate: number
  taxExempt: boolean
  totalPrice: number
  taxAmount: number
  deliveredQuantity: number
  notes?: string
}

interface Customer {
  id: string
  name: string
  email?: string
  vatNumber?: string
  paymentTerms?: string
  creditLimit: number
  billingAddress?: {
    street: string
    city: string
    postalCode: string
    country: string
  }
}

interface Product {
  id: string
  name: string
  sku?: string
  description?: string
  unitPrice: number
  costPrice?: number
  stockQuantity: number
  trackStock: boolean
  taxRate: number
  minStockLevel: number
}

interface InvoiceFormAdvancedProps {
  initialData?: any
  onSave?: (invoice: any) => void
  onCancel?: () => void
}

export default function InvoiceFormAdvanced({ initialData, onSave, onCancel }: InvoiceFormAdvancedProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('details')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [warnings, setWarnings] = useState<string[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [showCalculator, setShowCalculator] = useState(false)
  const [autoSave, setAutoSave] = useState(true)

  // Form State
  const [customerId, setCustomerId] = useState('')
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0])
  const [dueDate, setDueDate] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('NET30')
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER')
  const [notes, setNotes] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [terms, setTerms] = useState('')
  const [currency, setCurrency] = useState('EUR')

  // Items State
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: '1',
      productName: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      discountType: 'percentage',
      taxRate: 22,
      taxExempt: false,
      totalPrice: 0,
      taxAmount: 0,
      deliveredQuantity: 0
    }
  ])

  // Search State
  const [customerSearch, setCustomerSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [showCustomerResults, setShowCustomerResults] = useState(false)
  const [showProductResults, setShowProductResults] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])

  // Calculations
  const [subtotal, setSubtotal] = useState(0)
  const [totalTax, setTotalTax] = useState(0)
  const [totalAmount, setTotalAmount] = useState(0)
  const [totalDiscount, setTotalDiscount] = useState(0)

  // Advanced Settings
  const [electronicInvoice, setElectronicInvoice] = useState(false)
  const [sdiCode, setSdiCode] = useState('')
  const [pecEmail, setPecEmail] = useState('')
  const [workflowEnabled, setWorkflowEnabled] = useState(false)
  const [requireApproval, setRequireApproval] = useState(false)
  const [autoSend, setAutoSend] = useState(false)

  // Fetch data
  useEffect(() => {
    fetchCustomers()
    fetchProducts()
  }, [])

  useEffect(() => {
    calculateTotals()
    validateForm()
    if (autoSave) {
      const timer = setTimeout(() => {
        saveDraft()
      }, 30000) // Auto-save every 30 seconds
      return () => clearTimeout(timer)
    }
  }, [items, customerId])

  const fetchCustomers = async () => {
    try {
      const response = await fetch('/api/customers?limit=500')
      const result = await response.json()
      if (result.success) {
        setCustomers(result.data.customers)
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
        setProducts(result.data.products)
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const calculateTotals = () => {
    let newSubtotal = 0
    let newTotalTax = 0
    let newTotalDiscount = 0

    const updatedItems = items.map(item => {
      const itemTotal = item.quantity * item.unitPrice
      let discountAmount = 0

      if (item.discountType === 'percentage') {
        discountAmount = itemTotal * (item.discount / 100)
      } else {
        discountAmount = item.discount
      }

      const discountedTotal = itemTotal - discountAmount
      const taxAmount = item.taxExempt ? 0 : discountedTotal * (item.taxRate / 100)
      const finalTotal = discountedTotal + taxAmount

      newSubtotal += discountedTotal
      newTotalTax += taxAmount
      newTotalDiscount += discountAmount

      return {
        ...item,
        totalPrice: finalTotal,
        taxAmount
      }
    })

    setItems(updatedItems)
    setSubtotal(newSubtotal)
    setTotalTax(newTotalTax)
    setTotalAmount(newSubtotal + newTotalTax)
    setTotalDiscount(newTotalDiscount)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    const newWarnings: string[] = []

    // Customer validation
    if (!customerId) {
      newErrors.customer = 'Cliente obbligatorio'
    }

    // Items validation
    if (items.length === 0) {
      newErrors.items = 'Aggiungi almeno un articolo'
    }

    items.forEach((item, index) => {
      if (!item.description) {
        newErrors[`item_${index}_description`] = 'Descrizione obbligatoria'
      }
      if (item.quantity <= 0) {
        newErrors[`item_${index}_quantity`] = 'Quantità deve essere maggiore di 0'
      }
      if (item.unitPrice <= 0) {
        newErrors[`item_${index}_unitPrice`] = 'Prezzo unitario deve essere maggiore di 0'
      }
    })

    // Credit limit validation
    if (customer && customer.creditLimit > 0) {
      const currentDebt = totalAmount
      if (currentDebt > customer.creditLimit) {
        newWarnings.push(`Attenzione: Il totale della fattura (${formatCurrency(totalAmount)}) supera il limite di credito del cliente (${formatCurrency(customer.creditLimit)})`)
      }
    }

    // Stock validation
    items.forEach(item => {
      if (item.productId) {
        const product = products.find(p => p.id === item.productId)
        if (product && product.trackStock && item.quantity > product.stockQuantity) {
          newWarnings.push(`Attenzione: Quantità richiesta per ${product.name} (${item.quantity}) supera la giacenza disponibile (${product.stockQuantity})`)
        }
      }
    })

    // Due date validation
    if (dueDate && new Date(dueDate) < new Date(issueDate)) {
      newErrors.dueDate = 'La data di scadenza non può essere precedente alla data di emissione'
    }

    setErrors(newErrors)
    setWarnings(newWarnings)
  }

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      productName: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      discountType: 'percentage',
      taxRate: 22,
      taxExempt: false,
      totalPrice: 0,
      taxAmount: 0,
      deliveredQuantity: 0
    }
    setItems([...items, newItem])
  }

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const selectCustomer = (customer: Customer) => {
    setCustomerId(customer.id)
    setCustomer(customer)
    setCustomerSearch(customer.name)
    setShowCustomerResults(false)
    
    // Set payment terms from customer
    if (customer.paymentTerms) {
      setPaymentTerms(customer.paymentTerms)
    }
    
    // Calculate due date based on payment terms
    calculateDueDate(customer.paymentTerms || 'NET30')
  }

  const selectProduct = (product: Product, itemIndex: number) => {
    const updatedItems = [...items]
    updatedItems[itemIndex] = {
      ...updatedItems[itemIndex],
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      description: product.description || product.name,
      unitPrice: product.unitPrice,
      taxRate: product.taxRate
    }
    setItems(updatedItems)
    setProductSearch('')
    setShowProductResults(false)
  }

  const calculateDueDate = (terms: string) => {
    const issue = new Date(issueDate)
    let days = 30 // default NET30

    switch (terms) {
      case 'NET15': days = 15; break
      case 'NET30': days = 30; break
      case 'NET60': days = 60; break
      case 'NET90': days = 90; break
      case 'IMMEDIATE': days = 0; break
    }

    const due = new Date(issue)
    due.setDate(due.getDate() + days)
    setDueDate(due.toISOString().split('T')[0])
  }

  const saveDraft = async () => {
    try {
      const draftData = {
        customerId,
        issueDate,
        dueDate,
        paymentTerms,
        paymentMethod,
        notes,
        internalNotes,
        terms,
        items,
        status: 'DRAFT'
      }
      
      // Save to local storage or API
      localStorage.setItem('invoice_draft', JSON.stringify(draftData))
    } catch (error) {
      console.error('Error saving draft:', error)
    }
  }

  const saveInvoice = async (status: string = 'DRAFT') => {
    setLoading(true)
    try {
      const invoiceData = {
        customerId,
        issueDate,
        dueDate,
        paymentTerms,
        paymentMethod,
        notes,
        internalNotes,
        terms,
        items: items.map(item => ({
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          taxRate: item.taxRate
        })),
        status,
        electronicInvoice,
        sdiCode,
        pecEmail
      }

      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invoiceData)
      })

      const result = await response.json()
      
      if (result.success) {
        if (onSave) {
          onSave(result.data)
        }
        
        // Clear draft
        localStorage.removeItem('invoice_draft')
        
        // Show success message
        toast({ title: "Fattura salvata", description: `Fattura ${status === 'DRAFT' ? 'salvata come bozza' : 'creata'} con successo!` })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error('Error saving invoice:', error)
      toast({ title: "Errore", description: "Errore durante il salvataggio della fattura", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.email?.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.vatNumber?.toLowerCase().includes(customerSearch.toLowerCase())
  )

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.sku?.toLowerCase().includes(productSearch.toLowerCase()) ||
    product.description?.toLowerCase().includes(productSearch.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fattura Avanzata</h1>
          <p className="text-gray-600">Crea fatture con logica complessa e validazioni</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-save"
              checked={autoSave}
              onCheckedChange={setAutoSave}
            />
            <Label htmlFor="auto-save">Auto-salva</Label>
          </div>
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <Eye className="h-4 w-4 mr-2" />
            Anteprima
          </Button>
          <Button variant="outline" onClick={saveDraft}>
            <Save className="h-4 w-4 mr-2" />
            Salva Bozza
          </Button>
          <Button onClick={() => saveInvoice('SENT')} disabled={loading || Object.keys(errors).length > 0}>
            <Send className="h-4 w-4 mr-2" />
            {loading ? 'Invio...' : 'Invia Fattura'}
          </Button>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Attenzione</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Dettagli</TabsTrigger>
          <TabsTrigger value="items">Articoli</TabsTrigger>
          <TabsTrigger value="advanced">Avanzate</TabsTrigger>
          <TabsTrigger value="preview">Anteprima</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="h-5 w-5 mr-2" />
                  Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Input
                    placeholder="Cerca cliente..."
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value)
                      setShowCustomerResults(true)
                    }}
                    onFocus={() => setShowCustomerResults(true)}
                  />
                  {errors.customer && (
                    <p className="text-red-500 text-sm mt-1">{errors.customer}</p>
                  )}
                  
                  {showCustomerResults && customerSearch && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map((customer) => (
                          <div
                            key={customer.id}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            onClick={() => selectCustomer(customer)}
                          >
                            <div className="font-medium">{customer.name}</div>
                            {customer.vatNumber && (
                              <div className="text-sm text-gray-500">P.IVA: {customer.vatNumber}</div>
                            )}
                            {customer.email && (
                              <div className="text-sm text-gray-500">{customer.email}</div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-gray-500">Nessun cliente trovato</div>
                      )}
                    </div>
                  )}
                </div>

                {customer && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium">{customer.name}</h4>
                    {customer.billingAddress && (
                      <div className="text-sm text-gray-600 mt-1">
                        {customer.billingAddress.street}<br />
                        {customer.billingAddress.postalCode} {customer.billingAddress.city}<br />
                        {customer.billingAddress.country}
                      </div>
                    )}
                    <div className="mt-2 text-sm">
                      <span className="font-medium">Limite di credito:</span> {formatCurrency(customer.creditLimit)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invoice Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2" />
                  Dettagli Fattura
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="issueDate">Data emissione</Label>
                    <Input
                      id="issueDate"
                      type="date"
                      value={issueDate}
                      onChange={(e) => {
                        setIssueDate(e.target.value)
                        calculateDueDate(paymentTerms)
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="dueDate">Data scadenza</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                    {errors.dueDate && (
                      <p className="text-red-500 text-sm mt-1">{errors.dueDate}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Termini di pagamento</Label>
                    <Select value={paymentTerms} onValueChange={(value) => {
                      setPaymentTerms(value)
                      calculateDueDate(value)
                    }}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IMMEDIATE">Immediato</SelectItem>
                        <SelectItem value="NET15">15 giorni</SelectItem>
                        <SelectItem value="NET30">30 giorni</SelectItem>
                        <SelectItem value="NET60">60 giorni</SelectItem>
                        <SelectItem value="NET90">90 giorni</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Metodo di pagamento</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BANK_TRANSFER">Bonifico bancario</SelectItem>
                        <SelectItem value="CASH">Contanti</SelectItem>
                        <SelectItem value="CREDIT_CARD">Carta di credito</SelectItem>
                        <SelectItem value="PAYPAL">PayPal</SelectItem>
                        <SelectItem value="CHECK">Assegno</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Note</Label>
                  <Textarea
                    id="notes"
                    placeholder="Note per il cliente..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Items Tab */}
        <TabsContent value="items" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Package className="h-5 w-5 mr-2" />
                  Articoli
                </CardTitle>
                <Button onClick={addItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Aggiungi Articolo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {errors.items && (
                <p className="text-red-500 text-sm mb-4">{errors.items}</p>
              )}
              
              <div className="space-y-4">
                {items.map((item, index) => (
                  <div key={item.id} className="border border-gray-200 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Articolo {index + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <Label>Prodotto</Label>
                        <div className="relative">
                          <Input
                            placeholder="Cerca prodotto..."
                            value={item.productName}
                            onChange={(e) => {
                              updateItem(item.id, 'productName', e.target.value)
                              setProductSearch(e.target.value)
                              setShowProductResults(true)
                            }}
                            onFocus={() => setShowProductResults(true)}
                          />
                          {showProductResults && productSearch && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              {filteredProducts.length > 0 ? (
                                filteredProducts.map((product) => (
                                  <div
                                    key={product.id}
                                    className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                    onClick={() => selectProduct(product, index)}
                                  >
                                    <div className="font-medium">{product.name}</div>
                                    {product.sku && (
                                      <div className="text-sm text-gray-500">SKU: {product.sku}</div>
                                    )}
                                    <div className="text-sm text-gray-500">
                                      Prezzo: {formatCurrency(product.unitPrice)} | 
                                      Giacenza: {product.stockQuantity}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="p-3 text-gray-500">Nessun prodotto trovato</div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label>Descrizione</Label>
                        <Textarea
                          placeholder="Descrizione articolo..."
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                        />
                        {errors[`item_${index}_description`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`item_${index}_description`]}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <Label>Quantità</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value))}
                        />
                        {errors[`item_${index}_quantity`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`item_${index}_quantity`]}</p>
                        )}
                      </div>

                      <div>
                        <Label>Prezzo unitario</Label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, 'unitPrice', parseFloat(e.target.value))}
                        />
                        {errors[`item_${index}_unitPrice`] && (
                          <p className="text-red-500 text-sm mt-1">{errors[`item_${index}_unitPrice`]}</p>
                        )}
                      </div>

                      <div>
                        <Label>Sconto</Label>
                        <div className="flex space-x-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.discount}
                            onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value))}
                          />
                          <Select
                            value={item.discountType}
                            onValueChange={(value: 'percentage' | 'fixed') => updateItem(item.id, 'discountType', value)}
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="percentage">%</SelectItem>
                              <SelectItem value="fixed">€</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label>Aliquota IVA</Label>
                        <Select
                          value={item.taxRate.toString()}
                          onValueChange={(value) => updateItem(item.id, 'taxRate', parseFloat(value))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0%</SelectItem>
                            <SelectItem value="4">4%</SelectItem>
                            <SelectItem value="10">10%</SelectItem>
                            <SelectItem value="22">22%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div className="text-sm">
                        <span className="font-medium">Totale: {formatCurrency(item.totalPrice)}</span>
                        <span className="text-gray-500 ml-2">IVA: {formatCurrency(item.taxAmount)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Electronic Invoicing */}
            <Card>
              <CardHeader>
                <CardTitle>Fatturazione Elettronica</CardTitle>
                <CardDescription>Impostazioni per fattura PA e B2B</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="electronic-invoice"
                    checked={electronicInvoice}
                    onCheckedChange={setElectronicInvoice}
                  />
                  <Label htmlFor="electronic-invoice">Abilita fatturazione elettronica</Label>
                </div>

                {electronicInvoice && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="sdi-code">Codice SDI</Label>
                      <Input
                        id="sdi-code"
                        placeholder="0000000"
                        value={sdiCode}
                        onChange={(e) => setSdiCode(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="pec-email">Email PEC</Label>
                      <Input
                        id="pec-email"
                        type="email"
                        placeholder="pec@azienda.it"
                        value={pecEmail}
                        onChange={(e) => setPecEmail(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Workflow */}
            <Card>
              <CardHeader>
                <CardTitle>Workflow</CardTitle>
                <CardDescription>Automazione e approvazioni</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="workflow-enabled"
                    checked={workflowEnabled}
                    onCheckedChange={setWorkflowEnabled}
                  />
                  <Label htmlFor="workflow-enabled">Abilita workflow</Label>
                </div>

                {workflowEnabled && (
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="require-approval"
                        checked={requireApproval}
                        onCheckedChange={setRequireApproval}
                      />
                      <Label htmlFor="require-approval">Richiedi approvazione</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="auto-send"
                        checked={autoSend}
                        onCheckedChange={setAutoSend}
                      />
                      <Label htmlFor="auto-send">Invio automatico</Label>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Additional Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Impostazioni Aggiuntive</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="internal-notes">Note interne</Label>
                <Textarea
                  id="internal-notes"
                  placeholder="Note interne visibili solo allo staff..."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="terms">Condizioni generali</Label>
                <Textarea
                  id="terms"
                  placeholder="Termini e condizioni..."
                  value={terms}
                  onChange={(e) => setTerms(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle>Anteprima Fattura</CardTitle>
              <CardDescription>Come apparirà la fattura finale</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4" />
                <p>Anteprima della fattura</p>
                <p className="text-sm">Totale: {formatCurrency(totalAmount)}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Riepilogo</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <div>Subtotale: {formatCurrency(subtotal)}</div>
                <div>Sconto totale: {formatCurrency(totalDiscount)}</div>
                <div>IVA: {formatCurrency(totalTax)}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{formatCurrency(totalAmount)}</div>
              <div className="text-sm text-gray-600">Totale fattura</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
