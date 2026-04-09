"use client"

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen, Plus, Printer, RefreshCw,
  Wallet, Search, ArrowUpCircle, ArrowDownCircle,
  Calendar, X, ShoppingBag, PiggyBank, Banknote
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { formatDateTime } from '@/lib/utils'
import { getPopupDialogContentClassName, getPopupPrimaryButtonClassName } from '@/components/layout/module-theme'
import { PageShell } from '@/components/layout/page-shell'
import { PopupHeader } from '@/components/ui/popup-header'
import { ThemeTable, getThemeTableEmptyStateClassName, getThemeTableHeaderClassName, getThemeTableHeadClassName } from '@/components/ui/theme-table'

interface Movement {
  id: string
  date: string
  type: 'IN' | 'OUT'
  category: string
  description: string
  subject: string
  method: string
  in: number
  out: number
  runningBalance: number
  notes: string
  reference: string
}

interface Totals {
  totalIn: number
  totalOut: number
  balance: number
  costoMerce: number
  denaroInCassa: number
  guadagnoEffettivo: number
  liquiditaContanti: number
  liquiditaBanca: number
}

const DEFAULT_TOTALS: Totals = {
  totalIn: 0,
  totalOut: 0,
  balance: 0,
  costoMerce: 0,
  denaroInCassa: 0,
  guadagnoEffettivo: 0,
  liquiditaContanti: 0,
  liquiditaBanca: 0
}

const toFiniteNumber = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const escapeHtml = (value: unknown) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;')

function normalizeTotals(value: Partial<Totals> | undefined): Totals {
  return {
    totalIn: toFiniteNumber(value?.totalIn),
    totalOut: toFiniteNumber(value?.totalOut),
    balance: toFiniteNumber(value?.balance),
    costoMerce: toFiniteNumber(value?.costoMerce),
    denaroInCassa: toFiniteNumber(value?.denaroInCassa),
    guadagnoEffettivo: toFiniteNumber(value?.guadagnoEffettivo),
    liquiditaContanti: toFiniteNumber(value?.liquiditaContanti),
    liquiditaBanca: toFiniteNumber(value?.liquiditaBanca)
  }
}

const PAYMENT_METHODS = ['CONTANTI', 'BONIFICO', 'CARTA', 'ASSEGNO', 'PAYPAL', 'ALTRO']
const EXPENSE_CATEGORIES = [
  'Forniture', 'Affitto', 'Utenze', 'Personale', 'Trasporto', 'Marketing',
  'Manutenzione', 'Tasse', 'Consulenze', 'Attrezzatura', 'Generale', 'Altro'
]

