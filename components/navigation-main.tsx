"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { 
  BarChart3,
  Users,
  Package,
  ShoppingCart,
  CreditCard,
  Settings,
  Menu,
  X,
  Zap,
  Building,
  TrendingUp,
  ClipboardList,
  Receipt,
  Truck,
  Factory,
  Warehouse,
  BookOpen,
  Wrench,
  Tag,
  MessageCircle,
  ChevronDown,
  ChevronRight,
  Search,
  Sparkles
} from 'lucide-react'
import { NexoraLogo } from '@/components/ui/nexora-logo'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

type NavigationItem = {
  name: string
  href: string
  icon: any
  description: string
  shortcut?: string
  keywords?: string[]
}

type NavigationGroup = {
  key: string
  label: string
  icon: any
  items: NavigationItem[]
}

const settingsItem: NavigationItem = {
  name: 'Impostazioni',
  href: '/settings',
  icon: Settings,
  description: 'Configurazioni azienda e sistema',
  shortcut: 'Ctrl+,',
  keywords: ['configurazione', 'setup', 'licenza', 'demo', 'full']
}

const navigationGroups: NavigationGroup[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: BarChart3,
    items: [
      { name: 'Cruscotto', href: '/dashboard-real', icon: BarChart3, description: 'Panoramica KPI e briefing operativo', shortcut: 'Ctrl+1', keywords: ['dashboard', 'home', 'briefing', 'kpi'] }
    ]
  },
  {
    key: 'sales',
    label: 'Vendite',
    icon: Receipt,
    items: [
      { name: 'Preventivi', href: '/estimates', icon: ClipboardList, description: 'Offerte commerciali e conversione in fattura', shortcut: 'Ctrl+2', keywords: ['offerte', 'quote', 'stima'] },
      { name: 'Fatture', href: '/invoices', icon: Receipt, description: 'Emissione e monitoraggio fatture', shortcut: 'Ctrl+3', keywords: ['fatturazione', 'invoice'] },
      { name: 'DDT', href: '/ddts', icon: Truck, description: 'Documenti di trasporto e consegne', keywords: ['trasporto', 'spedizione', 'delivery'] },
      { name: 'Ordini Clienti / Vendita Banco', href: '/orders', icon: ShoppingCart, description: 'Ordini clienti e vendite rapide', keywords: ['vendita banco', 'ordini clienti', 'pos', 'banco'] }
    ]
  },
  {
    key: 'records',
    label: 'Anagrafiche',
    icon: Users,
    items: [
      { name: 'Clienti', href: '/customers', icon: Users, description: 'Rubrica clienti e contatti', shortcut: 'Ctrl+4', keywords: ['anagrafica clienti', 'crm'] },
      { name: 'Fornitori', href: '/suppliers', icon: Building, description: 'Anagrafica fornitori e referenti', keywords: ['vendor', 'supplier'] },
      { name: 'Categorie', href: '/categories', icon: Tag, description: 'Catalogazione prodotti e linee business', keywords: ['tag', 'classificazione'] }
    ]
  },
  {
    key: 'warehouse',
    label: 'Magazzino',
    icon: Warehouse,
    items: [
      { name: 'Prodotti', href: '/products', icon: Package, description: 'Catalogo, scorte e prezzi', shortcut: 'Ctrl+5', keywords: ['articoli', 'catalogo', 'sku'] },
      { name: 'Magazzino', href: '/warehouse', icon: Warehouse, description: 'Giacenze e movimenti recenti', keywords: ['stock', 'inventario', 'warehouse'] },
      { name: 'Ordini Fornitore', href: '/supplier-orders', icon: Factory, description: 'Riordini e carichi fornitore', keywords: ['riordino', 'acquisti', 'fornitore'] }
    ]
  },
  {
    key: 'finance',
    label: 'Finanza',
    icon: CreditCard,
    items: [
      { name: 'Pagamenti', href: '/payments', icon: CreditCard, description: 'Incassi, scadenze e insoluti', keywords: ['incassi', 'scadenzario', 'crediti'] },
      { name: 'Libro Cassa', href: '/cash-book', icon: BookOpen, description: 'Flussi cassa e uscite operative', keywords: ['cassa', 'cash book', 'movimenti'] }
    ]
  },
  {
    key: 'services',
    label: 'Servizi',
    icon: Wrench,
    items: [
      { name: 'Riparazioni', href: '/repairs', icon: Wrench, description: 'Assistenza tecnica e stati lavorazione', keywords: ['assistenza', 'laboratorio', 'repair'] },
      { name: 'Workflow', href: '/workflows', icon: Zap, description: 'Automazioni e processi interni', keywords: ['automazioni', 'regole', 'workflow engine'] }
    ]
  },
  {
    key: 'analytics',
    label: 'Analisi',
    icon: TrendingUp,
    items: [
      { name: 'Analisi e Report', href: '/reports', icon: TrendingUp, description: 'Performance commerciali e reportistica', keywords: ['report', 'vendite', 'analisi'] },
      { name: 'Analytics', href: '/analytics', icon: BarChart3, description: 'Statistiche avanzate e dashboard executive', keywords: ['statistiche', 'executive', 'bi'] }
    ]
  },
  {
    key: 'copilot',
    label: 'NEXORA Copilot',
    icon: Sparkles,
    items: [
      { name: 'NEXORA Copilot', href: '/ai-assistant', icon: MessageCircle, description: 'Assistente intelligente e azioni guidate', shortcut: 'Ctrl+J', keywords: ['ai', 'assistant', 'copilot', 'chat'] }
    ]
  }
]

