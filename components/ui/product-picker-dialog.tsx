"use client"

import { useState, useEffect } from 'react'
import { Search, Plus, Package } from 'lucide-react'
import { type ModuleThemeName, getPopupDialogContentClassName } from '@/components/layout/module-theme'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PopupHeader } from '@/components/ui/popup-header'

interface Product {
  id: string
  name: string
  sku?: string
  code?: string
  unitPrice: number
  unitOfMeasure?: string
  stockQuantity?: number
  categoryName?: string
}

interface ProductPickerDialogProps {
  open: boolean
  onClose: () => void
  onSelect: (product: Product) => void
  apiUrl?: string
  theme?: ModuleThemeName
  title?: string
  placeholder?: string
}

export function ProductPickerDialog({
  open,
  onClose,
  onSelect,
  apiUrl = '/api/products',
  theme = 'products',
  title = 'Seleziona Prodotto',
  placeholder = 'Cerca per nome, codice o SKU...'
}: ProductPickerDialogProps) {
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setSearch('')
      fetchProducts('')
    }
  }, [open])

  const fetchProducts = async (q: string) => {
    setLoading(true)
    try {
      const url = new URL(apiUrl, window.location.origin)
      url.searchParams.set('limit', '500')
      url.searchParams.set('status', 'ACTIVE')
      if (q) url.searchParams.set('search', q)
      
      const res = await fetch(url.toString())
      const result = await res.json()
      if (result.success) {
        setProducts(result.data.products || [])
      }
    } catch (e) {
      console.error('Failed to fetch products for picker', e)
    } finally {
      setLoading(false)
    }
  }

  // Debounced search
  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => {
      fetchProducts(search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, open])

  const formatCurrency = (n: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={getPopupDialogContentClassName("max-w-3xl max-h-[85vh] flex flex-col")}>
        <PopupHeader theme={theme} title={title} description="Cerca e seleziona un prodotto dal magazzino" />

        <div className="relative mt-4 px-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder={placeholder} 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-12 text-base"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto mt-4 px-6 pb-6 space-y-2 min-h-[300px]">
          {loading ? (
            <div className="py-8 text-center text-slate-500">Ricerca in corso...</div>
          ) : products.length > 0 ? (
            products.map(p => (
              <div 
                key={p.id} 
                className="flex items-center justify-between p-3 border rounded-lg hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-colors"
                onClick={() => {
                  onSelect(p)
                  onClose()
                }}
              >
                <div>
                  <div className="font-semibold text-slate-900">{p.name}</div>
                  <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                    {p.sku && <span>SKU: {p.sku}</span>}
                    {p.code && <span>Cod: {p.code}</span>}
                    {p.categoryName && <Badge variant="secondary" className="text-[10px] py-0">{p.categoryName}</Badge>}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">{formatCurrency(p.unitPrice)}</div>
                  <div className="text-xs text-slate-500">
                    Giacenza: <span className={p.stockQuantity && p.stockQuantity > 0 ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>{p.stockQuantity || 0}</span> {p.unitOfMeasure || 'pz'}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed bg-slate-50 py-10 text-center">
              <Package className="mx-auto mb-2 h-10 w-10 text-slate-300" />
              <p className="font-medium text-slate-600">Nessun prodotto trovato</p>
              <p className="text-sm text-slate-400">Prova a modificare i criteri di ricerca</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
