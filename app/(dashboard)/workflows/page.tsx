"use client"

import { useState, useEffect } from 'react'
import { useToast } from "@/hooks/use-toast"
import { motion } from 'framer-motion'
import { 
  Search, 
  Plus, 
  Filter, 
  RefreshCw, 
  GitBranch,
  Edit, 
  Trash2, 
  Eye,
  Play,
  Pause,
  Zap,
  Mail,
  Bell,
  CheckCircle,
  AlertTriangle,
  Clock,
  Settings,
  MoreHorizontal,
  ArrowRight,
  Calendar,
  Package,
  CreditCard,
  Users,
  FileText,
  BarChart3,
  Save
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
import { PageShell, PageShellLoading } from '@/components/layout/page-shell'
import { getPopupDialogContentClassName, getPopupPrimaryButtonClassName } from '@/components/layout/module-theme'
import { PopupHeader } from '@/components/ui/popup-header'

interface WorkflowRule {
  id: string
  name: string
  description: string
  trigger: {
    type: string
    conditions: Record<string, any>
  }
  actions: Array<{
    type: string
    parameters: Record<string, any>
  }>
  isActive: boolean
  priority: number
  createdAt: string
  updatedAt: string
}

interface WorkflowExecution {
  id: string
  ruleId: string
  triggerData: any
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED'
  result?: any
  error?: string
  executedAt: string
}

export default function WorkflowsPage() {
  const { toast } = useToast()
  const [rules, setRules] = useState<WorkflowRule[]>([])
  const [executions, setExecutions] = useState<WorkflowExecution[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedTrigger, setSelectedTrigger] = useState('all')
  const [activeTab, setActiveTab] = useState('rules')
  const [selectedRule, setSelectedRule] = useState<WorkflowRule | null>(null)
  const [showRuleDetails, setShowRuleDetails] = useState(false)
  const [showCreateRuleDialog, setShowCreateRuleDialog] = useState(false)
  const [creatingRule, setCreatingRule] = useState(false)
  const [newRuleName, setNewRuleName] = useState('')
  const [newRuleDescription, setNewRuleDescription] = useState('')
  const [newRuleTrigger, setNewRuleTrigger] = useState('INVOICE_CREATED')
  const [newRuleAction, setNewRuleAction] = useState('SEND_EMAIL')
  const [newRulePriority, setNewRulePriority] = useState('1')

  useEffect(() => {
    fetchRules()
    fetchExecutions()
  }, [searchQuery, selectedStatus, selectedTrigger])

  const fetchRules = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/workflows/rules')
      const result = await response.json()
      
      if (result.success) {
        setRules(result.data)
      }
    } catch (error) {
      console.error('Error fetching workflow rules:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchExecutions = async () => {
    try {
      const response = await fetch('/api/workflows/executions')
      const result = await response.json()
      
      if (result.success) {
        setExecutions(result.data)
      }
    } catch (error) {
      console.error('Error fetching workflow executions:', error)
    }
  }

  const getTriggerIcon = (triggerType: string) => {
    switch (triggerType) {
      case 'INVOICE_CREATED': return <FileText className="h-4 w-4" />
      case 'PAYMENT_RECEIVED': return <CreditCard className="h-4 w-4" />
      case 'ORDER_STATUS_CHANGED': return <Package className="h-4 w-4" />
      case 'STOCK_LOW': return <AlertTriangle className="h-4 w-4" />
      case 'CUSTOMER_CREATED': return <Users className="h-4 w-4" />
      default: return <Zap className="h-4 w-4" />
    }
  }

  const getTriggerLabel = (triggerType: string) => {
    const triggerConfig = {
      INVOICE_CREATED: 'Fattura Creata',
      PAYMENT_RECEIVED: 'Pagamento Ricevuto',
      ORDER_STATUS_CHANGED: 'Stato Ordine Cambiato',
      STOCK_LOW: 'Scorte Basse',
      CUSTOMER_CREATED: 'Cliente Creato'
    }
    
    return triggerConfig[triggerType as keyof typeof triggerConfig] || triggerType
  }

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'SEND_EMAIL': return <Mail className="h-4 w-4" />
      case 'SEND_SMS': return <Bell className="h-4 w-4" />
      case 'CREATE_TASK': return <CheckCircle className="h-4 w-4" />
      case 'UPDATE_STATUS': return <Settings className="h-4 w-4" />
      case 'NOTIFY_ADMIN': return <Bell className="h-4 w-4" />
      case 'CREATE_INVOICE': return <FileText className="h-4 w-4" />
      default: return <Zap className="h-4 w-4" />
    }
  }

  const getActionLabel = (actionType: string) => {
    const actionConfig = {
      SEND_EMAIL: 'Invia Email',
      SEND_SMS: 'Invia SMS',
      CREATE_TASK: 'Crea Task',
      UPDATE_STATUS: 'Aggiorna Stato',
      NOTIFY_ADMIN: 'Notifica Admin',
      CREATE_INVOICE: 'Crea Fattura'
    }
    
    return actionConfig[actionType as keyof typeof actionConfig] || actionType
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { label: 'In Attesa', variant: 'outline' as const },
      RUNNING: { label: 'In Esecuzione', variant: 'default' as const },
      COMPLETED: { label: 'Completato', variant: 'default' as const },
      FAILED: { label: 'Fallito', variant: 'destructive' as const }
    }
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const toggleRuleStatus = async (ruleId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/workflows/rules/${ruleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      })

      if (response.ok) {
        fetchRules()
      }
    } catch (error) {
      console.error('Error toggling rule status:', error)
    }
  }

  const deleteRule = async (ruleId: string) => {
    try {
      const response = await fetch(`/api/workflows/rules/${ruleId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchRules()
      }
    } catch (error) {
      console.error('Error deleting rule:', error)
    }
  }

  const resetNewRuleForm = () => {
    setNewRuleName('')
    setNewRuleDescription('')
    setNewRuleTrigger('INVOICE_CREATED')
    setNewRuleAction('SEND_EMAIL')
    setNewRulePriority('1')
  }

  const buildDefaultActionParameters = (actionType: string) => {
    switch (actionType) {
      case 'SEND_EMAIL':
        return {
          recipient: '{{customer.email}}',
          subject: 'Automazione NEXORA',
          template: 'workflow-email'
        }
      case 'SEND_SMS':
        return {
          message: 'Notifica automatica NEXORA'
        }
      case 'CREATE_TASK':
        return {
          description: 'Task creato automaticamente dal workflow',
          assignee: 'admin@nexora.com'
        }
      case 'UPDATE_STATUS':
        return {
          status: 'PROCESSING'
        }
      case 'NOTIFY_ADMIN':
        return {
          message: 'Evento workflow eseguito correttamente'
        }
      case 'CREATE_INVOICE':
        return {
          type: 'STANDARD'
        }
      default:
        return {}
    }
  }

  const createRule = async () => {
    if (!newRuleName.trim()) {
      toast({ title: 'Nome richiesto', description: 'Inserisci un nome per la regola', variant: 'destructive' })
      return
    }

    try {
      setCreatingRule(true)
      const response = await fetch('/api/workflows/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRuleName.trim(),
          description: newRuleDescription.trim() || `Regola automatica per ${getTriggerLabel(newRuleTrigger)}`,
          trigger: {
            type: newRuleTrigger,
            conditions: {}
          },
          actions: [
            {
              type: newRuleAction,
              parameters: buildDefaultActionParameters(newRuleAction)
            }
          ],
          isActive: true,
          priority: Number(newRulePriority) || 1
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Errore creazione regola')
      }

      await fetchRules()
      setShowCreateRuleDialog(false)
      resetNewRuleForm()
      toast({ title: 'Regola creata', description: 'La nuova regola workflow è stata aggiunta correttamente.' })
    } catch (error) {
      toast({
        title: 'Errore creazione',
        description: error instanceof Error ? error.message : 'Impossibile creare la regola',
        variant: 'destructive'
      })
    } finally {
      setCreatingRule(false)
    }
  }

  const testWorkflow = async (eventType: string) => {
    try {
      const sharedCustomer = {
        id: 'customer-test-001',
        name: 'Test Customer',
        email: 'test@example.com'
      }

      const testPayloads: Record<string, Record<string, any>> = {
        INVOICE_CREATED: {
          invoice: {
            id: 'invoice-test-001',
            number: 'INV-001',
            status: 'SENT',
            totalAmount: 100,
            dueDate: new Date().toISOString(),
            customerId: sharedCustomer.id,
            customer: sharedCustomer
          },
          customer: sharedCustomer
        },
        PAYMENT_RECEIVED: {
          payment: {
            id: 'payment-test-001',
            amount: 100,
            status: 'COMPLETED',
            customer: sharedCustomer,
            invoice: {
              id: 'invoice-test-001',
              number: 'INV-001',
              paidAmount: 100,
              customerId: sharedCustomer.id,
              customer: sharedCustomer
            }
          },
          customer: sharedCustomer,
          invoice: {
            id: 'invoice-test-001',
            number: 'INV-001',
            paidAmount: 100,
            customerId: sharedCustomer.id,
            customer: sharedCustomer
          }
        },
        ORDER_STATUS_CHANGED: {
          order: {
            id: 'order-test-001',
            number: 'ORD-001',
            status: 'PROCESSING',
            customerId: sharedCustomer.id,
            customer: sharedCustomer
          },
          customer: sharedCustomer,
          status: 'PROCESSING'
        },
        STOCK_LOW: {
          product: {
            id: 'product-test-001',
            name: 'Test Product',
            stockQuantity: 5
          },
          stock: {
            quantity: 5
          }
        },
        CUSTOMER_CREATED: {
          customer: sharedCustomer
        }
      }

      const response = await fetch('/api/workflows/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventType,
          data: testPayloads[eventType] || {}
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Errore durante il test del workflow')
      }

      await fetchExecutions()
      toast({
        title: "Test eseguito",
        description: result.data?.executions?.length
          ? `Workflow test eseguito con successo. ${result.data.executions.length} regola/e avviata/e.`
          : 'Nessuna regola attiva corrisponde a questo evento di test.'
      })
    } catch (error) {
      console.error('Error testing workflow:', error)
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Errore durante il test del workflow",
        variant: "destructive"
      })
    }
  }

  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         rule.description.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'active' && rule.isActive) ||
                         (selectedStatus === 'inactive' && !rule.isActive)
    
    const matchesTrigger = selectedTrigger === 'all' || rule.trigger.type === selectedTrigger
    
    return matchesSearch && matchesStatus && matchesTrigger
  })

  if (loading && rules.length === 0) {
    return (
      <PageShell title="Workflow Automation" description="Automazione processi e regole business" icon={GitBranch} theme="workflows">
        <PageShellLoading label="Caricamento workflow..." theme="workflows" />
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Workflow Automation"
      description="Automazione processi e regole business"
      icon={GitBranch}
      theme="workflows"
      actions={
        <>
          <Button variant="outline" onClick={fetchRules} className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <RefreshCw className="h-4 w-4 mr-2" />
            Aggiorna
          </Button>
          <Button onClick={() => setShowCreateRuleDialog(true)} className="border border-indigo-400/40 bg-indigo-500 text-white hover:bg-indigo-600 shadow-[0_14px_30px_-18px_rgba(99,102,241,0.75)]">
            <Plus className="h-4 w-4 mr-2" />
            Nuova Regola
          </Button>
        </>
      }
    >
      <div className="space-y-6">
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
                    <p className="text-sm font-medium text-gray-600">Regole Attive</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {rules.filter(rule => rule.isActive).length}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      di {rules.length} totali
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-50">
                    <Play className="h-6 w-6 text-green-600" />
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
                    <p className="text-sm font-medium text-gray-600">Esecuzioni Oggi</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {executions.filter(exec => 
                        new Date(exec.executedAt).toDateString() === new Date().toDateString()
                      ).length}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {executions.filter(exec => exec.status === 'COMPLETED').length} completate
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-50">
                    <Zap className="h-6 w-6 text-blue-600" />
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
                    <p className="text-sm font-medium text-gray-600">Tasso Successo</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">
                      {executions.length > 0 
                        ? Math.round((executions.filter(exec => exec.status === 'COMPLETED').length / executions.length) * 100)
                        : 0}%
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Ultimi 7 giorni
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-50">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
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
                    <p className="text-sm font-medium text-gray-600">Eventi Tracciati</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">5</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Tipi di trigger
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-orange-50">
                    <Calendar className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="rules">Regole Workflow</TabsTrigger>
            <TabsTrigger value="executions">Esecuzioni</TabsTrigger>
            <TabsTrigger value="test">Test Workflow</TabsTrigger>
          </TabsList>

          {/* Rules Tab */}
          <TabsContent value="rules">
            <Card>
              <CardHeader>
                <CardTitle>Regole di Automazione</CardTitle>
                <CardDescription>
                  Configura le regole di automazione per i tuoi processi business
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-col lg:flex-row gap-4 mb-6">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Cerca regole..."
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
                        <SelectItem value="active">Attive</SelectItem>
                        <SelectItem value="inactive">Inattive</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={selectedTrigger} onValueChange={setSelectedTrigger}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Trigger" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tutti i trigger</SelectItem>
                        <SelectItem value="INVOICE_CREATED">Fattura Creata</SelectItem>
                        <SelectItem value="PAYMENT_RECEIVED">Pagamento Ricevuto</SelectItem>
                        <SelectItem value="ORDER_STATUS_CHANGED">Stato Ordine</SelectItem>
                        <SelectItem value="STOCK_LOW">Scorte Basse</SelectItem>
                        <SelectItem value="CUSTOMER_CREATED">Cliente Creato</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button variant="outline">
                      <Filter className="h-4 w-4 mr-2" />
                      Filtri
                    </Button>
                  </div>
                </div>

                {/* Rules Table */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Trigger</TableHead>
                      <TableHead>Azioni</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Ultima Esecuzione</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRules.map((rule) => (
                      <TableRow 
                        key={rule.id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          setSelectedRule(rule)
                          setShowRuleDetails(true)
                        }}
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium">{rule.name}</div>
                            <div className="text-sm text-gray-500">{rule.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {getTriggerIcon(rule.trigger.type)}
                            <span className="ml-2 text-sm">{getTriggerLabel(rule.trigger.type)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            {rule.actions.slice(0, 2).map((action, index) => (
                              <div key={index} className="flex items-center">
                                {getActionIcon(action.type)}
                              </div>
                            ))}
                            {rule.actions.length > 2 && (
                              <span className="text-xs text-gray-500">+{rule.actions.length - 2}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={rule.isActive}
                              onCheckedChange={(checked) => toggleRuleStatus(rule.id, rule.isActive)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Badge variant={rule.isActive ? 'default' : 'outline'}>
                              {rule.isActive ? 'Attiva' : 'Inattiva'}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{rule.priority}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {new Date(rule.updatedAt).toLocaleDateString('it-IT')}
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
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedRule(rule); setShowRuleDetails(true) }}>
                                <Eye className="h-4 w-4 mr-2" />
                                Dettagli
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <Edit className="h-4 w-4 mr-2" />
                                Modifica
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); testWorkflow(rule.trigger.type) }}>
                                <Play className="h-4 w-4 mr-2" />
                                Test
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); deleteRule(rule.id) }} className="text-red-600">
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

          {/* Executions Tab */}
          <TabsContent value="executions">
            <Card>
              <CardHeader>
                <CardTitle>Cronologia Esecuzioni</CardTitle>
                <CardDescription>
                  Visualizza lo storico delle esecuzioni dei workflow
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Regola</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead>Data Esecuzione</TableHead>
                      <TableHead>Durata</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {executions.slice(0, 10).map((execution) => {
                      const rule = rules.find(r => r.id === execution.ruleId)
                      return (
                        <TableRow key={execution.id}>
                          <TableCell>
                            <div className="font-medium">{rule?.name || 'Unknown Rule'}</div>
                          </TableCell>
                          <TableCell>{getStatusBadge(execution.status)}</TableCell>
                          <TableCell>
                            {new Date(execution.executedAt).toLocaleString('it-IT')}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm text-gray-500">
                              {execution.status === 'COMPLETED' ? '< 1s' : '-'}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Test Tab */}
          <TabsContent value="test">
            <Card>
              <CardHeader>
                <CardTitle>Test Workflow</CardTitle>
                <CardDescription>
                  Testa le regole di automazione con dati di esempio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col"
                    onClick={() => testWorkflow('INVOICE_CREATED')}
                  >
                    <FileText className="h-6 w-6 mb-2" />
                    Test Fattura Creata
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col"
                    onClick={() => testWorkflow('PAYMENT_RECEIVED')}
                  >
                    <CreditCard className="h-6 w-6 mb-2" />
                    Test Pagamento Ricevuto
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col"
                    onClick={() => testWorkflow('ORDER_STATUS_CHANGED')}
                  >
                    <Package className="h-6 w-6 mb-2" />
                    Test Stato Ordine
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col"
                    onClick={() => testWorkflow('STOCK_LOW')}
                  >
                    <AlertTriangle className="h-6 w-6 mb-2" />
                    Test Scorte Basse
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-20 flex-col"
                    onClick={() => testWorkflow('CUSTOMER_CREATED')}
                  >
                    <Users className="h-6 w-6 mb-2" />
                    Test Cliente Creato
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={showCreateRuleDialog} onOpenChange={setShowCreateRuleDialog}>
          <DialogContent className={getPopupDialogContentClassName("max-w-2xl")}>
            <PopupHeader
              theme="workflows"
              title="Nuova Regola Workflow"
              description="Crea una regola automatica con trigger e azione predefiniti."
            />

            <div className="space-y-4 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Nome regola</span>
                  <Input value={newRuleName} onChange={(e) => setNewRuleName(e.target.value)} placeholder="Es. Avvisa pagamento ricevuto" />
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Priorità</span>
                  <Select value={newRulePriority} onValueChange={setNewRulePriority}>
                    <SelectTrigger>
                      <SelectValue placeholder="Priorità" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 - Alta</SelectItem>
                      <SelectItem value="2">2 - Media</SelectItem>
                      <SelectItem value="3">3 - Bassa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Descrizione</span>
                <Input value={newRuleDescription} onChange={(e) => setNewRuleDescription(e.target.value)} placeholder="Descrivi lo scopo della regola" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Trigger</span>
                  <Select value={newRuleTrigger} onValueChange={setNewRuleTrigger}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona trigger" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INVOICE_CREATED">Fattura Creata</SelectItem>
                      <SelectItem value="PAYMENT_RECEIVED">Pagamento Ricevuto</SelectItem>
                      <SelectItem value="ORDER_STATUS_CHANGED">Stato Ordine</SelectItem>
                      <SelectItem value="STOCK_LOW">Scorte Basse</SelectItem>
                      <SelectItem value="CUSTOMER_CREATED">Cliente Creato</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">Azione</span>
                  <Select value={newRuleAction} onValueChange={setNewRuleAction}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona azione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SEND_EMAIL">Invia Email</SelectItem>
                      <SelectItem value="SEND_SMS">Invia SMS</SelectItem>
                      <SelectItem value="CREATE_TASK">Crea Task</SelectItem>
                      <SelectItem value="UPDATE_STATUS">Aggiorna Stato</SelectItem>
                      <SelectItem value="NOTIFY_ADMIN">Notifica Admin</SelectItem>
                      <SelectItem value="CREATE_INVOICE">Crea Fattura</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => { setShowCreateRuleDialog(false); resetNewRuleForm() }} disabled={creatingRule}>
                  Annulla
                </Button>
                <Button onClick={createRule} disabled={creatingRule} className={getPopupPrimaryButtonClassName('workflows')}>
                  <Save className={`h-4 w-4 mr-2 ${creatingRule ? 'animate-pulse' : ''}`} />
                  {creatingRule ? 'Creazione...' : 'Crea Regola'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Rule Details Dialog */}
        <Dialog open={showRuleDetails} onOpenChange={setShowRuleDetails}>
          <DialogContent className={getPopupDialogContentClassName("max-w-4xl max-h-[90vh] overflow-y-auto")}>
            <PopupHeader
              theme="workflows"
              title="Dettagli Regola Workflow"
              description="Configurazione completa della regola di automazione"
            />
            
            {selectedRule && (
              <div className="space-y-6 p-6">
                {/* Rule Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Informazioni Generali</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Nome</label>
                        <p className="font-medium">{selectedRule.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Descrizione</label>
                        <p>{selectedRule.description}</p>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Stato</label>
                          <div className="flex items-center">
                            <Switch checked={selectedRule.isActive} />
                            <span className="ml-2">
                              {selectedRule.isActive ? 'Attiva' : 'Inattiva'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Priorità</label>
                          <Badge variant="outline">{selectedRule.priority}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Trigger</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-2">
                        {getTriggerIcon(selectedRule.trigger.type)}
                        <span className="font-medium">{getTriggerLabel(selectedRule.trigger.type)}</span>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Condizioni</label>
                        <pre className="text-xs bg-gray-100 p-2 rounded">
                          {JSON.stringify(selectedRule.trigger.conditions, null, 2)}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Azioni</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedRule.actions.map((action, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center space-x-3">
                            {getActionIcon(action.type)}
                            <div>
                              <p className="font-medium">{getActionLabel(action.type)}</p>
                              <p className="text-sm text-gray-500">
                                {Object.keys(action.parameters).join(', ')}
                              </p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4">
                  <Button variant="outline">
                    <Play className="h-4 w-4 mr-2" />
                    Test Regola
                  </Button>
                  <Button variant="outline">
                    <Edit className="h-4 w-4 mr-2" />
                    Modifica
                  </Button>
                  <Button className={getPopupPrimaryButtonClassName('workflows')}>
                    <Save className="h-4 w-4 mr-2" />
                    Salva
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PageShell>
  )
}

