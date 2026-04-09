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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface CustomerFormProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  customer?: any
}

export function CustomerForm({ open, onClose, onSuccess, customer }: CustomerFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    name: '',
    businessName: '',
    legalName: '',
    firstName: '',
    lastName: '',
    type: 'COMPANY',
    email: '',
    pecEmail: '',
    phone: '',
    mobile: '',
    website: '',
    vatNumber: '',
    fiscalCode: '',
    sdiCode: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    country: 'Italia',
    billingAddress: '',
    shippingAddress: '',
    paymentTerms: '30GG',
    creditLimit: 0,
    notes: '',
  })

  useEffect(() => {
    if (open) {
      if (customer) {
        setForm({
          name: customer.name || '',
          businessName: customer.businessName || '',
          legalName: customer.legalName || '',
          firstName: customer.firstName || '',
          lastName: customer.lastName || '',
          type: customer.type || 'COMPANY',
          email: customer.email || '',
          pecEmail: customer.pecEmail || '',
          phone: customer.phone || '',
          mobile: customer.mobile || '',
          website: customer.website || '',
          vatNumber: customer.vatNumber || '',
          fiscalCode: customer.fiscalCode || '',
          sdiCode: customer.sdiCode || '',
          address: customer.address || '',
          city: customer.city || '',
          province: customer.province || '',
          postalCode: customer.postalCode || '',
          country: customer.country || 'Italia',
          billingAddress: customer.billingAddress || '',
          shippingAddress: customer.shippingAddress || '',
          paymentTerms: customer.paymentTerms || '30GG',
          creditLimit: customer.creditLimit || 0,
          notes: customer.notes || '',
        })
      } else {
        setForm({
          name: '', businessName: '', legalName: '', firstName: '', lastName: '',
          type: 'COMPANY', email: '', pecEmail: '', phone: '', mobile: '', website: '',
          vatNumber: '', fiscalCode: '', sdiCode: '', address: '', city: '', province: '',
          postalCode: '', country: 'Italia', billingAddress: '', shippingAddress: '',
          paymentTerms: '30GG', creditLimit: 0, notes: '',
        })
      }
    }
  }, [open, customer])

  const update = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name && !form.businessName && !(form.firstName && form.lastName)) {
      toast({ title: "Campo obbligatorio", description: "Inserisci almeno il nome del cliente", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      const name = form.name || form.businessName || `${form.firstName} ${form.lastName}`.trim()
      const payload = { ...form, name }

      const url = customer ? `/api/customers/${customer.id}` : '/api/customers'
      const method = customer ? 'PUT' : 'POST'

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
    } catch (error) {
      console.error('Error saving customer:', error)
      toast({ title: "Errore", description: "Errore durante il salvataggio", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={getPopupDialogContentClassName("max-w-4xl max-h-[90vh] overflow-y-auto")}>
        <PopupHeader
          theme="customers"
          title={customer ? 'Modifica Cliente' : 'Nuovo Cliente'}
          description={customer ? 'Modifica i dati del cliente' : 'Inserisci i dati del nuovo cliente'}
        />

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <Tabs defaultValue="general">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">Generale</TabsTrigger>
              <TabsTrigger value="fiscal">Dati Fiscali</TabsTrigger>
              <TabsTrigger value="address">Indirizzi</TabsTrigger>
              <TabsTrigger value="other">Altro</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Tipo Cliente</Label>
                  <Select value={form.type} onValueChange={(v) => update('type', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="COMPANY">Azienda</SelectItem>
                      <SelectItem value="INDIVIDUAL">Privato</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Ragione Sociale / Nome</Label>
                  <Input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Es: Mario Rossi SRL" />
                </div>
              </div>
              {form.type === 'COMPANY' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>Nome Commerciale</Label><Input value={form.businessName} onChange={(e) => update('businessName', e.target.value)} /></div>
                  <div><Label>Denominazione Legale</Label><Input value={form.legalName} onChange={(e) => update('legalName', e.target.value)} /></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>Nome</Label><Input value={form.firstName} onChange={(e) => update('firstName', e.target.value)} /></div>
                  <div><Label>Cognome</Label><Input value={form.lastName} onChange={(e) => update('lastName', e.target.value)} /></div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="email@esempio.it" /></div>
                <div><Label>Telefono</Label><Input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="+39 ..." /></div>
                <div><Label>Cellulare</Label><Input value={form.mobile} onChange={(e) => update('mobile', e.target.value)} /></div>
              </div>
              <div><Label>Sito Web</Label><Input value={form.website} onChange={(e) => update('website', e.target.value)} placeholder="https://..." /></div>
            </TabsContent>

            <TabsContent value="fiscal" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Partita IVA</Label><Input value={form.vatNumber} onChange={(e) => update('vatNumber', e.target.value)} placeholder="IT..." /></div>
                <div><Label>Codice Fiscale</Label><Input value={form.fiscalCode} onChange={(e) => update('fiscalCode', e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>PEC</Label><Input type="email" value={form.pecEmail} onChange={(e) => update('pecEmail', e.target.value)} placeholder="pec@..." /></div>
                <div><Label>Codice SDI</Label><Input value={form.sdiCode} onChange={(e) => update('sdiCode', e.target.value)} placeholder="0000000" maxLength={7} /></div>
              </div>
            </TabsContent>

            <TabsContent value="address" className="space-y-4 mt-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Sede</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div><Label>Indirizzo</Label><Input value={form.address} onChange={(e) => update('address', e.target.value)} placeholder="Via/Piazza ..." /></div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2"><Label>Città</Label><Input value={form.city} onChange={(e) => update('city', e.target.value)} /></div>
                    <div><Label>Provincia</Label><Input value={form.province} onChange={(e) => update('province', e.target.value)} maxLength={2} placeholder="RM" /></div>
                    <div><Label>CAP</Label><Input value={form.postalCode} onChange={(e) => update('postalCode', e.target.value)} maxLength={5} /></div>
                  </div>
                  <div><Label>Paese</Label><Input value={form.country} onChange={(e) => update('country', e.target.value)} /></div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="other" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Termini Pagamento</Label>
                  <Select value={form.paymentTerms} onValueChange={(v) => update('paymentTerms', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IMMEDIATE">Immediato</SelectItem>
                      <SelectItem value="15GG">15 giorni</SelectItem>
                      <SelectItem value="30GG">30 giorni</SelectItem>
                      <SelectItem value="60GG">60 giorni</SelectItem>
                      <SelectItem value="90GG">90 giorni</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Fido (€)</Label><Input type="number" value={form.creditLimit} onChange={(e) => update('creditLimit', parseFloat(e.target.value) || 0)} min="0" /></div>
              </div>
              <div><Label>Note</Label><Textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={4} placeholder="Note sul cliente..." /></div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Annulla</Button>
            <Button type="submit" disabled={loading} className={getPopupPrimaryButtonClassName('customers')}>
              {loading ? 'Salvataggio...' : (customer ? 'Aggiorna' : 'Crea') + ' Cliente'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
