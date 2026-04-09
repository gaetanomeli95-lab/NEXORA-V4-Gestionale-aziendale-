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
import { Search } from 'lucide-react'

interface Invoice {
  id: string
  number: string
  totalAmount: number
  paidAmount?: number
  balanceAmount?: number
  customer: { name: string }
  dueDate?: string
  status: string
}

interface PaymentFormProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  invoiceId?: string
}

export function PaymentForm({ open, onClose, onSuccess, invoiceId }: PaymentFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [invoiceSearch, setInvoiceSearch] = useState('')
  const [showInvoiceSelect, setShowInvoiceSelect] = useState(false)
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)

  const [amount, setAmount] = useState(0)
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [method, setMethod] = useState('BANK_TRANSFER')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (open) {
      fetchInvoices()
      if (invoiceId) {
        // Pre-seleziona la fattura passata come prop
        loadInvoice(invoiceId)
      } else {
        resetForm()
      }
    }
  }, [open, invoiceId])

  const resetForm = () => {
    setSelectedInvoice(null)
    setAmount(0)
    setPaymentDate(new Date().toISOString().split('T')[0])
    setMethod('BANK_TRANSFER')
    setReference('')
    setNotes('')
    setInvoiceSearch('')
  }

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/invoices?limit=500&status=SENT')
      const result = await res.json()
      if (result.success) {
        const list = (result.data.invoices || []).filter((inv: Invoice) =>
          inv.status !== 'PAID' && inv.status !== 'CANCELLED'
        )
        setInvoices(list)
      }
    } catch { /* ignore */ }
  }

  const loadInvoice = async (id: string) => {
    try {
      const res = await fetch(`/api/invoices/${id}`)
      const result = await res.json()
      if (result.success) {
        const inv = result.data
        setSelectedInvoice(inv)
        const balance = inv.balanceAmount ?? (inv.totalAmount - (inv.paidAmount || 0))
        setAmount(balance > 0 ? balance : inv.totalAmount)
      }
    } catch { /* ignore */ }
  }

  const handleSelectInvoice = (inv: Invoice) => {
    setSelectedInvoice(inv)
    const balance = inv.balanceAmount ?? (inv.totalAmount - (inv.paidAmount || 0))
    setAmount(balance > 0 ? balance : inv.totalAmount)
    setShowInvoiceSelect(false)
    setInvoiceSearch('')
  }

  const formatCurrency = (n: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n)

  const filteredInvoices = invoices.filter(inv =>
    inv.number.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
    inv.customer.name.toLowerCase().includes(invoiceSearch.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!amount || amount <= 0) { toast({ title: "Campo obbligatorio", description: "Inserisci un importo valido", variant: "destructive" }); return }
    setLoading(true)
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selectedInvoice?.id,
          amount,
          paymentDate,
          method,
          reference: reference || undefined,
          notes: notes || undefined,
        }),
      })
      const result = await res.json()
      if (result.success) {
        toast({ title: "Pagamento registrato", description: `Pagamento di ${formatCurrency(amount)} registrato con successo` })
        onSuccess?.()
        onClose()
      } else {
        toast({ title: "Errore", description: result.error || 'Errore durante la registrazione', variant: "destructive" })
      }
    } catch {
      toast({ title: "Errore", description: "Errore di rete", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const balance = selectedInvoice
    ? (selectedInvoice.balanceAmount ?? (selectedInvoice.totalAmount - (selectedInvoice.paidAmount || 0)))
    : 0

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={getPopupDialogContentClassName("max-w-xl max-h-[90vh] overflow-y-auto")}>
        <PopupHeader
          theme="payments"
          title="Registra Pagamento"
          description="Registra un incasso libero o legato a una fattura"
        />

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Fattura (Opzionale) */}
          <Card>
            <CardHeader><CardTitle className="text-base">Riferimento Fattura (Opzionale)</CardTitle></CardHeader>
            <CardContent>
              {selectedInvoice ? (
                <div className="p-3 border rounded-lg bg-blue-50 space-y-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-medium">{selectedInvoice.number}</div>
                      <div className="text-sm text-gray-600">{selectedInvoice.customer.name}</div>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => setSelectedInvoice(null)}>Rimuovi</Button>
                  </div>
                  <div className="text-sm flex gap-4 pt-1">
                    <span>Totale: <strong>{formatCurrency(selectedInvoice.totalAmount)}</strong></span>
                    <span className={balance > 0 ? 'text-orange-600' : 'text-green-600'}>
                      Saldo: <strong>{formatCurrency(balance)}</strong>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Cerca fattura per numero o cliente (lascia vuoto per incasso generico)..."
                      value={invoiceSearch}
                      onChange={(e) => setInvoiceSearch(e.target.value)}
                      onFocus={() => setShowInvoiceSelect(true)}
                      className="pl-10"
                    />
                  </div>
                  {showInvoiceSelect && invoiceSearch && (
                    <div className="border rounded-lg max-h-48 overflow-y-auto shadow bg-white">
                      {filteredInvoices.length > 0 ? filteredInvoices.map(inv => (
                        <div key={inv.id} className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0" onClick={() => handleSelectInvoice(inv)}>
                          <div className="font-medium text-sm">{inv.number} — {inv.customer.name}</div>
                          <div className="text-xs text-gray-500">{formatCurrency(inv.totalAmount)}</div>
                        </div>
                      )) : <div className="p-3 text-sm text-gray-500 text-center">Nessuna fattura trovata</div>}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dettagli pagamento */}
          <Card>
            <CardHeader><CardTitle className="text-base">Dettagli Pagamento</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Importo (€) *</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <Label>Data Pagamento</Label>
                  <Input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>Metodo di Pagamento</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BANK_TRANSFER">Bonifico Bancario</SelectItem>
                    <SelectItem value="CASH">Contanti</SelectItem>
                    <SelectItem value="CREDIT_CARD">Carta di Credito</SelectItem>
                    <SelectItem value="CHECK">Assegno</SelectItem>
                    <SelectItem value="PAYPAL">PayPal</SelectItem>
                    <SelectItem value="STRIPE">Stripe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Riferimento / N° Bonifico</Label>
                <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Es. Bonifico 123456" />
              </div>
              <div>
                <Label>Note</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Note sul pagamento..." />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onClose}>Annulla</Button>
            <Button type="submit" disabled={loading} className={getPopupPrimaryButtonClassName('payments')}>
              {loading ? 'Registrazione...' : 'Registra Pagamento'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
