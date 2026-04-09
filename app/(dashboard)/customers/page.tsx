"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Upload, 
  Edit, 
  Trash2, 
  Eye, 
  Phone, 
  Mail, 
  Building,
  Users,
  TrendingUp,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  MoreHorizontal,
  Star,
  MapPin,
  CreditCard,
  FileText,
  Settings,
  RefreshCw
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ThemeTable, getThemeTableActionButtonClassName, getThemeTableEmptyStateActionClassName, getThemeTableEmptyStateClassName, getThemeTableHeadClassName, getThemeTableHeaderClassName, getThemeTableRowClassName, getThemeTableStatusBadgeClassName, getThemeTableStickyCellClassName } from '@/components/ui/theme-table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useToast } from "@/hooks/use-toast"
import { CustomerForm } from '@/components/forms/customer-form'
import { CsvImportDialog } from '@/components/ui/csv-import-dialog'
import { getPopupDialogContentClassName, getPopupPrimaryButtonClassName } from '@/components/layout/module-theme'
import { PageShell, PageShellLoading } from '@/components/layout/page-shell'
import { PopupHeader } from '@/components/ui/popup-header'

interface CustomerInvoice {
  id: string
  totalAmount: number
  status: string
  issueDate: string
}

interface CustomerContact {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  mobile?: string
  position?: string
  isPrimary?: boolean
}

interface CustomerStatisticsSummary {
  totalInvoicesAmount: number
  paidInvoicesAmount: number
  outstandingBalance: number
  invoiceCount: number
  averageOrderValue: number
  lastInvoiceDate?: string
  totalContacts: number
  activeProjects: number
}

interface Customer {
  id: string
  code?: string
  name: string
  displayName: string
  legalName?: string
  businessName?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  mobile?: string
  website?: string
  vatNumber?: string
  fiscalCode?: string
  taxCode?: string
  sdiCode?: string
  pecEmail?: string
  type: string
  status: string
  paymentTerms?: string
  creditLimit: number
  creditUsed: number
  rating?: number
  tags: string[]
  createdAt: string
  lastContactAt?: string
  address?: string
  city?: string
  province?: string
  postalCode?: string
  country?: string
  billingAddress?: string
  shippingAddress?: string
  sameAsBilling?: boolean
  notes?: string
  totalInvoices: number
  totalRevenue: number
  outstandingBalance: number
  invoices: CustomerInvoice[]
  contacts?: CustomerContact[]
  statistics?: CustomerStatisticsSummary
}

interface TopCustomer {
  id: string
  name: string
  email?: string
  totalRevenue: number
  totalInvoices: number
}

interface CustomerStats {
  totalCustomers: number
  activeCustomers: number
  newCustomersThisMonth: number
  totalRevenue: number
  averageOrderValue: number
  outstandingBalance: number
  topCustomers: TopCustomer[]
}

