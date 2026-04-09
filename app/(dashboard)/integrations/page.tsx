"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  Plus, 
  Filter, 
  RefreshCw, 
  Edit, 
  Trash2, 
  Eye,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Settings,
  MoreHorizontal,
  ArrowRight,
  Zap,
  CreditCard,
  Building,
  Mail,
  FileText,
  BarChart3,
  ExternalLink,
  Unlink,
  TestTube,
  Download,
  Upload,
  Activity
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
import { Switch } from '@/components/ui/switch'
import { useToast } from "@/hooks/use-toast"

interface Integration {
  id: string
  name: string
  type: 'ACCOUNTING' | 'PAYMENT' | 'EMAIL' | 'SMS' | 'CRM' | 'ECOMMERCE'
  description: string
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR' | 'PENDING'
  icon: React.ReactNode
  features: string[]
  lastSync?: string
  error?: string
  config?: Record<string, any>
}

export default function IntegrationsPage() {
  const { toast } = useToast()
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: 'quickbooks',
      name: 'QuickBooks',
      type: 'ACCOUNTING',
      description: 'Integrazione completa con QuickBooks per contabilità',
      status: 'DISCONNECTED',
      icon: <Building className="h-5 w-5" />,
      features: ['Sync clienti', 'Sync fatture', 'Reports', 'Contabilità'],
      config: { realmId: '', accessToken: '' }
    },
    {
      id: 'stripe',
      name: 'Stripe',
      type: 'PAYMENT',
      description: 'Gateway di pagamento Stripe per carte di credito',
      status: 'DISCONNECTED',
      icon: <CreditCard className="h-5 w-5" />,
      features: ['Pagamenti online', 'Subscription', 'Invoicing', 'Webhooks'],
      config: { apiKey: '', webhookSecret: '' }
    },
    {
      id: 'sendgrid',
      name: 'SendGrid',
      type: 'EMAIL',
      description: 'Email marketing e transazionali',
      status: 'DISCONNECTED',
      icon: <Mail className="h-5 w-5" />,
      features: ['Email templates', 'Campaigns', 'Analytics', 'Automation'],
      config: { apiKey: '' }
    },
    {
      id: 'twilio',
      name: 'Twilio',
      type: 'SMS',
      description: 'SMS e notifiche push',
      status: 'DISCONNECTED',
      icon: <Zap className="h-5 w-5" />,
      features: ['SMS notifications', 'WhatsApp', 'Voice calls', 'MMS'],
      config: { accountSid: '', authToken: '' }
    },
    {
      id: 'hubspot',
      name: 'HubSpot',
      type: 'CRM',
      description: 'CRM e marketing automation',
      status: 'DISCONNECTED',
      icon: <BarChart3 className="h-5 w-5" />,
      features: ['Contact sync', 'Deal tracking', 'Marketing', 'Analytics'],
      config: { apiKey: '', portalId: '' }
    },
    {
      id: 'shopify',
      name: 'Shopify',
      type: 'ECOMMERCE',
      description: 'Piattaforma e-commerce',
      status: 'DISCONNECTED',
      icon: <FileText className="h-5 w-5" />,
      features: ['Product sync', 'Order sync', 'Inventory', 'Customers'],
      config: { shopDomain: '', accessToken: '' }
    }
  ])

  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null)
  const [showIntegrationDetails, setShowIntegrationDetails] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    fetchIntegrations()
  }, [])

  const fetchIntegrations = async () => {
    try {
      setLoading(true)
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error('Error fetching integrations:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      CONNECTED: { label: 'Connesso', variant: 'default' as const },
      DISCONNECTED: { label: 'Disconnesso', variant: 'outline' as const },
      ERROR: { label: 'Errore', variant: 'destructive' as const },
      PENDING: { label: 'In attesa', variant: 'secondary' as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DISCONNECTED
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ACCOUNTING': return <Building className="h-4 w-4" />
      case 'PAYMENT': return <CreditCard className="h-4 w-4" />
      case 'EMAIL': return <Mail className="h-4 w-4" />
      case 'SMS': return <Zap className="h-4 w-4" />
      case 'CRM': return <BarChart3 className="h-4 w-4" />
      case 'ECOMMERCE': return <FileText className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  const getTypeLabel = (type: string) => {
    const typeConfig = {
      ACCOUNTING: 'Contabilità',
      PAYMENT: 'Pagamenti',
      EMAIL: 'Email',
      SMS: 'SMS',
      CRM: 'CRM',
      ECOMMERCE: 'E-commerce'
    }
    
    return typeConfig[type as keyof typeof typeConfig] || type
  }

  const connectIntegration = async (integrationId: string) => {
    try {
      setLoading(true)
      
      // Simulate connection process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { ...integration, status: 'CONNECTED', lastSync: new Date().toISOString() }
          : integration
      ))
      
      toast({ title: "Integrazione connessa", description: "Integrazione connessa con successo!" })
    } catch (error) {
      console.error('Error connecting integration:', error)
      toast({ title: "Errore", description: "Errore durante la connessione", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const disconnectIntegration = async (integrationId: string) => {
    try {
      setLoading(true)
      
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { ...integration, status: 'DISCONNECTED', lastSync: undefined }
          : integration
      ))
      
      toast({ title: "Disconnessa", description: "Integrazione disconnessa" })
    } catch (error) {
      console.error('Error disconnecting integration:', error)
      toast({ title: "Errore", description: "Errore durante la disconnessione", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const testIntegration = async (integrationId: string) => {
    try {
      setLoading(true)
      
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({ title: "Test completato", description: "Test integrazione completato con successo!" })
    } catch (error) {
      console.error('Error testing integration:', error)
      toast({ title: "Errore", description: "Errore durante il test", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const syncIntegration = async (integrationId: string) => {
    try {
      setLoading(true)
      
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { ...integration, lastSync: new Date().toISOString() }
          : integration
      ))
      
      toast({ title: "Sincronizzazione completata", description: "Dati sincronizzati con successo!" })
    } catch (error) {
      console.error('Error syncing integration:', error)
      toast({ title: "Errore", description: "Errore durante la sincronizzazione", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const filteredIntegrations = integrations.filter(integration => {
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = selectedType === 'all' || integration.type === selectedType
    
    return matchesSearch && matchesType
  })

  const connectedCount = integrations.filter(i => i.status === 'CONNECTED').length
  const errorCount = integrations.filter(i => i.status === 'ERROR').length

  return (
    <div className="bg-slate-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Integrazioni</h1>
            <p className="text-gray-600">Connetti NEXORA v4 con i tuoi servizi preferiti</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={fetchIntegrations}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Aggiorna
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuova Integrazione
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
                    <p className="text-sm font-medium text-gray-600">Integrazioni Attive</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{connectedCount}</p>
                    <p className="text-xs text-green-600 mt-1">
                      di {integrations.length} totali
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
                    <p className="text-sm font-medium text-gray-600">Errori</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{errorCount}</p>
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
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tipi Supportati</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">6</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Categorie
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50">
                    <Settings className="h-6 w-6 text-blue-600" />
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
                    <p className="text-sm font-medium text-gray-600">Ultima Sync</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      {integrations.filter(i => i.lastSync).length > 0 
                        ? new Date(Math.max(...integrations.filter(i => i.lastSync).map(i => new Date(i.lastSync!).getTime()))).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
                        : 'N/A'
                      }
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Ultima sincronizzazione
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-50">
                    <RefreshCw className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="overview">Panoramica</TabsTrigger>
            <TabsTrigger value="integrations">Integrazioni</TabsTrigger>
            <TabsTrigger value="logs">Log Attività</TabsTrigger>
            <TabsTrigger value="settings">Configurazioni</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {integrations.map((integration) => (
                <motion.div
                  key={integration.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: Math.random() * 0.2 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            {integration.icon}
                          </div>
                          <div>
                            <CardTitle className="text-lg">{integration.name}</CardTitle>
                            <CardDescription className="text-sm">
                              {getTypeLabel(integration.type)}
                            </CardDescription>
                          </div>
                        </div>
                        {getStatusBadge(integration.status)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">{integration.description}</p>
                      
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-1">
                          {integration.features.slice(0, 3).map((feature, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {feature}
                            </Badge>
                          ))}
                          {integration.features.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{integration.features.length - 3}
                            </Badge>
                          )}
                        </div>

                        {integration.lastSync && (
                          <div className="text-xs text-gray-500">
                            Ultima sync: {new Date(integration.lastSync).toLocaleString('it-IT')}
                          </div>
                        )}

                        <div className="flex space-x-2">
                          {integration.status === 'DISCONNECTED' ? (
                            <Button 
                              size="sm" 
                              onClick={() => connectIntegration(integration.id)}
                              disabled={loading}
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Connetti
                            </Button>
                          ) : (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => testIntegration(integration.id)}
                                disabled={loading}
                              >
                                <TestTube className="h-4 w-4 mr-2" />
                                Test
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => syncIntegration(integration.id)}
                                disabled={loading}
                              >
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Sync
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => disconnectIntegration(integration.id)}
                                disabled={loading}
                              >
                                <Unlink className="h-4 w-4 mr-2" />
                                Disconnetti
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations">
            <Card>
              <CardHeader>
                <CardTitle>Tutte le Integrazioni</CardTitle>
                <CardDescription>
                  Gestisci tutte le integrazioni disponibili
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col lg:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Cerca integrazioni..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutti i tipi</SelectItem>
                        <SelectItem value="ACCOUNTING">Contabilità</SelectItem>
                        <SelectItem value="PAYMENT">Pagamenti</SelectItem>
                        <SelectItem value="EMAIL">Email</SelectItem>
                        <SelectItem value="SMS">SMS</SelectItem>
                        <SelectItem value="CRM">CRM</SelectItem>
                        <SelectItem value="ECOMMERCE">E-commerce</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button variant="outline">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtri
                    </Button>
                  </div>
                </div>

                {/* Integrations Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Integrazione</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Funzionalità</TableHead>
                      <TableHead>Ultima Sync</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIntegrations.map((integration) => (
                      <TableRow 
                        key={integration.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          setSelectedIntegration(integration)
                          setShowIntegrationDetails(true)
                        }}
                      >
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                              {integration.icon}
                            </div>
                            <div>
                              <div className="font-medium">{integration.name}</div>
                              <div className="text-sm text-gray-500">{integration.description}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {getTypeIcon(integration.type)}
                            <span className="ml-2 text-sm">{getTypeLabel(integration.type)}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(integration.status)}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {integration.features.slice(0, 2).map((feature, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                            {integration.features.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{integration.features.length - 2}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {integration.lastSync 
                              ? new Date(integration.lastSync).toLocaleDateString('it-IT')
                              : 'Mai'
                            }
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
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
                                Configura
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <TestTube className="h-4 w-4 mr-2" />
                                Test
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Sincronizza
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600">
                                <Unlink className="h-4 w-4 mr-2" />
                                Disconnetti
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

          {/* Logs Tab */}
          <TabsContent value="logs">
            <Card>
              <CardHeader>
                <CardTitle>Log Attività</CardTitle>
                <CardDescription>
                  Visualizza lo storico delle attività delle integrazioni
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-900">Stripe connected successfully</p>
                      <p className="text-xs text-green-700">2 ore fa</p>
                    </div>
                    <Badge variant="outline">Stripe</Badge>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <RefreshCw className="h-4 w-4 text-blue-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">QuickBooks sync completed</p>
                      <p className="text-xs text-blue-700">5 ore fa - 15 clienti sincronizzati</p>
                    </div>
                    <Badge variant="outline">QuickBooks</Badge>
                  </div>

                  <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-red-900">SendGrid API error</p>
                      <p className="text-xs text-red-700">1 giorno fa - Rate limit exceeded</p>
                    </div>
                    <Badge variant="outline">SendGrid</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Configurazioni Globali</CardTitle>
                <CardDescription>
                  Impostazioni generali per tutte le integrazioni
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Auto-sync</h3>
                    <p className="text-sm text-gray-500">Sincronizzazione automatica ogni ora</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Error notifications</h3>
                    <p className="text-sm text-gray-500">Notifica errori via email</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Webhook logging</h3>
                    <p className="text-sm text-gray-500">Registra tutti i webhook</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Retry failed syncs</h3>
                    <p className="text-sm text-gray-500">Riprova automaticamente sync falliti</p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Integration Details Dialog */}
        <Dialog open={showIntegrationDetails} onOpenChange={setShowIntegrationDetails}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Dettagli Integrazione</DialogTitle>
              <DialogDescription>
                Configurazione completa e stato dell'integrazione
              </DialogDescription>
            </DialogHeader>
            
            {selectedIntegration && (
              <div className="space-y-6">
                {/* Integration Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informazioni Generali</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Nome</label>
                        <div className="flex items-center space-x-2 mt-1">
                          {selectedIntegration.icon}
                          <span className="font-medium">{selectedIntegration.name}</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Tipo</label>
                        <div className="flex items-center mt-1">
                          {getTypeIcon(selectedIntegration.type)}
                          <span className="ml-2">{getTypeLabel(selectedIntegration.type)}</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Stato</label>
                        <div className="mt-1">{getStatusBadge(selectedIntegration.status)}</div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-600">Descrizione</label>
                        <p className="mt-1">{selectedIntegration.description}</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Stato Connessione</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Stato</span>
                        {getStatusBadge(selectedIntegration.status)}
                      </div>
                      
                      {selectedIntegration.lastSync && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Ultima Sincronizzazione</label>
                          <p className="mt-1">{new Date(selectedIntegration.lastSync).toLocaleString('it-IT')}</p>
                        </div>
                      )}
                      
                      {selectedIntegration.error && (
                        <div>
                          <label className="text-sm font-medium text-red-600">Errore</label>
                          <p className="mt-1 text-red-600">{selectedIntegration.error}</p>
                        </div>
                      )}
                      
                      <div className="flex space-x-2 pt-4">
                        {selectedIntegration.status === 'DISCONNECTED' ? (
                          <Button onClick={() => connectIntegration(selectedIntegration.id)}>
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Connetti
                          </Button>
                        ) : (
                          <>
                            <Button variant="outline" onClick={() => testIntegration(selectedIntegration.id)}>
                              <TestTube className="h-4 w-4 mr-2" />
                              Test
                            </Button>
                            <Button variant="outline" onClick={() => syncIntegration(selectedIntegration.id)}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Sync
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Features */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Funzionalità</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedIntegration.features.map((feature, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Configuration */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Configurazione</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedIntegration.config && Object.entries(selectedIntegration.config).map(([key, value]) => (
                        <div key={key}>
                          <label className="text-sm font-medium text-gray-600">{key}</label>
                          <Input 
                            type="password" 
                            value={value ? '••••••••' : ''} 
                            readOnly 
                            className="mt-1"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