export default function NavigationMain() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedSearchIndex, setHighlightedSearchIndex] = useState(0)
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    dashboard: true,
    sales: true,
    records: true,
    warehouse: true,
    finance: false,
    services: false,
    analytics: false,
    copilot: true
  })

  const isItemActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  const isGroupActive = (group: NavigationGroup) => group.items.some((item) => isItemActive(item.href))

  const searchItems = navigationGroups.reduce((items, group) => {
    group.items.forEach((item) => {
      items.push({
        ...item,
        groupLabel: group.label
      })
    })

    return items
  }, [] as Array<NavigationItem & { groupLabel: string }>)

  searchItems.push({
    ...settingsItem,
    groupLabel: 'Sistema'
  })

  const filteredSearchItems = searchItems.filter((item) => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    if (!normalizedQuery) {
      return true
    }

    return [item.name, item.description, item.groupLabel, item.shortcut, item.href, ...(item.keywords || [])]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(normalizedQuery))
  })

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (!searchOpen) {
      setSearchQuery('')
      setHighlightedSearchIndex(0)
    }
  }, [searchOpen])

  useEffect(() => {
    setHighlightedSearchIndex(0)
  }, [searchQuery])

  const toggleGroup = (groupKey: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }))
  }

  const openSearchItem = (item: NavigationItem) => {
    setSearchOpen(false)
    setMobileMenuOpen(false)
    router.push(item.href)
  }

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!filteredSearchItems.length) {
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightedSearchIndex((prev) => (prev + 1) % filteredSearchItems.length)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightedSearchIndex((prev) => (prev - 1 + filteredSearchItems.length) % filteredSearchItems.length)
      return
    }

    if (event.key === 'Enter') {
      event.preventDefault()
      openSearchItem(filteredSearchItems[highlightedSearchIndex])
    }
  }

  const renderNavigationGroups = (isMobile = false) => (
    <div className={isMobile ? 'px-2 pt-2 pb-3 space-y-2' : 'flex-1 px-3 py-5 space-y-3'}>
      <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/5"
          title="Apri ricerca globale"
        >
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-400" />
            Ricerca globale
          </div>
          <span className="rounded-md border border-white/10 bg-slate-900/70 px-2 py-0.5 text-[10px] text-slate-300">Ctrl+K</span>
        </button>
      </div>

      {navigationGroups.map((group) => {
        const GroupIcon = group.icon
        const groupActive = isGroupActive(group)
        const groupOpen = openGroups[group.key]

        return (
          <div key={group.key} className="space-y-1">
            <button
              type="button"
              onClick={() => toggleGroup(group.key)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.14em] transition-all ${
                groupActive ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <span className="flex items-center gap-2">
                <GroupIcon className="h-4 w-4" />
                {group.label}
              </span>
              {groupOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>

            {groupOpen && (
              <div className="space-y-1 pl-2">
                {group.items.map((item) => {
                  const isActive = isItemActive(item.href)
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => isMobile && setMobileMenuOpen(false)}
                      title={`${item.description}${item.shortcut ? ` • ${item.shortcut}` : ''}`}
                      className={`group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-blue-500/90 text-white shadow-md shadow-blue-900/30'
                          : 'text-slate-200 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center">
                        <item.icon className={`mr-3 h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                        {item.name}
                      </span>
                      {item.shortcut && (
                        <span className={`rounded-md border px-1.5 py-0.5 text-[10px] ${
                          isActive
                            ? 'border-white/30 bg-white/10 text-white'
                            : 'border-white/10 bg-slate-900/60 text-slate-400'
                        }`}>
                          {item.shortcut}
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      <div className="pt-2">
        <Link
          href={settingsItem.href}
          onClick={() => isMobile && setMobileMenuOpen(false)}
          title={`${settingsItem.description}${settingsItem.shortcut ? ` • ${settingsItem.shortcut}` : ''}`}
          className={`group flex items-center justify-between rounded-xl px-3 py-3 text-sm font-medium transition-all ${
            isItemActive(settingsItem.href)
              ? 'bg-white text-slate-900 shadow-md'
              : 'border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white'
          }`}
        >
          <span className="flex items-center">
            <settingsItem.icon className={`mr-3 h-4 w-4 ${isItemActive(settingsItem.href) ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-200'}`} />
            {settingsItem.name}
          </span>
          {settingsItem.shortcut && (
            <span className={`rounded-md border px-1.5 py-0.5 text-[10px] ${
              isItemActive(settingsItem.href)
                ? 'border-slate-200 bg-slate-100 text-slate-700'
                : 'border-white/10 bg-slate-900/60 text-slate-400'
            }`}>
              {settingsItem.shortcut}
            </span>
          )}
        </Link>
      </div>
    </div>
  )

  return (
    <>
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-2xl border-slate-200 p-0">
          <div className="border-b border-slate-200 p-4">
            <DialogTitle className="text-base font-semibold text-slate-900">Ricerca globale</DialogTitle>
            <div className="mt-3">
              <Input
                autoFocus
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Cerca modulo, funzione o scorciatoia..."
                className="h-11"
              />
            </div>
          </div>
          <div className="max-h-[420px] overflow-y-auto p-2">
            {filteredSearchItems.length > 0 ? filteredSearchItems.map((item) => (
              <Link
                key={`${item.groupLabel}-${item.href}`}
                href={item.href}
                onClick={(event) => {
                  event.preventDefault()
                  openSearchItem(item)
                }}
                onMouseEnter={() => setHighlightedSearchIndex(filteredSearchItems.findIndex((entry) => entry.href === item.href && entry.groupLabel === item.groupLabel))}
                className={`flex items-start justify-between rounded-xl px-3 py-3 transition ${highlightedSearchIndex === filteredSearchItems.findIndex((entry) => entry.href === item.href && entry.groupLabel === item.groupLabel) ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
              >
                <span className="flex items-start gap-3">
                  <item.icon className="mt-0.5 h-4 w-4 text-slate-500" />
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">{item.name}</span>
                    <span className="block text-xs text-slate-500">{item.groupLabel} · {item.description}</span>
                  </span>
                </span>
                {item.shortcut ? <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-500">{item.shortcut}</span> : null}
              </Link>
            )) : (
              <div className="px-3 py-8 text-center text-sm text-slate-500">Nessun risultato trovato per questa ricerca.</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Desktop Navigation */}
      <nav className="hidden lg:flex lg:flex-col lg:w-64 lg:bg-gradient-to-b lg:from-slate-700 lg:to-slate-900 lg:border-r lg:border-slate-800 shadow-xl">
        <div className="flex flex-col flex-grow">
          <div className="flex items-center h-16 px-4 bg-slate-800 border-b border-slate-700">
            <NexoraLogo className="w-8 h-8" showText={true} textClassName="text-white font-bold text-lg tracking-tight" />
          </div>
          
          {renderNavigationGroups()}
          
          <div className="border-t border-slate-800 p-3">
            <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              v4.0.0
            </div>
            <div className="px-3 pb-2 text-[11px] leading-5 text-slate-400">
              NEXORA • progetto ideato e sviluppato da <span className="font-semibold text-slate-200">Gaetano Meli</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between h-16 px-4 bg-slate-900 border-b border-slate-800">
          <NexoraLogo className="w-8 h-8" showText={true} textClassName="text-white font-bold text-lg tracking-tight" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-900 border-b border-slate-800">
            {renderNavigationGroups(true)}
            <div className="px-4 pb-4 text-[11px] leading-5 text-slate-400">
              NEXORA • progetto ideato e sviluppato da <span className="font-semibold text-slate-200">Gaetano Meli</span>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