export default function CustomersPage() {
  const { toast } = useToast()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [stats, setStats] = useState<CustomerStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedType, setSelectedType] = useState('all')
  const [sortBy, setSortBy] = useState('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [customerDetails, setCustomerDetails] = useState<Customer | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [showCustomerDetails, setShowCustomerDetails] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)

  const handleCreateCustomer = () => { setEditingCustomer(null); setShowForm(true) }
  const handleEditCustomer = (c: Customer) => { setEditingCustomer(c); setShowForm(true) }
  const handleFormSuccess = () => { setShowForm(false); setEditingCustomer(null); fetchCustomers(); fetchStats() }

  const handleDeleteCustomer = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo cliente?')) return
    try {
      const res = await fetch(`/api/customers/${id}`, { method: 'DELETE' })
      const result = await res.json()
      if (result.success) {
        toast({ title: "Cliente eliminato", description: "Cliente rimosso con successo" })
        fetchCustomers(); fetchStats()
      } else {
        toast({ title: "Errore", description: result.error || 'Errore eliminazione', variant: "destructive" })
      }
    } catch {
      toast({ title: "Errore", description: "Errore di rete", variant: "destructive" })
    }
  }

  useEffect(() => {
    fetchCustomers()
    fetchStats()
  }, [searchQuery, selectedStatus, selectedType, sortBy, sortOrder, currentPage])

  const parseTags = (tags: unknown): string[] => {
    if (Array.isArray(tags)) {
      return tags.filter((tag): tag is string => typeof tag === 'string')
    }

    if (typeof tags === 'string' && tags.length > 0) {
      try {
        const parsed = JSON.parse(tags)
        return Array.isArray(parsed)
          ? parsed.filter((tag): tag is string => typeof tag === 'string')
          : []
      } catch {
        return []
      }
    }

    return []
  }

  const getCustomerDisplayName = (customer: {
    name?: string | null
    businessName?: string | null
    legalName?: string | null
    firstName?: string | null
    lastName?: string | null
  }) => {
    const personalName = [customer.firstName, customer.lastName].filter(Boolean).join(' ')
    return customer.businessName || customer.legalName || personalName || customer.name || 'Cliente senza nome'
  }

  const normalizeCustomer = (customer: any): Customer => {
    const invoices: CustomerInvoice[] = Array.isArray(customer.invoices)
      ? customer.invoices.map((invoice: any) => ({
          id: invoice.id,
          totalAmount: Number(invoice.totalAmount || 0),
          status: invoice.status || 'DRAFT',
          issueDate: typeof invoice.issueDate === 'string'
            ? invoice.issueDate
            : new Date(invoice.issueDate).toISOString()
        }))
      : []

    const totalRevenue = typeof customer.totalRevenue === 'number'
      ? customer.totalRevenue
      : typeof customer.statistics?.totalInvoices === 'number'
      ? customer.statistics.totalInvoices
      : invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0)

    const paidInvoicesAmount = typeof customer.statistics?.paidInvoices === 'number'
      ? customer.statistics.paidInvoices
      : invoices
          .filter((invoice) => invoice.status === 'PAID')
          .reduce((sum, invoice) => sum + invoice.totalAmount, 0)

    const outstandingBalance = typeof customer.outstandingBalance === 'number'
      ? customer.outstandingBalance
      : typeof customer.statistics?.outstandingBalance === 'number'
      ? customer.statistics.outstandingBalance
      : Math.max(totalRevenue - paidInvoicesAmount, 0)

    const contacts: CustomerContact[] | undefined = Array.isArray(customer.contacts)
      ? customer.contacts.map((contact: any) => ({
          id: contact.id,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email || undefined,
          phone: contact.phone || undefined,
          mobile: contact.mobile || undefined,
          position: contact.position || undefined,
          isPrimary: contact.isPrimary || false
        }))
      : undefined

    return {
      id: customer.id,
      code: customer.code || undefined,
      name: customer.name,
      displayName: getCustomerDisplayName(customer),
      legalName: customer.legalName || undefined,
      businessName: customer.businessName || undefined,
      firstName: customer.firstName || undefined,
      lastName: customer.lastName || undefined,
      email: customer.email || undefined,
      phone: customer.phone || undefined,
      mobile: customer.mobile || undefined,
      website: customer.website || undefined,
      vatNumber: customer.vatNumber || undefined,
      fiscalCode: customer.fiscalCode || undefined,
      taxCode: customer.taxCode || undefined,
      sdiCode: customer.sdiCode || undefined,
      pecEmail: customer.pecEmail || undefined,
      type: customer.type || 'COMPANY',
      status: customer.status || 'ACTIVE',
      paymentTerms: customer.paymentTerms || undefined,
      creditLimit: Number(customer.creditLimit || 0),
      creditUsed: Number(customer.creditUsed || 0),
      rating: customer.rating || undefined,
      tags: parseTags(customer.tags),
      createdAt: typeof customer.createdAt === 'string' ? customer.createdAt : new Date(customer.createdAt).toISOString(),
      lastContactAt: customer.lastContactAt
        ? typeof customer.lastContactAt === 'string'
          ? customer.lastContactAt
          : new Date(customer.lastContactAt).toISOString()
        : undefined,
      address: customer.address || undefined,
      city: customer.city || undefined,
      province: customer.province || undefined,
      postalCode: customer.postalCode || undefined,
      country: customer.country || undefined,
      billingAddress: customer.billingAddress || undefined,
      shippingAddress: customer.shippingAddress || undefined,
      sameAsBilling: customer.sameAsBilling ?? undefined,
      notes: customer.notes || undefined,
      totalInvoices: typeof customer.totalInvoices === 'number'
        ? customer.totalInvoices
        : typeof customer.statistics?.invoiceCount === 'number'
        ? customer.statistics.invoiceCount
        : invoices.length,
      totalRevenue,
      outstandingBalance,
      invoices,
      contacts,
      statistics: customer.statistics
        ? {
            totalInvoicesAmount: Number(customer.statistics.totalInvoices || totalRevenue),
            paidInvoicesAmount: Number(customer.statistics.paidInvoices || paidInvoicesAmount),
            outstandingBalance: Number(customer.statistics.outstandingBalance || outstandingBalance),
            invoiceCount: Number(customer.statistics.invoiceCount || invoices.length),
            averageOrderValue: Number(customer.statistics.averageOrderValue || 0),
            lastInvoiceDate: customer.statistics.lastInvoiceDate
              ? typeof customer.statistics.lastInvoiceDate === 'string'
                ? customer.statistics.lastInvoiceDate
                : new Date(customer.statistics.lastInvoiceDate).toISOString()
              : undefined,
            totalContacts: Number(customer.statistics.totalContacts || contacts?.length || 0),
            activeProjects: Number(customer.statistics.activeProjects || 0)
          }
        : undefined
    }
  }

  const normalizeStats = (data: any): CustomerStats => ({
    totalCustomers: Number(data.totalCustomers || 0),
    activeCustomers: Number(data.activeCustomers || 0),
    newCustomersThisMonth: Number(data.newCustomersThisMonth || 0),
    totalRevenue: Number(data.totalRevenue || 0),
    averageOrderValue: Number(data.averageOrderValue || 0),
    outstandingBalance: Number(data.outstandingBalance || 0),
    topCustomers: Array.isArray(data.topCustomers)
      ? data.topCustomers.map((customer: any) => ({
          id: customer.id,
          name: customer.name,
          email: customer.email || undefined,
          totalRevenue: Number(customer.totalRevenue || 0),
          totalInvoices: Number(customer.totalInvoices || 0)
        }))
      : []
  })

  const getCustomerLocation = (customer: Pick<Customer, 'address' | 'city' | 'province' | 'postalCode' | 'country'>) => {
    return [
      customer.address,
      [customer.city, customer.province].filter(Boolean).join(' '),
      customer.postalCode,
      customer.country
    ].filter(Boolean).join(', ')
  }

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        search: searchQuery,
        status: selectedStatus !== 'all' ? selectedStatus : '',
        type: selectedType !== 'all' ? selectedType : '',
        sortBy,
        sortOrder,
        page: currentPage.toString(),
        limit: '500'
      })

      const response = await fetch(`/api/customers?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setCustomers(Array.isArray(result.data.customers) ? result.data.customers.map(normalizeCustomer) : [])
      }
    } catch (error) {
      console.error('Error fetching customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/customers/stats')
      const result = await response.json()
      
      if (result.success) {
        setStats(normalizeStats(result.data))
      }
    } catch (error) {
      console.error('Error fetching customer stats:', error)
    }
  }

  const fetchCustomerDetails = async (customerId: string) => {
    try {
      setDetailsLoading(true)
      const response = await fetch(`/api/customers/${customerId}`)
      const result = await response.json()

      if (result.success) {
        setCustomerDetails(normalizeCustomer(result.data))
      }
    } catch (error) {
      console.error('Error fetching customer details:', error)
    } finally {
      setDetailsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { label: 'Attivo', tone: 'primary' as const },
      INACTIVE: { label: 'Inattivo', tone: 'neutral' as const },
      PROSPECT: { label: 'Potenziale', tone: 'warning' as const },
      BLACKLISTED: { label: 'Lista Nera', tone: 'danger' as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ACTIVE
    return <span className={getThemeTableStatusBadgeClassName('customers', config.tone)}>{config.label}</span>
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'COMPANY': return <Building className="h-4 w-4" />
      case 'INDIVIDUAL': return <Users className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const getRatingStars = (rating?: number) => {
    if (!rating) return null
    
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3 w-3 ${
              star <= rating ? 'text-yellow-400 fill-current' : 'text-slate-300'
            }`}
          />
        ))}
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT')
  }

  const escapeCsvValue = (value: string | number | undefined) => {
    const normalized = String(value ?? '')
    return `"${normalized.replace(/"/g, '""')}"`;
  }

  const handleExportCustomers = () => {
    const rows = [
      ['Cliente', 'Email', 'Telefono', 'Tipo', 'Stato', 'Citta', 'Indirizzo', 'P.IVA', 'Codice Fiscale', 'Fatturato', 'Da Incassare'],
      ...sortedCustomers.map((customer) => [
        customer.displayName,
        customer.email || '',
        customer.phone || customer.mobile || '',
        customer.type,
        customer.status,
        customer.city || '',
        customer.address || '',
        customer.vatNumber || '',
        customer.fiscalCode || '',
        customer.totalRevenue,
        customer.outstandingBalance
      ])
    ]

    const csv = rows.map((row) => row.map((value) => escapeCsvValue(value)).join(';')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'nexora-clienti.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  const handleCustomerClick = (customer: Customer) => {
    setSelectedCustomerId(customer.id)
    setSelectedCustomer(customer)
    setCustomerDetails(customer)
    setShowCustomerDetails(true)
    fetchCustomerDetails(customer.id)
  }

  const handleCustomerRowClick = (customer: Customer) => {
    if (selectedCustomerId === customer.id) {
      handleCustomerClick(customer)
      return
    }

    setSelectedCustomerId(customer.id)
    setSelectedCustomer(customer)
    setCustomerDetails(null)
  }

  const filteredCustomers = customers.filter(customer => {
    const normalizedSearch = searchQuery.trim().toLowerCase()
    const searchableValues = [
      customer.displayName,
      customer.email,
      customer.vatNumber,
      customer.fiscalCode,
      customer.pecEmail,
      customer.phone,
      customer.mobile,
      customer.city
    ].filter((value): value is string => Boolean(value))

    const matchesSearch = normalizedSearch.length === 0 || searchableValues.some((value) =>
      value.toLowerCase().includes(normalizedSearch)
    )
    
    const matchesStatus = selectedStatus === 'all' || customer.status === selectedStatus
    const matchesType = selectedType === 'all' || customer.type === selectedType
    
    return matchesSearch && matchesStatus && matchesType
  })

  const sortedCustomers = [...filteredCustomers].sort((leftCustomer, rightCustomer) => {
    const direction = sortOrder === 'asc' ? 1 : -1

    switch (sortBy) {
      case 'name':
        return leftCustomer.displayName.localeCompare(rightCustomer.displayName) * direction
      case 'totalRevenue':
        return (leftCustomer.totalRevenue - rightCustomer.totalRevenue) * direction
      case 'lastContactAt':
        return ((leftCustomer.lastContactAt ? new Date(leftCustomer.lastContactAt).getTime() : 0) - (rightCustomer.lastContactAt ? new Date(rightCustomer.lastContactAt).getTime() : 0)) * direction
      case 'createdAt':
        return (new Date(leftCustomer.createdAt).getTime() - new Date(rightCustomer.createdAt).getTime()) * direction
      default:
        return String((leftCustomer as unknown as Record<string, unknown>)[sortBy] ?? '').localeCompare(String((rightCustomer as unknown as Record<string, unknown>)[sortBy] ?? '')) * direction
    }
  })

  const activeCustomer = customerDetails || selectedCustomer
  const customerStats: CustomerStats = stats ?? {
    totalCustomers: 0,
    activeCustomers: 0,
    newCustomersThisMonth: 0,
    totalRevenue: 0,
    averageOrderValue: 0,
    outstandingBalance: 0,
    topCustomers: []
  }

  return (
    <PageShell
      title="Clienti"
      description="Gestione completa anagrafiche clienti"
      icon={Users}
      theme="customers"
      actions={
        <>
          <Button variant="outline" size="sm" onClick={fetchCustomers} className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <RefreshCw className="h-4 w-4 mr-1.5" />Aggiorna
          </Button>
          <Button variant="outline" size="sm" onClick={() => setShowImport(true)} className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <Upload className="h-4 w-4 mr-1.5" />Importa
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCustomers} className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <Download className="h-4 w-4 mr-1.5" />Esporta
          </Button>
          <Button size="sm" onClick={handleCreateCustomer} className="border border-teal-400/40 bg-teal-500 text-white hover:bg-teal-600 font-semibold shadow-[0_14px_30px_-18px_rgba(20,184,166,0.75)]">
            <Plus className="h-4 w-4 mr-1.5" />Nuovo Cliente
          </Button>
        </>
      }
    >
      <div className="space-y-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Card className="kpi-surface">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Clienti Totali</p>
                      <p className="metric-value mt-1 text-2xl font-bold text-slate-900">{customerStats.totalCustomers}</p>
                      <p className="mt-1 text-xs text-slate-500">+{customerStats.newCustomersThisMonth} questo mese</p>
                    </div>
                    <div className="p-3 rounded-xl bg-cyan-100">
                      <Users className="h-6 w-6 text-cyan-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Card className="kpi-surface">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Clienti Attivi</p>
                      <p className="metric-value mt-1 text-2xl font-bold text-slate-900">{customerStats.activeCustomers}</p>
                      <p className="mt-1 text-xs text-slate-500">{customerStats.totalCustomers > 0 ? ((customerStats.activeCustomers / customerStats.totalCustomers) * 100).toFixed(1) : '0.0'}% del totale</p>
                    </div>
                    <div className="p-3 rounded-xl bg-green-100">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="kpi-surface">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Fatturato Totale</p>
                      <p className="metric-value mt-1 text-2xl font-bold text-slate-900">{formatCurrency(customerStats.totalRevenue)}</p>
                      <p className="mt-1 text-xs text-slate-500">Media: {formatCurrency(customerStats.averageOrderValue)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-purple-100">
                      <DollarSign className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="kpi-surface">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Credito Totale</p>
                      <p className="metric-value mt-1 text-2xl font-bold text-slate-900">{formatCurrency(customerStats.outstandingBalance)}</p>
                      <p className="mt-1 text-xs text-slate-500">Da incassare</p>
                    </div>
                    <div className="p-3 rounded-xl bg-orange-100">
                      <CreditCard className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    placeholder="Cerca clienti..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Stato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti gli stati</SelectItem>
                    <SelectItem value="ACTIVE">Attivi</SelectItem>
                    <SelectItem value="INACTIVE">Inattivi</SelectItem>
                    <SelectItem value="PROSPECT">Potenziali</SelectItem>
                    <SelectItem value="BLACKLISTED">Lista Nera</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i tipi</SelectItem>
                    <SelectItem value="COMPANY">Aziende</SelectItem>
                    <SelectItem value="INDIVIDUAL">Privati</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtri
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Elenco Clienti ({filteredCustomers.length})</CardTitle>
            <CardDescription>
              Gestione completa clienti e analytics avanzate
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && customers.length === 0 ? (
              <PageShellLoading label="Caricamento clienti..." theme="customers" />
            ) : (
            <div className="overflow-x-auto">
              <ThemeTable theme="customers">
                <TableHeader className={getThemeTableHeaderClassName('customers')}>
                  <TableRow>
                    <TableHead 
                      className={getThemeTableHeadClassName('customers', 'cursor-pointer')}
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        Cliente
                        {sortBy === 'name' && (
                          <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead className={getThemeTableHeadClassName('customers')}>Contatti</TableHead>
                    <TableHead className={getThemeTableHeadClassName('customers')}>Stato</TableHead>
                    <TableHead 
                      className={getThemeTableHeadClassName('customers', 'cursor-pointer')}
                      onClick={() => handleSort('totalRevenue')}
                    >
                      <div className="flex items-center">
                        Fatturato
                        {sortBy === 'totalRevenue' && (
                          <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead className={getThemeTableHeadClassName('customers')}>Credito</TableHead>
                    <TableHead className={getThemeTableHeadClassName('customers')}>Valutazione</TableHead>
                    <TableHead className={getThemeTableHeadClassName('customers')}>Ultimo Contatto</TableHead>
                    <TableHead className={getThemeTableHeadClassName('customers', 'sticky right-0 z-10 min-w-[88px] bg-cyan-50/95 text-right')}>Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCustomers.map((customer) => (
                    <TableRow 
                      key={customer.id}
                      className={getThemeTableRowClassName('customers', { selected: selectedCustomerId === customer.id }, 'cursor-pointer')}
                      onClick={() => handleCustomerRowClick(customer)}
                    >
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {getTypeIcon(customer.type)}
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{customer.displayName}</div>
                            {([customer.code && `Cod. ${customer.code}`, customer.vatNumber && `P.IVA ${customer.vatNumber}`, customer.fiscalCode && `CF ${customer.fiscalCode}`].filter(Boolean).join(' • ')) && (
                              <div className="text-sm text-slate-500">
                                {[customer.code && `Cod. ${customer.code}`, customer.vatNumber && `P.IVA ${customer.vatNumber}`, customer.fiscalCode && `CF ${customer.fiscalCode}`].filter(Boolean).join(' • ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {customer.email && (
                            <div className="flex items-center text-sm text-slate-600">
                              <Mail className="h-3 w-3 mr-1" />
                              {customer.email}
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center text-sm text-slate-600">
                              <Phone className="h-3 w-3 mr-1" />
                              {customer.phone}
                            </div>
                          )}
                          {!customer.phone && customer.mobile && (
                            <div className="flex items-center text-sm text-slate-600">
                              <Phone className="h-3 w-3 mr-1" />
                              {customer.mobile}
                            </div>
                          )}
                          {getCustomerLocation(customer) && (
                            <div className="flex items-center text-sm text-slate-600">
                              <MapPin className="h-3 w-3 mr-1" />
                              {getCustomerLocation(customer)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(customer.status)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-semibold text-slate-900">{formatCurrency(customer.totalRevenue)}</div>
                          {customer.totalInvoices > 0 && (
                            <div className="text-slate-500">{customer.totalInvoices} fatture</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-semibold text-slate-900">
                            {formatCurrency(customer.outstandingBalance)}
                          </div>
                          <div className="text-slate-500">Limite: {formatCurrency(customer.creditLimit)}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getRatingStars(customer.rating)}</TableCell>
                      <TableCell>
                        <div className="text-sm text-slate-600">
                          {customer.lastContactAt ? formatDate(customer.lastContactAt) : 'Mai'}
                        </div>
                      </TableCell>
                      <TableCell className={getThemeTableStickyCellClassName('customers', { selected: selectedCustomerId === customer.id }, 'sticky right-0 z-10 min-w-[88px] text-right')}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className={getThemeTableActionButtonClassName('customers')} onClick={(e) => e.stopPropagation()}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleCustomerClick(customer) }}>
                              <Eye className="h-4 w-4 mr-2" />
                              Dettagli
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditCustomer(customer) }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Modifica
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={(e) => { e.stopPropagation(); handleDeleteCustomer(customer.id) }}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Elimina
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {sortedCustomers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="py-8">
                        <EmptyState
                          icon={Users}
                          title="Nessun dato trovato"
                          description="Non ci sono clienti da mostrare con i filtri correnti."
                          actionLabel="Crea il primo Cliente"
                          onAction={handleCreateCustomer}
                          className={getThemeTableEmptyStateClassName('customers')}
                          actionClassName={getThemeTableEmptyStateActionClassName('customers')}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </ThemeTable>
            </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Details Dialog */}
        <Dialog
          open={showCustomerDetails}
          onOpenChange={(open) => {
            setShowCustomerDetails(open)
            if (!open) {
              setCustomerDetails(null)
            }
          }}
        >
          <DialogContent className={getPopupDialogContentClassName("max-w-4xl max-h-[90vh] overflow-y-auto")}>
            <PopupHeader
              theme="customers"
              title="Dettagli Cliente"
              description="Informazioni complete e storico del cliente"
            />
            
            {detailsLoading && (
              <div className="flex items-center px-6 pt-6 text-sm text-slate-600">
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Caricamento dettaglio cliente...
              </div>
            )}

            {activeCustomer && (
              <div className="space-y-6 p-6 [&_label]:text-sm [&_label]:font-semibold [&_label]:text-slate-600 [&_p]:text-slate-900">
                {/* Customer Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informazioni Generali</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-slate-600">Cliente</label>
                        <p className="font-medium">{activeCustomer.displayName}</p>
                      </div>

                      {activeCustomer.code && (
                        <div>
                          <label className="text-sm font-medium text-slate-600">Codice</label>
                          <p>{activeCustomer.code}</p>
                        </div>
                      )}

                      {activeCustomer.businessName && activeCustomer.businessName !== activeCustomer.displayName && (
                        <div>
                          <label className="text-sm font-medium text-slate-600">Ragione Sociale</label>
                          <p>{activeCustomer.businessName}</p>
                        </div>
                      )}

                      {activeCustomer.legalName && activeCustomer.legalName !== activeCustomer.displayName && (
                        <div>
                          <label className="text-sm font-medium text-slate-600">Denominazione Legale</label>
                          <p>{activeCustomer.legalName}</p>
                        </div>
                      )}
                      
                      {activeCustomer.email && (
                        <div>
                          <label className="text-sm font-medium text-slate-600">Email</label>
                          <p className="flex items-center">
                            <Mail className="h-4 w-4 mr-2" />
                            {activeCustomer.email}
                          </p>
                        </div>
                      )}

                      {activeCustomer.pecEmail && (
                        <div>
                          <label className="text-sm font-medium text-slate-600">PEC</label>
                          <p className="flex items-center">
                            <Mail className="h-4 w-4 mr-2" />
                            {activeCustomer.pecEmail}
                          </p>
                        </div>
                      )}
                      
                      {activeCustomer.phone && (
                        <div>
                          <label className="text-sm font-medium text-slate-600">Telefono</label>
                          <p className="flex items-center">
                            <Phone className="h-4 w-4 mr-2" />
                            {activeCustomer.phone}
                          </p>
                        </div>
                      )}

                      {activeCustomer.mobile && (
                        <div>
                          <label className="text-sm font-medium text-slate-600">Cellulare</label>
                          <p className="flex items-center">
                            <Phone className="h-4 w-4 mr-2" />
                            {activeCustomer.mobile}
                          </p>
                        </div>
                      )}
                      
                      {activeCustomer.vatNumber && (
                        <div>
                          <label className="text-sm font-medium text-slate-600">Partita IVA</label>
                          <p>{activeCustomer.vatNumber}</p>
                        </div>
                      )}

                      {activeCustomer.fiscalCode && (
                        <div>
                          <label className="text-sm font-medium text-slate-600">Codice Fiscale</label>
                          <p>{activeCustomer.fiscalCode}</p>
                        </div>
                      )}

                      {activeCustomer.sdiCode && (
                        <div>
                          <label className="text-sm font-medium text-slate-600">Codice SDI</label>
                          <p>{activeCustomer.sdiCode}</p>
                        </div>
                      )}

                      {getCustomerLocation(activeCustomer) && (
                        <div>
                          <label className="text-sm font-medium text-slate-600">Indirizzo</label>
                          <p className="flex items-start">
                            <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                            {getCustomerLocation(activeCustomer)}
                          </p>
                        </div>
                      )}

                      {activeCustomer.paymentTerms && (
                        <div>
                          <label className="text-sm font-medium text-slate-600">Condizioni di pagamento</label>
                          <p>{activeCustomer.paymentTerms}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-4">
                        <div>
                          <label className="text-sm font-medium text-slate-600">Stato</label>
                          <div>{getStatusBadge(activeCustomer.status)}</div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">Tipo</label>
                          <div className="flex items-center">
                            {getTypeIcon(activeCustomer.type)}
                            <span className="ml-2">{activeCustomer.type}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Statistiche</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-slate-600">Fatturato Totale</label>
                          <p className="text-lg font-bold text-blue-600">
                            {formatCurrency(activeCustomer.totalRevenue)}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">Numero Fatture</label>
                          <p className="text-lg font-bold">{activeCustomer.statistics?.invoiceCount || activeCustomer.totalInvoices}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">Da Incassare</label>
                          <p className="text-lg font-bold text-orange-600">
                            {formatCurrency(activeCustomer.outstandingBalance)}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">Limite di Credito</label>
                          <p className="text-lg font-bold">{formatCurrency(activeCustomer.creditLimit)}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-slate-600">Credito Utilizzato</label>
                          <p className="text-lg font-bold">{formatCurrency(activeCustomer.creditUsed)}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-slate-600">Ultima Fattura</label>
                          <p className="text-lg font-bold">
                            {activeCustomer.statistics?.lastInvoiceDate ? formatDate(activeCustomer.statistics.lastInvoiceDate) : 'N/D'}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-slate-600">Rating</label>
                        <div>{getRatingStars(activeCustomer.rating)}</div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-slate-600">Tags</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {activeCustomer.tags.map((tag, index) => (
                            <Badge key={index} variant="outline">{tag}</Badge>
                          ))}
                          {activeCustomer.tags.length === 0 && (
                            <span className="text-sm text-slate-500">Nessun tag</span>
                          )}
                        </div>
                      </div>

                      {activeCustomer.notes && (
                        <div>
                          <label className="text-sm font-medium text-slate-600">Note</label>
                          <p className="text-sm text-slate-700">{activeCustomer.notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4">
                  <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => activeCustomer && handleDeleteCustomer(activeCustomer.id)}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Elimina
                  </Button>
                  <Button variant="outline" onClick={() => { setShowCustomerDetails(false); activeCustomer && handleEditCustomer(activeCustomer) }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifica
                  </Button>
                  <Button className={getPopupPrimaryButtonClassName('customers')} onClick={() => { setShowCustomerDetails(false); setEditingCustomer(null); setShowForm(true) }}>
                    <FileText className="h-4 w-4 mr-2" />
                    Nuova Fattura
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        <CsvImportDialog
          open={showImport}
          onClose={() => setShowImport(false)}
          onSuccess={fetchCustomers}
          apiUrl="/api/customers"
          entityName="Clienti"
          theme="customers"
          columns={[
            { key: 'name', label: 'Nome', required: true },
            { key: 'email', label: 'Email' },
            { key: 'phone', label: 'Telefono' },
            { key: 'vatNumber', label: 'P.IVA' },
            { key: 'city', label: 'Città' },
            { key: 'address', label: 'Indirizzo' },
            { key: 'type', label: 'Tipo (COMPANY/INDIVIDUAL)' },
          ]}
          sampleRows={[{ name: 'Mario Rossi Srl', email: 'info@mario.it', phone: '+39 02 1234567', vatNumber: 'IT01234567890', city: 'Milano', address: 'Via Roma 1', type: 'COMPANY' }]}
        />
        <CustomerForm
          open={showForm}
          onClose={() => {
            setShowForm(false)
            setEditingCustomer(null)
          }}
          onSuccess={handleFormSuccess}
          customer={editingCustomer}
        />
      </div>
    </PageShell>
  )
}

