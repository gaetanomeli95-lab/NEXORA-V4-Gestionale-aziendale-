"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Save, 
  Send, 
  Download, 
  Eye, 
  Plus, 
  Trash2, 
  Search,
  Calendar,
  User,
  Building,
  FileText,
  Calculator,
  CreditCard,
  Banknote,
  Percent,
  Package,
  Edit,
  Copy,
  AlertCircle,
  CheckCircle,
  Clock,
  Mail,
  Printer,
  Upload,
  Zap,
  TrendingUp,
  DollarSign,
  Receipt,
  FileSignature,
  Stamp,
  Building2
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'

interface InvoiceItem {
  id: string
  productId?: string
  code: string
  description: string
  quantity: number
  unit: string
  price: number
  discount: number
  vatRate: number
  total: number
}

interface Customer {
  id: string
  name: string
  legalName: string
  address: string
  city: string
  province: string
  postalCode: string
  country: string
  vatNumber: string
  taxCode: string
  email: string
  phone: string
}

interface Product {
  id: string
  code: string
  name: string
  description: string
  price: number
  vatRate: number
  unit: string
  stock: number
}

const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'Mario Rossi',
    legalName: 'Mario Rossi',
    address: 'Via Roma 123',
    city: 'Milano',
    province: 'MI',
    postalCode: '20121',
    country: 'IT',
    vatNumber: 'IT01234567890',
    taxCode: 'RSSMRA85A01H501Z',
    email: 'mario.rossi@email.com',
    phone: '+39 02 12345678'
  },
  {
    id: '2',
    name: 'Tech Solutions Srl',
    legalName: 'Tech Solutions Srl',
    address: 'Corso Italia 456',
    city: 'Roma',
    province: 'RM',
    postalCode: '00187',
    country: 'IT',
    vatNumber: 'IT09876543210',
    taxCode: '',
    email: 'info@techsolutions.it',
    phone: '+39 06 87654321'
  }
]

const mockProducts: Product[] = [
  {
    id: '1',
    code: 'MBP14-2023',
    name: 'MacBook Pro 14"',
    description: 'Apple MacBook Pro 14" M3 Pro, 18GB RAM, 512GB SSD',
    price: 2499.00,
    vatRate: 22,
    unit: 'pz',
    stock: 15
  },
  {
    id: '2',
    code: 'IP15P-128',
    name: 'iPhone 15 Pro',
    description: 'Apple iPhone 15 Pro 128GB Natural Titanium',
    price: 1199.00,
    vatRate: 22,
    unit: 'pz',
    stock: 32
  },
  {
    id: '3',
    code: 'APP-PRO',
    name: 'AirPods Pro',
    description: 'Apple AirPods Pro con MagSafe Charging Case',
    price: 279.00,
    vatRate: 22,
    unit: 'pz',
    stock: 50
  }
]

