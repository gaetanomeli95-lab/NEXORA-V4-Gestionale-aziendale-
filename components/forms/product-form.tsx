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
import { Switch } from '@/components/ui/switch'

interface ProductFormProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  product?: any
}

export function ProductForm({ open, onClose, onSuccess, product }: ProductFormProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState({
    name: '',
    code: '',
    sku: '',
    barcode: '',
    description: '',
    brand: '',
    size: '',
    color: '',
    categoryId: '',
    supplierId: '',
    unitPrice: 0,
    costPrice: 0,
    markupRate: 0,
    taxRate: 22,
    unitOfMeasure: 'pz',
    trackStock: true,
    stockQuantity: 0,
    minStockLevel: 5,
    maxStockLevel: 100,
    weight: 0,
    width: 0,
    height: 0,
    depth: 0,
    notes: '',
  })

  useEffect(() => {
    if (open) {
      fetchCategories()
      fetchSuppliers()
      if (product) {
        const cost = product.costPrice || 0
        const sell = product.unitPrice || 0
        const markup = cost > 0 ? ((sell / cost) - 1) * 100 : (product.markupRate || 0)
        setForm({
          name: product.name || '',
          code: product.code || '',
          sku: product.sku || '',
          barcode: product.barcode || '',
          description: product.description || '',
          brand: product.brand || '',
          size: product.size || '',
          color: product.color || '',
          categoryId: product.categoryId || product.category?.id || '',
          supplierId: product.supplierId || product.supplier?.id || '',
          unitPrice: sell,
          costPrice: cost,
          markupRate: parseFloat(markup.toFixed(2)),
          taxRate: product.taxRate || 22,
          unitOfMeasure: product.unitOfMeasure || 'pz',
          trackStock: product.trackStock !== false,
          stockQuantity: product.stockQuantity || 0,
          minStockLevel: product.minStockLevel || 5,
          maxStockLevel: product.maxStockLevel || 100,
          weight: product.weight || 0,
          width: product.width || 0,
          height: product.height || 0,
          depth: product.depth || 0,
          notes: product.notes || '',
        })
      } else {
        setForm({
          name: '', code: '', sku: '', barcode: '', description: '', brand: '',
          size: '', color: '',
          categoryId: '', supplierId: '', unitPrice: 0, costPrice: 0, markupRate: 0, taxRate: 22, unitOfMeasure: 'pz',
          trackStock: true, stockQuantity: 0, minStockLevel: 5, maxStockLevel: 100,
          weight: 0, width: 0, height: 0, depth: 0, notes: '',
        })
      }
    }
  }, [open, product])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/products/categories')
      const result = await res.json()
      if (result.success) setCategories(result.data || [])
    } catch { /* ignore */ }
  }

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/suppliers')
      const result = await res.json()
      if (result.success) setSuppliers(result.data.suppliers || [])
    } catch { /* ignore */ }
  }

  const update = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }))
  const fmt = (n: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n)

  const handleCostChange = (val: number) => {
    const markup = form.markupRate || 0
    const newSell = parseFloat((val * (1 + markup / 100)).toFixed(2))
    setForm(prev => ({ ...prev, costPrice: val, unitPrice: newSell }))
  }

  const handleMarkupChange = (val: number) => {
    const cost = form.costPrice || 0
    const newSell = parseFloat((cost * (1 + val / 100)).toFixed(2))
    setForm(prev => ({ ...prev, markupRate: val, unitPrice: cost > 0 ? newSell : prev.unitPrice }))
  }

  const handleUnitPriceChange = (val: number) => {
    const cost = form.costPrice || 0
    const newMarkup = cost > 0 ? parseFloat(((val / cost - 1) * 100).toFixed(2)) : form.markupRate
    setForm(prev => ({ ...prev, unitPrice: val, markupRate: newMarkup }))
  }

  const margin = form.unitPrice > 0 && form.costPrice > 0
    ? ((form.unitPrice - form.costPrice) / form.unitPrice * 100).toFixed(1)
    : '0.0'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name) { toast({ title: "Campo obbligatorio", description: "Inserisci il nome del prodotto", variant: "destructive" }); return }
    setLoading(true)
    try {
      const url = product ? `/api/products/${product.id}` : '/api/products'
      const method = product ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const result = await res.json()
      if (result.success) {
        onSuccess?.()
        onClose()
      } else { toast({ title: "Errore", description: result.error || 'Errore durante il salvataggio', variant: "destructive" }) }
    } catch (error) {
      console.error('Error saving product:', error)
      toast({ title: "Errore", description: "Errore durante il salvataggio", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={getPopupDialogContentClassName("max-w-4xl max-h-[90vh] overflow-y-auto")}>
        <PopupHeader
          theme="products"
          title={product ? 'Modifica Prodotto' : 'Nuovo Prodotto'}
          description={product ? 'Modifica i dati del prodotto' : 'Inserisci i dati del nuovo prodotto'}
        />

        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <Tabs defaultValue="general">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">Generale</TabsTrigger>
              <TabsTrigger value="pricing">Prezzi</TabsTrigger>
              <TabsTrigger value="stock">Magazzino</TabsTrigger>
              <TabsTrigger value="details">Dettagli</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Nome Prodotto *</Label><Input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Nome prodotto" required /></div>
                <div><Label>Brand / Marca</Label><Input value={form.brand} onChange={(e) => update('brand', e.target.value)} placeholder="Es. Eminflex, Magniflex" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Taglia / Misura</Label><Input value={form.size} onChange={(e) => update('size', e.target.value)} placeholder="Es. 160x200, M, XL" /></div>
                <div><Label>Colore</Label><Input value={form.color} onChange={(e) => update('color', e.target.value)} placeholder="Es. Bianco, Grigio" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><Label>Codice</Label><Input value={form.code} onChange={(e) => update('code', e.target.value)} placeholder="COD-001" /></div>
                <div><Label>SKU</Label><Input value={form.sku} onChange={(e) => update('sku', e.target.value)} placeholder="SKU-001" /></div>
                <div><Label>Barcode / EAN</Label><Input value={form.barcode} onChange={(e) => update('barcode', e.target.value)} placeholder="8001234567890" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Categoria</Label>
                    <Select value={form.categoryId} onValueChange={(val) => update('categoryId', val)}>
                      <SelectTrigger><SelectValue placeholder="Seleziona categoria" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value=" ">Nessuna categoria</SelectItem>
                        {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Fornitore</Label>
                    <Select value={form.supplierId} onValueChange={(val) => update('supplierId', val)}>
                      <SelectTrigger><SelectValue placeholder="Seleziona fornitore" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value=" ">Nessun fornitore</SelectItem>
                        {suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Unità di Misura</Label>
                  <Select value={form.unitOfMeasure} onValueChange={(v) => update('unitOfMeasure', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pz">Pezzo (pz)</SelectItem>
                      <SelectItem value="kg">Kilogrammo (kg)</SelectItem>
                      <SelectItem value="lt">Litro (lt)</SelectItem>
                      <SelectItem value="mt">Metro (mt)</SelectItem>
                      <SelectItem value="mq">Metro quadro (mq)</SelectItem>
                      <SelectItem value="mc">Metro cubo (mc)</SelectItem>
                      <SelectItem value="cf">Confezione (cf)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Descrizione</Label><Textarea value={form.description} onChange={(e) => update('description', e.target.value)} rows={3} placeholder="Descrizione del prodotto..." /></div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-4 mt-4">
              <p className="text-xs text-gray-500">💡 I campi sono collegati: modifica Acquisto + Ricarico per calcolare il Prezzo di Vendita, oppure modifica il Prezzo di Vendita per ricalcolare il Ricarico.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Prezzo di Acquisto (€) — Costo</Label>
                  <Input type="number" value={form.costPrice} onChange={(e) => handleCostChange(parseFloat(e.target.value) || 0)} min="0" step="0.01" className="font-mono" />
                </div>
                <div>
                  <Label>Ricarico %</Label>
                  <Input type="number" value={form.markupRate} onChange={(e) => handleMarkupChange(parseFloat(e.target.value) || 0)} min="0" step="0.1" className="font-mono" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Prezzo di Vendita (€) — Netto</Label>
                  <Input type="number" value={form.unitPrice} onChange={(e) => handleUnitPriceChange(parseFloat(e.target.value) || 0)} min="0" step="0.01" className="font-mono" />
                </div>
                <div>
                  <Label>IVA %</Label>
                  <Select value={String(form.taxRate)} onValueChange={(v) => update('taxRate', parseFloat(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="22">22%</SelectItem>
                      <SelectItem value="10">10%</SelectItem>
                      <SelectItem value="4">4%</SelectItem>
                      <SelectItem value="0">Esente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Card className="bg-gray-50">
                <CardContent className="pt-4 pb-4">
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div><div className="text-xs text-gray-500">Acquisto</div><div className="text-base font-bold">{fmt(form.costPrice)}</div></div>
                    <div><div className="text-xs text-gray-500">Ricarico</div><div className="text-base font-bold text-blue-600">{form.markupRate.toFixed(1)}%</div></div>
                    <div><div className="text-xs text-gray-500">Vendita netto</div><div className="text-base font-bold">{fmt(form.unitPrice)}</div></div>
                    <div><div className="text-xs text-gray-500">Vendita +IVA</div><div className="text-base font-bold text-green-600">{fmt(form.unitPrice * (1 + form.taxRate / 100))}</div></div>
                  </div>
                  <div className="mt-2 text-center text-xs text-gray-400">Margine lordo: {margin}%</div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stock" className="space-y-4 mt-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-medium">Gestione Magazzino</div>
                  <div className="text-sm text-gray-500">Attiva il tracciamento delle scorte</div>
                </div>
                <Switch checked={form.trackStock} onCheckedChange={(v) => update('trackStock', v)} />
              </div>
              {form.trackStock && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><Label>Giacenza Attuale</Label><Input type="number" value={form.stockQuantity} onChange={(e) => update('stockQuantity', parseInt(e.target.value) || 0)} min="0" /></div>
                  <div><Label>Scorta Minima</Label><Input type="number" value={form.minStockLevel} onChange={(e) => update('minStockLevel', parseInt(e.target.value) || 0)} min="0" /></div>
                  <div><Label>Scorta Massima</Label><Input type="number" value={form.maxStockLevel} onChange={(e) => update('maxStockLevel', parseInt(e.target.value) || 0)} min="0" /></div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div><Label>Peso (kg)</Label><Input type="number" value={form.weight} onChange={(e) => update('weight', parseFloat(e.target.value) || 0)} min="0" step="0.01" /></div>
                <div><Label>Larghezza (cm)</Label><Input type="number" value={form.width} onChange={(e) => update('width', parseFloat(e.target.value) || 0)} min="0" step="0.1" /></div>
                <div><Label>Altezza (cm)</Label><Input type="number" value={form.height} onChange={(e) => update('height', parseFloat(e.target.value) || 0)} min="0" step="0.1" /></div>
                <div><Label>Profondità (cm)</Label><Input type="number" value={form.depth} onChange={(e) => update('depth', parseFloat(e.target.value) || 0)} min="0" step="0.1" /></div>
              </div>
              <div><Label>Note</Label><Textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} rows={4} placeholder="Note sul prodotto..." /></div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Annulla</Button>
            <Button type="submit" disabled={loading} className={getPopupPrimaryButtonClassName('products')}>
              {loading ? 'Salvataggio...' : (product ? 'Aggiorna' : 'Crea') + ' Prodotto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
