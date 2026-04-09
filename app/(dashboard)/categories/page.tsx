"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, Plus, Filter, Download, Edit, Trash2, Tag,
  RefreshCw
} from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { getPopupDialogContentClassName, getPopupPrimaryButtonClassName } from '@/components/layout/module-theme'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { PopupHeader } from '@/components/ui/popup-header'

interface Category {
  id: string
  name: string
  description?: string
  _count?: {
    products: number
  }
}

export default function CategoriesPage() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/categories')
      const result = await response.json()
      if (result.success) {
        setCategories(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenNew = () => {
    setEditingCategory(null)
    setFormData({ name: '', description: '' })
    setShowForm(true)
  }

  const handleOpenEdit = (cat: Category) => {
    setEditingCategory(cat)
    setFormData({ name: cat.name, description: cat.description || '' })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    setSaving(true)
    try {
      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories'
      const method = editingCategory ? 'PATCH' : 'POST'
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const result = await response.json()
      if (result.success) {
        toast({ title: 'Salvato', description: 'Categoria salvata con successo' })
        setShowForm(false)
        fetchCategories()
      } else {
        toast({ title: 'Errore', description: result.error || 'Errore salvataggio', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Errore', description: 'Errore di rete', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa categoria?')) return
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      const result = await res.json()
      if (result.success) {
        toast({ title: 'Eliminato', description: 'Categoria eliminata' })
        fetchCategories()
      } else {
        toast({ title: 'Errore', description: result.error || 'Impossibile eliminare', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Errore', description: 'Errore di rete', variant: 'destructive' })
    }
  }

  const handleExportCSV = () => {
    const rows = [
      ['Nome Categoria', 'Descrizione'],
      ...categories.map(c => [c.name, c.description || ''])
    ]
    const csv = rows.map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'categorie.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const filteredCategories = categories.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (c.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="bg-slate-100 p-4 md:p-6 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl px-6 py-4 text-white shadow">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Tag className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Categorie Prodotti</h1>
              <p className="text-amber-100 text-sm">Gestione categorie del magazzino</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchCategories} className="border-white/30 text-white hover:bg-white/10 bg-transparent">
              <RefreshCw className="h-4 w-4 mr-1.5" />Aggiorna
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="border-white/30 text-white hover:bg-white/10 bg-transparent">
              <Download className="h-4 w-4 mr-1.5" />Esporta
            </Button>
            <Button size="sm" onClick={handleOpenNew} className="bg-white text-orange-700 hover:bg-orange-50 font-semibold">
              <Plus className="h-4 w-4 mr-1.5" />Nuova Categoria
            </Button>
          </div>
        </div>

        {/* List */}
        <Card>
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Lista Categorie</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Cerca..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 h-9" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Caricamento...</div>
            ) : filteredCategories.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Nessuna categoria trovata</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrizione</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map(cat => (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell className="text-gray-500">{cat.description || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(cat)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(cat.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Dialog Form */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className={getPopupDialogContentClassName('max-w-lg')}>
            <PopupHeader
              theme="categories"
              title={editingCategory ? 'Modifica Categoria' : 'Nuova Categoria'}
              description="Gestisci la tassonomia del catalogo e del magazzino"
            />
            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <div>
                <Label>Nome Categoria</Label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required autoFocus />
              </div>
              <div>
                <Label>Descrizione (opzionale)</Label>
                <Input value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annulla</Button>
                <Button type="submit" disabled={saving || !formData.name.trim()} className={getPopupPrimaryButtonClassName('categories')}>
                  {saving ? 'Salvataggio...' : 'Salva'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