export default function InvoiceForm() {
  const [activeTab, setActiveTab] = useState('details')
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [showCustomerDialog, setShowCustomerDialog] = useState(false)
  const [showProductDialog, setShowProductDialog] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSending, setIsSending] = useState(false)

  // Invoice data
  const [invoiceData, setInvoiceData] = useState({
    number: '2024-001',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    paymentMethod: 'BANK_TRANSFER',
    bankAccount: 'IT60 X054 2811 1010 0000 0123 456',
    notes: '',
    internalNotes: '',
    template: 'standard'
  })

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const discountTotal = items.reduce((sum, item) => sum + ((item.price * item.quantity) * item.discount / 100), 0)
    const vatTotal = items.reduce((sum, item) => {
      const itemTotal = (item.price * item.quantity) * (1 - item.discount / 100)
      return sum + (itemTotal * item.vatRate / 100)
    }, 0)
    const total = subtotal - discountTotal + vatTotal

    return {
      subtotal,
      discountTotal,
      vatTotal,
      total
    }
  }

  const totals = calculateTotals()

  // Add item to invoice
  const addItem = (product: Product) => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      productId: product.id,
      code: product.code,
      description: product.name,
      quantity: 1,
      unit: product.unit,
      price: product.price,
      discount: 0,
      vatRate: product.vatRate,
      total: product.price
    }
    setItems([...items, newItem])
    setShowProductDialog(false)
    setProductSearch('')
  }

  // Update item
  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value }
        // Recalculate total
        updatedItem.total = (updatedItem.price * updatedItem.quantity) * (1 - updatedItem.discount / 100)
        return updatedItem
      }
      return item
    }))
  }

  // Remove item
  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  // Save invoice
  const saveInvoice = async () => {
    setIsSaving(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsSaving(false)
    // Show success message
  }

  // Send invoice
  const sendInvoice = async () => {
    setIsSending(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsSending(false)
    // Show success message
  }

  // Generate PDF
  const generatePDF = () => {
    // Generate PDF logic
    console.log('Generating PDF...')
  }

  // Send electronic invoice
  const sendElectronicInvoice = async () => {
    // Electronic invoice logic
    console.log('Sending electronic invoice...')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Nuova Fattura</h1>
                <p className="text-gray-600">Crea una nuova fattura con intelligenza artificiale</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => setShowPreview(true)}>
                <Eye className="h-4 w-4 mr-2" />
                Anteprima
              </Button>
              <Button variant="outline" onClick={generatePDF}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button onClick={saveInvoice} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Salvataggio...' : 'Salva'}
              </Button>
              <Button onClick={sendInvoice} disabled={isSending || !selectedCustomer || items.length === 0}>
                <Send className="h-4 w-4 mr-2" />
                {isSending ? 'Invio...' : 'Invia'}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="details">Dettagli</TabsTrigger>
                    <TabsTrigger value="items">Articoli</TabsTrigger>
                    <TabsTrigger value="settings">Impostazioni</TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="space-y-6">
                    {/* Customer Selection */}
                    <div className="space-y-4">
                      <Label>Cliente</Label>
                      <div className="flex items-center space-x-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Cerca cliente..."
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                        <Dialog open={showCustomerDialog} onOpenChange={setShowCustomerDialog}>
                          <DialogTrigger asChild>
                            <Button variant="outline">
                              <User className="h-4 w-4 mr-2" />
                              Seleziona
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Seleziona Cliente</DialogTitle>
                              <DialogDescription>
                                Scegli un cliente dalla lista o creane uno nuovo
                              </DialogDescription>
                            </DialogHeader>
                            <div className="max-h-96 overflow-y-auto space-y-2">
                              {mockCustomers
                                .filter(customer => 
                                  customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                                  customer.legalName.toLowerCase().includes(customerSearch.toLowerCase())
                                )
                                .map(customer => (
                                  <div
                                    key={customer.id}
                                    className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                    onClick={() => {
                                      setSelectedCustomer(customer)
                                      setShowCustomerDialog(false)
                                      setCustomerSearch('')
                                    }}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <h4 className="font-medium">{customer.name}</h4>
                                        <p className="text-sm text-gray-500">{customer.legalName}</p>
                                        <p className="text-sm text-gray-500">{customer.address}, {customer.city}</p>
                                      </div>
                                      <Building className="h-5 w-5 text-gray-400" />
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>

                      {selectedCustomer && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-blue-50 border border-blue-200 rounded-lg"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-blue-900">{selectedCustomer.name}</h4>
                              <p className="text-sm text-blue-700">{selectedCustomer.address}, {selectedCustomer.city}</p>
                              <p className="text-sm text-blue-700">P.IVA: {selectedCustomer.vatNumber}</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(null)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* Invoice Details */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="number">Numero Fattura</Label>
                        <Input
                          id="number"
                          value={invoiceData.number}
                          onChange={(e) => setInvoiceData({...invoiceData, number: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date">Data</Label>
                        <Input
                          id="date"
                          type="date"
                          value={invoiceData.date}
                          onChange={(e) => setInvoiceData({...invoiceData, date: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dueDate">Data Scadenza</Label>
                        <Input
                          id="dueDate"
                          type="date"
                          value={invoiceData.dueDate}
                          onChange={(e) => setInvoiceData({...invoiceData, dueDate: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="paymentMethod">Metodo di Pagamento</Label>
                        <Select value={invoiceData.paymentMethod} onValueChange={(value) => setInvoiceData({...invoiceData, paymentMethod: value})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="BANK_TRANSFER">Bonifico Bancario</SelectItem>
                            <SelectItem value="CASH">Contanti</SelectItem>
                            <SelectItem value="CREDIT_CARD">Carta di Credito</SelectItem>
                            <SelectItem value="PAYPAL">PayPal</SelectItem>
                            <SelectItem value="CHECK">Assegno</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bankAccount">Coordinate Bancarie</Label>
                      <Input
                        id="bankAccount"
                        value={invoiceData.bankAccount}
                        onChange={(e) => setInvoiceData({...invoiceData, bankAccount: e.target.value})}
                        placeholder="IT60 X054 2811 1010 0000 0123 456"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Note</Label>
                      <Textarea
                        id="notes"
                        value={invoiceData.notes}
                        onChange={(e) => setInvoiceData({...invoiceData, notes: e.target.value})}
                        placeholder="Note visibili al cliente..."
                        rows={3}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="items" className="space-y-6">
                    {/* Add Product */}
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Cerca prodotto..."
                          value={productSearch}
                          onChange={(e) => setProductSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Dialog open={showProductDialog} onOpenChange={setShowProductDialog}>
                        <DialogTrigger asChild>
                          <Button variant="outline">
                            <Plus className="h-4 w-4 mr-2" />
                            Aggiungi Prodotto
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Seleziona Prodotto</DialogTitle>
                            <DialogDescription>
                              Scegli un prodotto dal catalogo
                            </DialogDescription>
                          </DialogHeader>
                          <div className="max-h-96 overflow-y-auto space-y-2">
                            {mockProducts
                              .filter(product => 
                                product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                                product.code.toLowerCase().includes(productSearch.toLowerCase())
                              )
                              .map(product => (
                                <div
                                  key={product.id}
                                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                                  onClick={() => addItem(product)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <h4 className="font-medium">{product.name}</h4>
                                      <p className="text-sm text-gray-500">{product.description}</p>
                                      <p className="text-sm text-gray-500">Codice: {product.code} | Disponibilità: {product.stock} pz</p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-medium">€{product.price.toFixed(2)}</p>
                                      <p className="text-sm text-gray-500">IVA {product.vatRate}%</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {/* Items Table */}
                    <div className="border rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Codice</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrizione</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Q.tà</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Prezzo</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Sconto</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">IVA</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Totale</th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Azioni</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {items.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm">{item.code}</td>
                              <td className="px-4 py-3 text-sm">{item.description}</td>
                              <td className="px-4 py-3">
                                <Input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                                  className="w-20 text-center"
                                  min="1"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <Input
                                  type="number"
                                  value={item.price}
                                  onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                                  className="w-24 text-center"
                                  min="0"
                                  step="0.01"
                                />
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center space-x-1">
                                  <Input
                                    type="number"
                                    value={item.discount}
                                    onChange={(e) => updateItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                                    className="w-16 text-center"
                                    min="0"
                                    max="100"
                                    step="0.1"
                                  />
                                  <span className="text-sm text-gray-500">%</span>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <Select value={item.vatRate.toString()} onValueChange={(value) => updateItem(item.id, 'vatRate', parseFloat(value))}>
                                  <SelectTrigger className="w-20">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="0">0%</SelectItem>
                                    <SelectItem value="4">4%</SelectItem>
                                    <SelectItem value="10">10%</SelectItem>
                                    <SelectItem value="22">22%</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-medium">
                                €{item.total.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {items.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>Nessun articolo aggiunto</p>
                        <p className="text-sm">Aggiungi prodotti per iniziare</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="settings" className="space-y-6">
                    <div className="space-y-4">
                      <Label>Template Fattura</Label>
                      <Select value={invoiceData.template} onValueChange={(value) => setInvoiceData({...invoiceData, template: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="modern">Moderno</SelectItem>
                          <SelectItem value="minimal">Minimal</SelectItem>
                          <SelectItem value="corporate">Corporate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="internalNotes">Note Interne</Label>
                      <Textarea
                        id="internalNotes"
                        value={invoiceData.internalNotes}
                        onChange={(e) => setInvoiceData({...invoiceData, internalNotes: e.target.value})}
                        placeholder="Note interne visibili solo al team..."
                        rows={3}
                      />
                    </div>

                    <div className="space-y-4">
                      <Label>Opzioni Avanzate</Label>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Fattura Elettronica</h4>
                            <p className="text-sm text-gray-500">Genera automaticamente XML per SDI</p>
                          </div>
                          <Switch />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Invio Automatico</h4>
                            <p className="text-sm text-gray-500">Invia fattura via email automaticamente</p>
                          </div>
                          <Switch />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Notifica Pagamento</h4>
                            <p className="text-sm text-gray-500">Ricevi notifiche sullo stato pagamenti</p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* AI Assistant */}
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">AI Assistant</h3>
                    <p className="text-sm text-gray-600">Suggerimenti intelligenti</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-900">Ottimizza Prezzi</p>
                    <p className="text-xs text-blue-700">Potresti aumentare il prezzo del 5% basandoti sulla cronologia</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-purple-200">
                    <p className="text-sm font-medium text-purple-900">Cliente Fedele</p>
                    <p className="text-xs text-purple-700">Questo cliente ha un tasso di pagamento del 98%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Totals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2" />
                  Riepilogo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Imponibile</span>
                  <span className="font-medium">€{totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sconto</span>
                  <span className="font-medium text-red-600">-€{totals.discountTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">IVA</span>
                  <span className="font-medium">€{totals.vatTotal.toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-lg font-semibold">Totale</span>
                  <span className="text-lg font-bold text-blue-600">€{totals.total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Azioni Rapide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Copy className="h-4 w-4 mr-2" />
                  Duplica Fattura
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileSignature className="h-4 w-4 mr-2" />
                  Crea Nota di Credito
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Stamp className="h-4 w-4 mr-2" />
                  Invia a SDI
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Printer className="h-4 w-4 mr-2" />
                  Stampa
                </Button>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Stato
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Salvataggio</span>
                    <Badge variant="outline">Bozza</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Invio</span>
                    <Badge variant="outline">Non inviata</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Pagamento</span>
                    <Badge variant="outline">In attesa</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