function getToday() {
  return new Date().toISOString().split('T')[0]
}
function getFirstOfMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export default function CashBookPage() {
  const { toast } = useToast()
  const printRef = useRef<HTMLDivElement>(null)

  const [movements, setMovements] = useState<Movement[]>([])
  const [totals, setTotals] = useState<Totals>(DEFAULT_TOTALS)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'IN' | 'OUT'>('all')
  const [dateFrom, setDateFrom] = useState(getFirstOfMonth())
  const [dateTo, setDateTo] = useState(getToday())

  // Expense dialog
  const [showExpense, setShowExpense] = useState(false)
  const [expCategory, setExpCategory] = useState('Generale')
  const [expDescription, setExpDescription] = useState('')
  const [expAmount, setExpAmount] = useState('')
  const [expMethod, setExpMethod] = useState('CONTANTI')
  const [expDate, setExpDate] = useState(getToday())
  const [expNotes, setExpNotes] = useState('')
  const [expLoading, setExpLoading] = useState(false)

  useEffect(() => { fetchCashBook() }, [dateFrom, dateTo])

  const fetchCashBook = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ startDate: dateFrom, endDate: dateTo })
      const res = await fetch(`/api/cash-book?${params}`, { cache: 'no-store' })
      const result = await res.json()
      if (result.success) {
        setMovements(result.data.movements || [])
        setTotals(normalizeTotals(result.data.totals))
      }
    } catch {
      toast({ title: 'Errore', description: 'Errore caricamento libro cassa', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveExpense = async () => {
    if (!expAmount || parseFloat(expAmount) <= 0) {
      toast({ title: 'Errore', description: 'Inserisci un importo valido', variant: 'destructive' })
      return
    }
    setExpLoading(true)
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: expCategory,
          description: expDescription,
          amount: parseFloat(expAmount),
          paymentMethod: expMethod,
          expenseDate: expDate,
          notes: expNotes
        })
      })
      const result = await res.json()
      if (result.success) {
        toast({ title: 'Spesa registrata', description: `€ ${parseFloat(expAmount).toFixed(2)} — ${expCategory}` })
        await fetchCashBook()
        setShowExpense(false)
        setExpAmount(''); setExpDescription(''); setExpNotes('')
        setExpCategory('Generale'); setExpMethod('CONTANTI'); setExpDate(getToday())
      } else {
        toast({ title: 'Errore', description: result.error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Errore', description: 'Errore di rete', variant: 'destructive' })
    } finally {
      setExpLoading(false)
    }
  }

  const handlePrint = () => {
    if (filteredMovements.length === 0) {
      toast({ title: 'Nessun movimento da stampare', description: 'Seleziona un periodo con dati prima di generare il PDF del libro cassa.' })
      return
    }

    const win = window.open('', '_blank')
    if (!win) return

    const rows = filteredMovements.map((movement) => `
      <tr>
        <td>${escapeHtml(fmtDate(movement.date))}</td>
        <td><span class="type-pill ${movement.type === 'IN' ? 'type-pill--in' : 'type-pill--out'}">${movement.type === 'IN' ? 'Entrata' : 'Uscita'}</span></td>
        <td>${escapeHtml(movement.category || '—')}</td>
        <td>${escapeHtml(movement.description || '—')}</td>
        <td>${escapeHtml(movement.subject || '—')}</td>
        <td>${escapeHtml(movement.method || '—')}</td>
        <td class="text-right amount-in">${movement.in > 0 ? escapeHtml(fmt(movement.in)) : '—'}</td>
        <td class="text-right amount-out">${movement.out > 0 ? escapeHtml(fmt(movement.out)) : '—'}</td>
        <td class="text-right amount-balance">${escapeHtml(fmt(movement.runningBalance))}</td>
      </tr>
    `).join('')

    win.document.write(`
      <html><head><title>Libro Cassa — ${dateFrom} / ${dateTo}</title>
      <style>
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #0f172a; background: #eef4ff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .report-shell { padding: 26px; }
        .report-header { padding: 22px 24px; border-radius: 24px; background: linear-gradient(135deg, #0f172a 0%, #1d4ed8 52%, #0f766e 100%); color: #ffffff; box-shadow: 0 20px 48px rgba(15, 23, 42, 0.18); }
        .brand-kicker { font-size: 10px; font-weight: 700; letter-spacing: 0.28em; text-transform: uppercase; opacity: 0.8; }
        h1 { margin: 10px 0 6px; font-size: 28px; letter-spacing: 0.04em; }
        .subtitle { font-size: 12px; opacity: 0.88; }
        .summary-grid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; margin: 18px 0; }
        .summary-card { border-radius: 18px; padding: 14px 16px; background: #ffffff; border: 1px solid #dbe4f0; box-shadow: 0 10px 24px rgba(15, 23, 42, 0.08); }
        .summary-card .label { font-size: 10px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: #475569; }
        .summary-card .value { margin-top: 8px; font-size: 20px; font-weight: 800; }
        .summary-card .note { margin-top: 5px; font-size: 10px; color: #64748b; }
        .summary-card--in .value { color: #15803d; }
        .summary-card--out .value { color: #b91c1c; }
        .summary-card--cash .value { color: #1d4ed8; }
        .summary-card--stock .value { color: #a16207; }
        .summary-card--profit { background: linear-gradient(135deg, #0f172a 0%, #312e81 100%); border-color: #1e293b; }
        .summary-card--profit .label, .summary-card--profit .value, .summary-card--profit .note { color: #ffffff; }
        .liquidity-card { margin-bottom: 18px; padding: 16px 18px; border-radius: 18px; background: linear-gradient(135deg, #ecfeff 0%, #eff6ff 100%); border: 1px solid #bfdbfe; color: #0f172a; }
        .liquidity-card strong { display: block; margin-bottom: 8px; font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: #0f766e; }
        .liquidity-values { display: flex; gap: 24px; flex-wrap: wrap; }
        .liquidity-values span { font-size: 12px; }
        .table-shell { border-radius: 22px; background: #ffffff; border: 1px solid #dbe4f0; box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08); overflow: hidden; }
        .table-title { padding: 16px 20px; background: linear-gradient(135deg, #e0ecff 0%, #f8fbff 100%); border-bottom: 1px solid #dbe4f0; font-size: 11px; font-weight: 800; letter-spacing: 0.12em; text-transform: uppercase; color: #1e3a8a; }
        table { width: 100%; border-collapse: collapse; }
        th { padding: 11px 12px; background: #eff6ff; color: #334155; text-align: left; font-size: 10px; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; border-bottom: 1px solid #dbe4f0; }
        td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 11px; vertical-align: middle; }
        tbody tr:nth-child(even) { background: #f8fbff; }
        .text-right { text-align: right; }
        .type-pill { display: inline-flex; border-radius: 999px; padding: 4px 9px; font-size: 10px; font-weight: 700; letter-spacing: 0.04em; }
        .type-pill--in { background: #dcfce7; color: #15803d; }
        .type-pill--out { background: #fee2e2; color: #b91c1c; }
        .amount-in { color: #15803d; font-weight: 700; }
        .amount-out { color: #b91c1c; font-weight: 700; }
        .amount-balance { color: #1e3a8a; font-weight: 800; }
        .footer-note { margin-top: 12px; text-align: right; font-size: 10px; color: #64748b; }
        @page { margin: 14mm; }
        @media print { body { background: #ffffff; } .report-shell { padding: 0; } }
      </style></head><body>
      <div class="report-shell">
        <div class="report-header">
          <div class="brand-kicker">NEXORA V4 ENTERPRISE</div>
          <h1>Libro Cassa</h1>
          <div class="subtitle">Periodo ${escapeHtml(fmtDate(dateFrom))} → ${escapeHtml(fmtDate(dateTo))} • ${filteredMovements.length} movimenti registrati</div>
        </div>

        <div class="summary-grid">
          <div class="summary-card summary-card--in"><div class="label">Incassi reali</div><div class="value">${escapeHtml(fmt(totals.totalIn))}</div><div class="note">Entrate incassate nel periodo</div></div>
          <div class="summary-card summary-card--out"><div class="label">Spese aziendali</div><div class="value">${escapeHtml(fmt(totals.totalOut))}</div><div class="note">Uscite operative registrate</div></div>
          <div class="summary-card summary-card--cash"><div class="label">Denaro in cassa</div><div class="value">${escapeHtml(fmt(totals.denaroInCassa))}</div><div class="note">Incassi vendite - spese</div></div>
          <div class="summary-card summary-card--stock"><div class="label">Costo merce</div><div class="value">${escapeHtml(fmt(totals.costoMerce))}</div><div class="note">Valore della merce venduta</div></div>
          <div class="summary-card summary-card--profit"><div class="label">Guadagno effettivo</div><div class="value">${escapeHtml(fmt(totals.guadagnoEffettivo))}</div><div class="note">Incassi vendite - costo merce - spese</div></div>
        </div>

        <div class="liquidity-card">
          <strong>Liquidità ripartita</strong>
          <div class="liquidity-values">
            <span>Contanti: <b>${escapeHtml(fmt(totals.liquiditaContanti))}</b></span>
            <span>Banca / POS: <b>${escapeHtml(fmt(totals.liquiditaBanca))}</b></span>
            <span>Saldo progressivo finale: <b>${escapeHtml(fmt(totals.balance))}</b></span>
          </div>
        </div>

        <div class="table-shell">
          <div class="table-title">Movimenti di cassa</div>
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Categoria</th>
                <th>Descrizione</th>
                <th>Cliente / Fornitore</th>
                <th>Metodo</th>
                <th class="text-right">Entrata</th>
                <th class="text-right">Uscita</th>
                <th class="text-right">Saldo</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div class="footer-note">Documento generato da NEXORA V4 Enterprise</div>
      </div>
      </body></html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 400)
  }

  const filteredMovements = movements.filter(m => {
    if (typeFilter !== 'all' && m.type !== typeFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return m.description.toLowerCase().includes(q) ||
        m.subject.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.reference.toLowerCase().includes(q)
    }
    return true
  })

  const fmt = (n: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n)
  const fmtDate = (d: string) => formatDateTime(d)

  return (
    <PageShell
      title="Libro Cassa"
      description="Registro contabile giornaliero — entrate e uscite"
      icon={Wallet}
      theme="cashBook"
      actions={
        <>
          <Button variant="outline" onClick={fetchCashBook} disabled={loading} className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Aggiorna
          </Button>
          <Button variant="outline" onClick={handlePrint} className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <Printer className="h-4 w-4 mr-2" />
            Stampa
          </Button>
          <Button onClick={() => setShowExpense(true)} className="border border-teal-400/40 bg-teal-600 text-white hover:bg-teal-700 shadow-[0_14px_30px_-18px_rgba(13,148,136,0.75)]">
            <Plus className="h-4 w-4 mr-2" />
            Registra Spesa
          </Button>
        </>
      }
    >
      <div className="space-y-6">

        {/* Date filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-semibold text-slate-700">Periodo:</span>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm text-slate-600">Dal</Label>
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40 h-9" />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-sm text-slate-600">Al</Label>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40 h-9" />
              </div>
              <div className="flex gap-2 ml-2">
                {[
                  { label: 'Oggi', fn: () => { setDateFrom(getToday()); setDateTo(getToday()) } },
                  { label: 'Questo mese', fn: () => { setDateFrom(getFirstOfMonth()); setDateTo(getToday()) } },
                  { label: 'Ultimi 30 gg', fn: () => {
                    const d = new Date(); d.setDate(d.getDate() - 30)
                    setDateFrom(d.toISOString().split('T')[0]); setDateTo(getToday())
                  }},
                  { label: 'Anno', fn: () => {
                    setDateFrom(`${new Date().getFullYear()}-01-01`); setDateTo(getToday())
                  }}
                ].map(btn => (
                  <Button key={btn.label} variant="outline" size="sm" onClick={btn.fn} className="text-xs h-8 px-3">
                    {btn.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 5 WFP-style stat cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5">
          {/* INCASSI REALI */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="border-l-4 border-l-green-500 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-green-600 truncate">INCASSI REALI</p>
                    <p className="mt-0.5 mb-2 text-[10px] font-medium text-green-700/80">Soli entrate nel periodo</p>
                    <p className="text-xl font-bold text-green-600">{fmt(totals.totalIn)}</p>
                  </div>
                  <ArrowUpCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          {/* SPESE AZIENDALI */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
            <Card className="border-l-4 border-l-red-500 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-red-600 truncate">SPESE AZIENDALI</p>
                    <p className="mt-0.5 mb-2 text-[10px] font-medium text-red-700/80">Uscite di cassa / fornitore</p>
                    <p className="text-xl font-bold text-red-600">{fmt(totals.totalOut)}</p>
                  </div>
                  <ArrowDownCircle className="h-5 w-5 flex-shrink-0 mt-0.5 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          {/* DENARO IN CASSA */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }}>
            <Card className="border-l-4 border-l-blue-500 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-blue-700 truncate">DENARO IN CASSA</p>
                    <p className="mt-0.5 mb-2 text-[10px] font-medium text-blue-800/80">Incassi - Spese Aziendali</p>
                    <p className={`text-xl font-bold ${totals.denaroInCassa >= 0 ? 'text-blue-700' : 'text-orange-600'}`}>{fmt(totals.denaroInCassa)}</p>
                  </div>
                  <Wallet className="h-5 w-5 flex-shrink-0 mt-0.5 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          {/* COSTO MERCE */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}>
            <Card className="border-l-4 border-l-yellow-500 bg-yellow-50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-yellow-700 truncate">COSTO MERCE</p>
                    <p className="mt-0.5 mb-2 text-[10px] font-medium text-yellow-800/80">Valore merce venduta</p>
                    <p className="text-xl font-bold text-yellow-700">{fmt(totals.costoMerce)}</p>
                  </div>
                  <ShoppingBag className="h-5 w-5 flex-shrink-0 mt-0.5 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
          {/* GUADAGNO EFFETTIVO */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}>
            <Card className={`border-l-4 border-l-indigo-500 ${totals.guadagnoEffettivo >= 0 ? '!bg-slate-900 shadow-[0_18px_36px_-24px_rgba(15,23,42,0.9)]' : '!bg-rose-950 shadow-[0_18px_36px_-24px_rgba(127,29,29,0.9)]'}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-white truncate">GUADAGNO EFFETTIVO</p>
                    <p className="text-[10px] mt-0.5 mb-2 text-white/80">Incassi vendite - costo merce - spese</p>
                    <p className={`text-xl font-bold ${totals.guadagnoEffettivo >= 0 ? 'text-white' : 'text-rose-200'}`}>{fmt(totals.guadagnoEffettivo)}</p>
                  </div>
                  <div className="rounded-full bg-white/10 p-2 ring-1 ring-white/15">
                    <PiggyBank className="h-5 w-5 flex-shrink-0 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Liquidità ripartita */}
        <Card className="border-slate-200">
          <CardContent className="py-3 px-5">
            <div className="flex flex-wrap items-center gap-6">
              <span className="text-sm font-semibold text-slate-600 flex items-center gap-2">
                <Banknote className="h-4 w-4" /> Liquidità ripartita:
              </span>
              <span className="text-sm">
                <span className="font-medium text-slate-500">Contanti:</span>{' '}
                <span className={`font-bold ${totals.liquiditaContanti >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmt(totals.liquiditaContanti)}</span>
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-sm">
                <span className="font-medium text-slate-500">Banca / POS:</span>{' '}
                <span className={`font-bold ${totals.liquiditaBanca >= 0 ? 'text-blue-700' : 'text-red-600'}`}>{fmt(totals.liquiditaBanca)}</span>
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Search + type filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input placeholder="Cerca descrizione, cliente, categoria..." className="pl-9 h-9"
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              </div>
              <div className="flex gap-2">
                {(['all', 'IN', 'OUT'] as const).map(t => (
                  <Button key={t} size="sm"
                    variant={typeFilter === t ? 'default' : 'outline'}
                    className={typeFilter === t ? '' : ''}
                    onClick={() => setTypeFilter(t)}>
                    {t === 'all' ? 'Tutti' : t === 'IN' ? '↑ Entrate' : '↓ Uscite'}
                  </Button>
                ))}
              </div>
              <span className="ml-auto text-sm font-medium text-slate-500">{filteredMovements.length} movimenti</span>
            </div>
          </CardContent>
        </Card>

        {/* Printable area */}
        <div ref={printRef}>
          {/* Print header (hidden on screen) */}
          <div className="hidden print:block mb-4">
            <h1 style={{ fontSize: 18, fontWeight: 'bold' }}>Libro Cassa</h1>
            <div className="subtitle">Periodo: {dateFrom} / {dateTo}</div>
            <div className="totals">
              <div className="total-card"><div className="label">Incassi reali</div><div className="value in">{fmt(totals.totalIn)}</div></div>
              <div className="total-card"><div className="label">Spese aziendali</div><div className="value out">{fmt(totals.totalOut)}</div></div>
              <div className="total-card"><div className="label">Denaro in cassa</div><div className="value info">{fmt(totals.denaroInCassa)}</div></div>
              <div className="total-card"><div className="label">Costo merce</div><div className="value warning">{fmt(totals.costoMerce)}</div></div>
              <div className="total-card"><div className="label">Guadagno effettivo</div><div className="value dark">{fmt(totals.guadagnoEffettivo)}</div></div>
              <div className="total-card"><div className="label">Saldo progressivo</div><div className="value">{fmt(totals.balance)}</div></div>
            </div>
            <div className="liquidity">
              <strong>Liquidità ripartita:</strong> Contanti {fmt(totals.liquiditaContanti)} | Banca / POS {fmt(totals.liquiditaBanca)}
            </div>
          </div>

          {/* Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Movimenti — {dateFrom !== dateTo ? `${fmtDate(dateFrom)} → ${fmtDate(dateTo)}` : fmtDate(dateFrom)}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <RefreshCw className="h-6 w-6 animate-spin text-blue-600 mr-3" />
                  <span className="font-medium text-slate-600">Caricamento...</span>
                </div>
              ) : filteredMovements.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    icon={BookOpen}
                    title="Nessun dato trovato"
                    description="Non ci sono movimenti nel periodo selezionato. Modifica le date o registra una spesa."
                    className={getThemeTableEmptyStateClassName('cashBook')}
                  />
                </div>
              ) : (
                <ThemeTable theme="cashBook">
                  <TableHeader className={getThemeTableHeaderClassName('cashBook')}>
                    <TableRow>
                      <TableHead className={getThemeTableHeadClassName('cashBook')}>Data</TableHead>
                      <TableHead className={getThemeTableHeadClassName('cashBook')}>Tipo</TableHead>
                      <TableHead className={getThemeTableHeadClassName('cashBook')}>Categoria</TableHead>
                      <TableHead className={getThemeTableHeadClassName('cashBook')}>Descrizione</TableHead>
                      <TableHead className={getThemeTableHeadClassName('cashBook')}>Cliente / Fornitore</TableHead>
                      <TableHead className={getThemeTableHeadClassName('cashBook')}>Metodo</TableHead>
                      <TableHead className={getThemeTableHeadClassName('cashBook', 'text-right text-green-800')}>Entrata</TableHead>
                      <TableHead className={getThemeTableHeadClassName('cashBook', 'text-right text-red-700')}>Uscita</TableHead>
                      <TableHead className={getThemeTableHeadClassName('cashBook', 'text-right')}>Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMovements.map(m => (
                      <TableRow key={m.id} className={m.type === 'IN' ? 'hover:bg-green-50/40' : 'hover:bg-red-50/40'}>
                        <TableCell className="text-sm font-mono text-slate-800">{fmtDate(m.date)}</TableCell>
                        <TableCell>
                          {m.type === 'IN'
                            ? <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">↑ Entrata</Badge>
                            : <Badge className="bg-red-100 text-red-700 border-red-200 text-xs">↓ Uscita</Badge>}
                        </TableCell>
                        <TableCell className="text-sm font-medium text-slate-700">{m.category}</TableCell>
                        <TableCell className="max-w-48 truncate font-semibold text-slate-900" title={m.description}>{m.description}</TableCell>
                        <TableCell className="max-w-36 truncate text-sm text-slate-700" title={m.subject}>{m.subject || '—'}</TableCell>
                        <TableCell className="text-xs font-medium text-slate-500">{m.method}</TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          {m.in > 0 ? fmt(m.in) : ''}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-red-600">
                          {m.out > 0 ? fmt(m.out) : ''}
                        </TableCell>
                        <TableCell className={`text-right font-bold ${m.runningBalance >= 0 ? 'text-blue-700' : 'text-orange-600'}`}>
                          {fmt(m.runningBalance)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </ThemeTable>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Registra Spesa Dialog */}
        <Dialog open={showExpense} onOpenChange={setShowExpense}>
          <DialogContent className={getPopupDialogContentClassName("max-w-md")}>
            <PopupHeader
              theme="cashBook"
              title="Registra Spesa"
              description="Inserisci una spesa manuale nel libro cassa"
              icon={ArrowDownCircle}
            />
            <div className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Data *</Label>
                  <Input type="date" value={expDate} onChange={e => setExpDate(e.target.value)} />
                </div>
                <div>
                  <Label>Importo (€) *</Label>
                  <Input type="number" step="0.01" min="0" placeholder="0.00"
                    value={expAmount} onChange={e => setExpAmount(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Categoria</Label>
                <Select value={expCategory} onValueChange={setExpCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Descrizione</Label>
                <Input placeholder="Breve descrizione della spesa..."
                  value={expDescription} onChange={e => setExpDescription(e.target.value)} />
              </div>
              <div>
                <Label>Metodo di Pagamento</Label>
                <Select value={expMethod} onValueChange={setExpMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Note</Label>
                <Textarea placeholder="Note aggiuntive..." rows={2}
                  value={expNotes} onChange={e => setExpNotes(e.target.value)} />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowExpense(false)}>Annulla</Button>
                <Button onClick={handleSaveExpense} disabled={expLoading} className={getPopupPrimaryButtonClassName('cashBook')}>
                  {expLoading ? 'Salvataggio...' : 'Registra Uscita'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </PageShell>
  )
}

