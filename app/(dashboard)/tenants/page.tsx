"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Building, 
  Users, 
  Settings, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Crown,
  Zap,
  BarChart3,
  CreditCard,
  Globe,
  Palette,
  Shield,
  Database,
  Activity,
  TrendingUp,
  MoreHorizontal,
  RefreshCw,
  Download,
  Upload
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'

interface Tenant {
  id: string
  name: string
  domain?: string
  logo?: string
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL' | 'EXPIRED'
  subscription: {
    plan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE' | 'CUSTOM'
    status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED'
    startDate: string
    endDate?: string
    features: string[]
    limits: {
      users: number
      customers: number
      products: number
      orders: number
      storage: number
      apiCalls: number
    }
  }
  settings: {
    timezone: string
    currency: string
    language: string
    dateFormat: string
    numberFormat: string
    theme: 'light' | 'dark' | 'auto'
    customBranding: {
      primaryColor: string
      secondaryColor: string
      logo?: string
      favicon?: string
    }
  }
  billing: {
    address: string
    city: string
    postalCode: string
    country: string
    vatNumber?: string
    paymentMethod: string
  }
  createdAt: string
  updatedAt: string
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedPlan, setSelectedPlan] = useState('all')
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  const [showTenantDetails, setShowTenantDetails] = useState(false)
  const [showCreateTenant, setShowCreateTenant] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchTenants()
  }, [searchQuery, selectedStatus, selectedPlan])

  const fetchTenants = async () => {
    try {
      setLoading(true)
      
      // Mock tenants data
      const mockTenants: Tenant[] = [
        {
          id: '1',
          name: 'Azienda Alpha Srl',
          domain: 'alpha.nexora.com',
          logo: '/logos/alpha.png',
          status: 'ACTIVE',
          subscription: {
            plan: 'ENTERPRISE',
            status: 'ACTIVE',
            startDate: '2024-01-15',
            endDate: '2025-01-15',
            features: [
              'basic_crud',
              'dashboard',
              'reports_advanced',
              'ai_insights',
              'workflows',
              'integrations_full',
              'api_access',
              'white_label',
              'priority_support',
              'unlimited_users',
              'custom_domain'
            ],
            limits: {
              users: 100,
              customers: 10000,
              products: 5000,
              orders: 20000,
              storage: 100,
              apiCalls: 100000
            }
          },
          settings: {
            timezone: 'Europe/Rome',
            currency: 'EUR',
            language: 'it',
            dateFormat: 'DD/MM/YYYY',
            numberFormat: 'it-IT',
            theme: 'light',
            customBranding: {
              primaryColor: '#2563eb',
              secondaryColor: '#64748b',
              logo: '/logos/alpha.png'
            }
          },
          billing: {
            address: 'Via Roma 123',
            city: 'Roma',
            postalCode: '00100',
            country: 'IT',
            vatNumber: 'IT01234567890',
            paymentMethod: 'CREDIT_CARD'
          },
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-03-20T14:30:00Z'
        },
        {
          id: '2',
          name: 'Beta Consulting',
          domain: 'beta.nexora.com',
          logo: '/logos/beta.png',
          status: 'ACTIVE',
          subscription: {
            plan: 'PROFESSIONAL',
            status: 'ACTIVE',
            startDate: '2024-02-01',
            endDate: '2025-02-01',
            features: [
              'basic_crud',
              'dashboard',
              'reports_advanced',
              'ai_insights',
              'workflows',
              'integrations_basic',
              'email_support',
              '10_users'
            ],
            limits: {
              users: 10,
              customers: 1000,
              products: 500,
              orders: 2000,
              storage: 10,
              apiCalls: 10000
            }
          },
          settings: {
            timezone: 'Europe/Milan',
            currency: 'EUR',
            language: 'it',
            dateFormat: 'DD/MM/YYYY',
            numberFormat: 'it-IT',
            theme: 'dark',
            customBranding: {
              primaryColor: '#7c3aed',
              secondaryColor: '#a78bfa',
              logo: '/logos/beta.png'
            }
          },
          billing: {
            address: 'Corso Buenos Aires 45',
            city: 'Milano',
            postalCode: '20100',
            country: 'IT',
            vatNumber: 'IT09876543210',
            paymentMethod: 'BANK_TRANSFER'
          },
          createdAt: '2024-02-01T09:00:00Z',
          updatedAt: '2024-03-18T16:45:00Z'
        },
        {
          id: '3',
          name: 'Gamma Store',
          domain: 'gamma.nexora.com',
          logo: '/logos/gamma.png',
          status: 'TRIAL',
          subscription: {
            plan: 'STARTER',
            status: 'ACTIVE',
            startDate: '2024-03-10',
            endDate: '2024-04-10',
            features: [
              'basic_crud',
              'dashboard',
              'reports_basic',
              'email_support',
              '1_user'
            ],
            limits: {
              users: 1,
              customers: 100,
              products: 50,
              orders: 200,
              storage: 1,
              apiCalls: 1000
            }
          },
          settings: {
            timezone: 'Europe/Rome',
            currency: 'EUR',
            language: 'it',
            dateFormat: 'DD/MM/YYYY',
            numberFormat: 'it-IT',
            theme: 'light',
            customBranding: {
              primaryColor: '#059669',
              secondaryColor: '#047857',
              logo: '/logos/gamma.png'
            }
          },
          billing: {
            address: 'Piazza Venezia 12',
            city: 'Venezia',
            postalCode: '30100',
            country: 'IT',
            paymentMethod: 'PAYPAL'
          },
          createdAt: '2024-03-10T11:00:00Z',
          updatedAt: '2024-03-22T10:15:00Z'
        }
      ]

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setTenants(mockTenants)
    } catch (error) {
      console.error('Error fetching tenants:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { label: 'Attivo', variant: 'default' as const },
      SUSPENDED: { label: 'Sospeso', variant: 'destructive' as const },
      TRIAL: { label: 'Trial', variant: 'secondary' as const },
      EXPIRED: { label: 'Scaduto', variant: 'outline' as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.ACTIVE
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getPlanBadge = (plan: string) => {
    const planConfig = {
      STARTER: { label: 'Starter', icon: <Crown className="h-3 w-3" />, color: 'text-gray-600' },
      PROFESSIONAL: { label: 'Professionale', icon: <Zap className="h-3 w-3" />, color: 'text-blue-600' },
      ENTERPRISE: { label: 'Enterprise', icon: <Building className="h-3 w-3" />, color: 'text-purple-600' },
      CUSTOM: { label: 'Custom', icon: <Settings className="h-3 w-3" />, color: 'text-orange-600' }
    }
    
    const config = planConfig[plan as keyof typeof planConfig] || planConfig.STARTER
    return (
      <Badge variant="outline" className="flex items-center">
        <span className={config.color}>{config.icon}</span>
        <span className="ml-1">{config.label}</span>
      </Badge>
    )
  }

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (tenant.domain && tenant.domain.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesStatus = selectedStatus === 'all' || tenant.status === selectedStatus
    const matchesPlan = selectedPlan === 'all' || tenant.subscription.plan === selectedPlan
    
    return matchesSearch && matchesStatus && matchesPlan
  })

  const activeTenants = tenants.filter(t => t.status === 'ACTIVE').length
  const trialTenants = tenants.filter(t => t.status === 'TRIAL').length
  const suspendedTenants = tenants.filter(t => t.status === 'SUSPENDED').length

  return (
    <div className="bg-slate-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Multi-Tenant Management</h1>
            <p className="text-gray-600">Gestione completa tenant e sottoscrizioni</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Aggiorna
            </Button>
            <Button onClick={() => setShowCreateTenant(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nuovo Tenant
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tenant Attivi</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{activeTenants}</p>
                    <p className="text-xs text-green-600 mt-1">
                      di {tenants.length} totali
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50">
                    <CheckCircle className="h-6 w-6 text-green-600" />
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
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Trial Attivi</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{trialTenants}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Periodo prova
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
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
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tenant Sospesi</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{suspendedTenants}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Da verificare
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-red-50">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
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
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Riccorrenza Mensile</p>
                    <p className="text-2xl font-bold text-purple-600 mt-1">€12,450</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Tutti i tenant
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-50">
                    <CreditCard className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Panoramica</TabsTrigger>
            <TabsTrigger value="tenants">Tenant</TabsTrigger>
            <TabsTrigger value="subscriptions">Sottoscrizioni</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {filteredTenants.map((tenant) => (
                <motion.div
                  key={tenant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: Math.random() * 0.2 }}
                >
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => {
                          setSelectedTenant(tenant)
                          setShowTenantDetails(true)
                        }}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            {tenant.logo ? (
                              <img src={tenant.logo} alt={tenant.name} className="w-8 h-8" />
                            ) : (
                              <Building className="h-6 w-6 text-gray-600" />
                            )}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{tenant.name}</CardTitle>
                            <CardDescription className="text-sm">
                              {tenant.domain || 'Nessun dominio personalizzato'}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          {getStatusBadge(tenant.status)}
                          {getPlanBadge(tenant.subscription.plan)}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-gray-600">Utenti</p>
                            <p className="text-lg font-bold">{tenant.subscription.limits.users}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-600">Clienti</p>
                            <p className="text-lg font-bold">{tenant.subscription.limits.customers}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-600">Prodotti</p>
                            <p className="text-lg font-bold">{tenant.subscription.limits.products}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-600">Storage</p>
                            <p className="text-lg font-bold">{tenant.subscription.limits.storage}GB</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Creato: {new Date(tenant.createdAt).toLocaleDateString('it-IT')}</span>
                          <span>Aggiornato: {new Date(tenant.updatedAt).toLocaleDateString('it-IT')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Tenants Tab */}
          <TabsContent value="tenants">
            <Card>
              <CardHeader>
                <CardTitle>Gestione Tenant</CardTitle>
                <CardDescription>
                  Gestisci tutti i tenant del sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col lg:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Cerca tenant..."
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
                        <SelectItem value="SUSPENDED">Sospesi</SelectItem>
                        <SelectItem value="TRIAL">Trial</SelectItem>
                        <SelectItem value="EXPIRED">Scaduti</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={selectedPlan} onValueChange={setSelectedPlan}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Piano" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutti i piani</SelectItem>
                        <SelectItem value="STARTER">Starter</SelectItem>
                        <SelectItem value="PROFESSIONAL">Professionale</SelectItem>
                        <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                        <SelectItem value="CUSTOM">Custom</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button variant="outline">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtri
                    </Button>
                  </div>
                </div>

                {/* Tenants Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Piano</TableHead>
                      <TableHead>Utenti</TableHead>
                      <TableHead>Clienti</TableHead>
                      <TableHead>Riccorrenza</TableHead>
                      <TableHead>Scadenza</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTenants.map((tenant) => (
                      <TableRow 
                        key={tenant.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          setSelectedTenant(tenant)
                          setShowTenantDetails(true)
                        }}
                      >
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                              {tenant.logo ? (
                                <img src={tenant.logo} alt={tenant.name} className="w-6 h-6" />
                              ) : (
                                <Building className="h-4 w-4 text-gray-600" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{tenant.name}</div>
                              <div className="text-sm text-gray-500">{tenant.domain}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                        <TableCell>{getPlanBadge(tenant.subscription.plan)}</TableCell>
                        <TableCell>{tenant.subscription.limits.users}</TableCell>
                        <TableCell>{tenant.subscription.limits.customers}</TableCell>
                        <TableCell>€{(tenant.subscription.limits.users * 29.90).toFixed(2)}/mese</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {tenant.subscription.endDate 
                              ? new Date(tenant.subscription.endDate).toLocaleDateString('it-IT')
                              : 'N/A'
                            }
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="h-4 w-4 mr-2" />
                                Dettagli
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Modifica
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Settings className="h-4 w-4 mr-2" />
                                Impostazioni
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Elimina
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscriptions Tab */}
          <TabsContent value="subscriptions">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Crown className="h-5 w-5 mr-2 text-gray-600" />
                    Starter
                  </CardTitle>
                  <CardDescription>
                    Perfetto per piccole imprese
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-3xl font-bold text-center">€29.90<span className="text-lg font-normal">/mese</span></div>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />1 utente</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />100 clienti</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />50 prodotti</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />200 ordini/mese</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />1GB storage</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Supporto email</li>
                    </ul>
                    <Button className="w-full">Seleziona Starter</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-blue-600" />
                    Professionale
                  </CardTitle>
                  <CardDescription>
                    Per aziende in crescita
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-3xl font-bold text-center">€99.90<span className="text-lg font-normal">/mese</span></div>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />10 utenti</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />1,000 clienti</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />500 prodotti</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />2,000 ordini/mese</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />10GB storage</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />AI Insights</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Workflows</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Integrazioni base</li>
                    </ul>
                    <Button className="w-full">Seleziona Professionale</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Building className="h-5 w-5 mr-2 text-purple-600" />
                    Enterprise
                  </CardTitle>
                  <CardDescription>
                    Soluzione completa per grandi aziende
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-3xl font-bold text-center">€299.90<span className="text-lg font-normal">/mese</span></div>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Utenti illimitati</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />10,000 clienti</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />5,000 prodotti</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />20,000 ordini/mese</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />100GB storage</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />AI Insights avanzato</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Workflows completi</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Integrazioni full</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />API Access</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />White label</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Supporto prioritario</li>
                    </ul>
                    <Button className="w-full">Seleziona Enterprise</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2 text-orange-600" />
                    Custom
                  </CardTitle>
                  <CardDescription>
                    Soluzione su misura
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-3xl font-bold text-center">Contattaci</div>
                    <p className="text-sm text-gray-600 text-center">
                      Soluzioni personalizzate per esigenze specifiche
                    </p>
                    <div className="space-y-2 text-sm">
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Tutto incluso in Enterprise</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Features personalizzate</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />SLA personalizzati</li>
                      <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Dedicated team</li>
                    </div>
                    <Button className="w-full" variant="outline">
                      <Settings className="h-4 w-4 mr-2" />
                      Richiedi Preventivo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Utilizzo Risorse</CardTitle>
                  <CardDescription>
                    Monitoraggio utilizzo risorse per tenant
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {tenants.map((tenant) => (
                      <div key={tenant.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{tenant.name}</span>
                          <span className="text-sm text-gray-500">{tenant.subscription.plan}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Utenti</span>
                            <span>8/10</span>
                          </div>
                          <Progress value={80} className="h-2" />
                          <div className="flex justify-between text-sm">
                            <span>Storage</span>
                            <span>7.2GB/10GB</span>
                          </div>
                          <Progress value={72} className="h-2" />
                          <div className="flex justify-between text-sm">
                            <span>API Calls</span>
                            <span>7,500/10,000</span>
                          </div>
                          <Progress value={75} className="h-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Performance System</CardTitle>
                  <CardDescription>
                    Metriche performance del sistema multi-tenant
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Response Time</p>
                        <p className="text-2xl font-bold text-green-600">245ms</p>
                        <p className="text-xs text-gray-500">Media ultimi 7 giorni</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Uptime</p>
                        <p className="text-2xl font-bold text-green-600">99.9%</p>
                        <p className="text-xs text-gray-500">Ultimo mese</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Active Users</p>
                        <p className="text-2xl font-bold text-blue-600">127</p>
                        <p className="text-xs text-gray-500">Connessi ora</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">API Requests</p>
                        <p className="text-2xl font-bold text-purple-600">45.2K</p>
                        <p className="text-xs text-gray-500">Oggi</p>
                      </div>
                    </div>

                    <div className="mt-6">
                      <h4 className="font-medium mb-3">Resource Distribution</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Database Load</span>
                          <span>45%</span>
                        </div>
                        <Progress value={45} className="h-2" />
                        <div className="flex justify-between text-sm">
                          <span>Memory Usage</span>
                          <span>67%</span>
                        </div>
                        <Progress value={67} className="h-2" />
                        <div className="flex justify-between text-sm">
                          <span>CPU Usage</span>
                          <span>32%</span>
                        </div>
                        <Progress value={32} className="h-2" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Tenant Details Dialog */}
        <Dialog open={showTenantDetails} onOpenChange={setShowTenantDetails}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Dettagli Tenant</DialogTitle>
              <DialogDescription>
                Configurazione completa e gestione tenant
              </DialogDescription>
            </DialogHeader>
            
            {selectedTenant && (
              <div className="space-y-6">
                {/* Tenant Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informazioni Generali</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                          {selectedTenant.logo ? (
                            <img src={selectedTenant.logo} alt={selectedTenant.name} className="w-12 h-12" />
                          ) : (
                            <Building className="h-8 w-8 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium">{selectedTenant.name}</h3>
                          <p className="text-sm text-gray-500">{selectedTenant.domain || 'Nessun dominio'}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">Stato</span>
                          {getStatusBadge(selectedTenant.status)}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">Piano</span>
                          {getPlanBadge(selectedTenant.subscription.plan)}
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">Creato</span>
                          <span className="text-sm">{new Date(selectedTenant.createdAt).toLocaleDateString('it-IT')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium text-gray-600">Aggiornato</span>
                          <span className="text-sm">{new Date(selectedTenant.updatedAt).toLocaleDateString('it-IT')}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Limiti Sottoscrizione</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-medium text-gray-600">Utenti</p>
                          <p className="text-lg font-bold">{selectedTenant.subscription.limits.users}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Clienti</p>
                          <p className="text-lg font-bold">{selectedTenant.subscription.limits.customers}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Prodotti</p>
                          <p className="text-lg font-bold">{selectedTenant.subscription.limits.products}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Ordini/mese</p>
                          <p className="text-lg font-bold">{selectedTenant.subscription.limits.orders}</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">Storage</p>
                          <p className="text-lg font-bold">{selectedTenant.subscription.limits.storage}GB</p>
                        </div>
                        <div>
                          <p className="font-medium text-gray-600">API Calls/mese</p>
                          <p className="text-lg font-bold">{selectedTenant.subscription.limits.apiCalls.toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-600 mb-2">Features Incluse</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedTenant.subscription.features.map((feature, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {feature.replace(/_/g, ' ').toUpperCase()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Impostazioni</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Fuso Orario</p>
                        <p className="text-sm">{selectedTenant.settings.timezone}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Valuta</p>
                        <p className="text-sm">{selectedTenant.settings.currency}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Lingua</p>
                        <p className="text-sm">{selectedTenant.settings.language}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-600">Tema</p>
                        <p className="text-sm">{selectedTenant.settings.theme}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-600 mb-2">Branding Personalizzato</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Colore Primario</p>
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-6 h-6 rounded border border-gray-300" 
                              style={{ backgroundColor: selectedTenant.settings.customBranding.primaryColor }}
                            />
                            <span className="text-sm">{selectedTenant.settings.customBranding.primaryColor}</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Colore Secondario</p>
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-6 h-6 rounded border border-gray-300" 
                              style={{ backgroundColor: selectedTenant.settings.customBranding.secondaryColor }}
                            />
                            <span className="text-sm">{selectedTenant.settings.customBranding.secondaryColor}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Billing */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informazioni Fatturazione</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="font-medium text-gray-600">Indirizzo</p>
                        <p>{selectedTenant.billing.address}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-600">Città</p>
                        <p>{selectedTenant.billing.city}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-600">CAP</p>
                        <p>{selectedTenant.billing.postalCode}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-600">Paese</p>
                        <p>{selectedTenant.billing.country}</p>
                      </div>
                      {selectedTenant.billing.vatNumber && (
                        <div>
                          <p className="font-medium text-gray-600">P.IVA</p>
                          <p>{selectedTenant.billing.vatNumber}</p>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-600">Metodo Pagamento</p>
                        <p>{selectedTenant.billing.paymentMethod.replace(/_/g, ' ').toUpperCase()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end space-x-4">
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Esporta Dati
                  </Button>
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Modifica Impostazioni
                  </Button>
                  <Button>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Aggiorna Sottoscrizione
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

