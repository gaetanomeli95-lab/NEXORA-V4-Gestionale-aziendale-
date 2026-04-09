"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Brain, 
  TrendingUp, 
  Users, 
  Target, 
  AlertTriangle, 
  CheckCircle,
  BarChart3,
  DollarSign,
  Package,
  ShoppingCart,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  RefreshCw,
  Download,
  Filter,
  Search
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

interface AISuggestion {
  type: 'CROSS_SELL' | 'UPSELL' | 'PRICING' | 'INVENTORY' | 'MARKETING' | 'FINANCIAL'
  title: string
  description: string
  impact: 'HIGH' | 'MEDIUM' | 'LOW'
  confidence: number
  actionItems: string[]
  projectedROI?: number
}

interface CustomerSegment {
  id: string
  name: string
  description: string
  customerCount: number
  avgOrderValue: number
  totalRevenue: number
  characteristics: string[]
  recommendations: string[]
}

interface ForecastData {
  period: string
  actual?: number
  forecast: number
  confidence: number
  factors: string[]
}

interface AIInsightsData {
  customerSegments: CustomerSegment[]
  revenueForecast: ForecastData[]
  suggestions: AISuggestion[]
  churnRisk: { customerId: string; risk: number; factors: string[] }[]
}

export default function AIInsightsPage() {
  const [insights, setInsights] = useState<AIInsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSuggestion, setSelectedSuggestion] = useState<AISuggestion | null>(null)
  const [showSuggestionDetails, setShowSuggestionDetails] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchAIInsights()
  }, [])

  const fetchAIInsights = async () => {
    try {
      setLoading(true)
      
      // Mock AI insights - in production, fetch from AI service
      const mockInsights: AIInsightsData = {
        customerSegments: [
          {
            id: 'high_value',
            name: 'Clienti di Alto Valore',
            description: 'Clienti con alto valore ordine e frequenza elevata',
            customerCount: 45,
            avgOrderValue: 850,
            totalRevenue: 38250,
            characteristics: ['Ordini frequenti', 'Valore medio alto', 'Fidelizzazione elevata'],
            recommendations: ['Programma VIP esclusivo', 'Offerte personalizzate premium']
          },
          {
            id: 'growth_potential',
            name: 'Potenziale Crescita',
            description: 'Clienti con potenziale di aumento valore',
            customerCount: 78,
            avgOrderValue: 450,
            totalRevenue: 35100,
            characteristics: ['Frequenza moderata', 'Valore medio', 'Potenziale upsell'],
            recommendations: ['Cross-selling strategico', 'Programmi fedeltà']
          },
          {
            id: 'at_risk',
            name: 'Clienti a Rischio',
            description: 'Clienti con rischio di abbandono',
            customerCount: 23,
            avgOrderValue: 200,
            totalRevenue: 4600,
            characteristics: ['Bassa frequenza', 'Rischio abbandono elevato'],
            recommendations: ['Campagne re-engagement', 'Offerte speciali']
          }
        ],
        revenueForecast: [
          { period: 'Gen', actual: 3200, forecast: 3150, confidence: 90, factors: ['Stagionalità', 'Trend storico'] },
          { period: 'Feb', actual: 3450, forecast: 3400, confidence: 85, factors: ['Campagne marketing', 'Condizioni mercato'] },
          { period: 'Mar', forecast: 3680, confidence: 80, factors: ['Trend crescita', 'Nuovi clienti'] },
          { period: 'Apr', forecast: 3850, confidence: 75, factors: ['Prodotto lancio', 'Espansione mercato'] },
          { period: 'Mag', forecast: 3980, confidence: 70, factors: ['Stagionalità positiva', 'Fidelizzazione'] },
          { period: 'Giu', forecast: 4120, confidence: 65, factors: ['Previsioni mercato', 'Investimenti'] }
        ],
        suggestions: [
          {
            type: 'CROSS_SELL',
            title: 'Cross-sell: Laptop Pro + Mouse Wireless',
            description: 'Questi prodotti sono spesso acquistati insieme. Considera un bundle.',
            impact: 'HIGH',
            confidence: 85,
            actionItems: ['Crea bundle combinato', 'Offerta sconto 10%', 'Posizionamento strategico'],
            projectedROI: 25
          },
          {
            type: 'INVENTORY',
            title: 'Riassortimento urgente: Keyboard Bluetooth',
            description: 'Scorte attuali: 3, Minimo: 20',
            impact: 'HIGH',
            confidence: 95,
            actionItems: ['Ordina riassortimento', 'Imposta alert automatici'],
            projectedROI: 15
          },
          {
            type: 'PRICING',
            title: 'Ottimizzazione prezzo: Monitor 4K',
            description: 'Margine elevato (65%). Considera aumento prezzo.',
            impact: 'MEDIUM',
            confidence: 70,
            actionItems: ['Test aumento 5-10%', 'Monitora impatto vendite'],
            projectedROI: 20
          },
          {
            type: 'FINANCIAL',
            title: 'Cash Flow Negativo',
            description: 'Cash flow attuale: -€2,450',
            impact: 'HIGH',
            confidence: 95,
            actionItems: ['Accelera incassi', 'Rinegozia termini pagamento'],
            projectedROI: 40
          }
        ],
        churnRisk: [
          { customerId: '1', risk: 85, factors: ['Nessun ordine negli ultimi 90 giorni', 'Bassa frequenza'] },
          { customerId: '2', risk: 72, factors: ['Valore ordine basso', 'Pochi ordini storici'] },
          { customerId: '3', risk: 68, factors: ['Bassa frequenza ordini', 'Rischio churn'] }
        ]
      }

      setInsights(mockInsights)
    } catch (error) {
      console.error('Error fetching AI insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const getImpactBadge = (impact: string) => {
    const impactConfig = {
      HIGH: { label: 'Alto', variant: 'destructive' as const },
      MEDIUM: { label: 'Medio', variant: 'default' as const },
      LOW: { label: 'Basso', variant: 'outline' as const }
    }
    
    const config = impactConfig[impact as keyof typeof impactConfig] || impactConfig.LOW
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'CROSS_SELL': return <ShoppingCart className="h-4 w-4" />
      case 'UPSELL': return <TrendingUp className="h-4 w-4" />
      case 'PRICING': return <DollarSign className="h-4 w-4" />
      case 'INVENTORY': return <Package className="h-4 w-4" />
      case 'MARKETING': return <Target className="h-4 w-4" />
      case 'FINANCIAL': return <BarChart3 className="h-4 w-4" />
      default: return <Lightbulb className="h-4 w-4" />
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const filteredSuggestions = insights?.suggestions.filter(suggestion =>
    suggestion.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    suggestion.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) || []

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Brain className="h-8 w-8 animate-pulse text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Analisi AI in corso...</p>
        </div>
      </div>
    )
  }

  if (!insights) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nessun dato disponibile</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Brain className="h-8 w-8 mr-3 text-blue-600" />
              Analisi Intelligente
            </h1>
            <p className="text-gray-600">Analisi predittive e suggerimenti intelligenti</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={fetchAIInsights}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Aggiorna Analisi
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Esporta Rapporto
            </Button>
          </div>
        </div>

        {/* AI Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-90">Suggerimenti Attivi</p>
                    <p className="text-2xl font-bold mt-1">{insights.suggestions.length}</p>
                    <p className="text-xs opacity-75 mt-1">
                      {insights.suggestions.filter(s => s.impact === 'HIGH').length} ad alta priorità
                    </p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Lightbulb className="h-6 w-6" />
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
            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-90">ROI Potenziale</p>
                    <p className="text-2xl font-bold mt-1">
                      {insights.suggestions.reduce((sum, s) => sum + (s.projectedROI || 0), 0)}%
                    </p>
                    <p className="text-xs opacity-75 mt-1">
                      Medio per suggerimento
                    </p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-lg">
                    <TrendingUp className="h-6 w-6" />
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
            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-90">Clienti a Rischio</p>
                    <p className="text-2xl font-bold mt-1">{insights.churnRisk.length}</p>
                    <p className="text-xs opacity-75 mt-1">
                      Rischio medio: {Math.round(insights.churnRisk.reduce((sum, c) => sum + c.risk, 0) / insights.churnRisk.length)}%
                    </p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-lg">
                    <AlertTriangle className="h-6 w-6" />
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
            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium opacity-90">Previsione Fatturato</p>
                    <p className="text-2xl font-bold mt-1">
                      {formatCurrency(insights.revenueForecast[insights.revenueForecast.length - 1].forecast)}
                    </p>
                    <p className="text-xs opacity-75 mt-1">
                      Prossimi 6 mesi
                    </p>
                  </div>
                  <div className="p-3 bg-white/20 rounded-lg">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Panoramica</TabsTrigger>
            <TabsTrigger value="suggestions">Suggerimenti</TabsTrigger>
            <TabsTrigger value="segments">Segmenti Clienti</TabsTrigger>
            <TabsTrigger value="forecast">Previsioni</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Suggestions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lightbulb className="h-5 w-5 mr-2" />
                    Suggerimenti Principali
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {insights.suggestions.slice(0, 3).map((suggestion, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                           onClick={() => {
                             setSelectedSuggestion(suggestion)
                             setShowSuggestionDetails(true)
                           }}>
                        <div className="flex items-center space-x-3">
                          {getTypeIcon(suggestion.type)}
                          <div>
                            <p className="font-medium">{suggestion.title}</p>
                            <p className="text-sm text-gray-500">{suggestion.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {getImpactBadge(suggestion.impact)}
                          <p className="text-xs text-gray-500 mt-1">{suggestion.confidence}% conf.</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Customer Segments Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Segmenti Clienti
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {insights.customerSegments.map((segment) => (
                      <div key={segment.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div>
                          <p className="font-medium">{segment.name}</p>
                          <p className="text-sm text-gray-500">{segment.customerCount} clienti</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatCurrency(segment.avgOrderValue)}</p>
                          <p className="text-xs text-gray-500">media ordine</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Forecast Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Previsione Fatturato
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {insights.revenueForecast.map((forecast, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="font-medium w-12">{forecast.period}</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${Math.min((forecast.forecast / 5000) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center space-x-2">
                          {forecast.actual && (
                            <span className="text-sm text-gray-500">{formatCurrency(forecast.actual)}</span>
                          )}
                          <span className="font-medium">{formatCurrency(forecast.forecast)}</span>
                        </div>
                        <p className="text-xs text-gray-500">{forecast.confidence}% conf.</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Suggestions Tab */}
          <TabsContent value="suggestions">
            <Card>
              <CardHeader>
                <CardTitle>Suggerimenti AI</CardTitle>
                <CardDescription>
                  Raccomandazioni intelligenti basate sull'analisi dei dati
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search */}
                <div className="relative mb-6">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Cerca suggerimenti..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Suggestions List */}
                <div className="space-y-4">
                  {filteredSuggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                         onClick={() => {
                           setSelectedSuggestion(suggestion)
                           setShowSuggestionDetails(true)
                         }}>
                      <div className="flex items-center space-x-3">
                        {getTypeIcon(suggestion.type)}
                        <div>
                          <p className="font-medium">{suggestion.title}</p>
                          <p className="text-sm text-gray-500">{suggestion.description}</p>
                          {suggestion.projectedROI && (
                            <p className="text-xs text-green-600">ROI potenziale: {suggestion.projectedROI}%</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {getImpactBadge(suggestion.impact)}
                        <p className="text-xs text-gray-500 mt-1">{suggestion.confidence}% conf.</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customer Segments Tab */}
          <TabsContent value="segments">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {insights.customerSegments.map((segment) => (
                <Card key={segment.id}>
                  <CardHeader>
                    <CardTitle>{segment.name}</CardTitle>
                    <CardDescription>{segment.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Clienti</p>
                          <p className="text-2xl font-bold">{segment.customerCount}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">Media Ordine</p>
                          <p className="text-2xl font-bold">{formatCurrency(segment.avgOrderValue)}</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Caratteristiche</p>
                        <div className="flex flex-wrap gap-1">
                          {segment.characteristics.map((char, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {char}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Raccomandazioni</p>
                        <ul className="text-sm space-y-1">
                          {segment.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-center">
                              <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Forecast Tab */}
          <TabsContent value="forecast">
            <Card>
              <CardHeader>
                <CardTitle>Previsioni Fatturato</CardTitle>
                <CardDescription>
                  Analisi predittiva basata su dati storici e trend di mercato
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {insights.revenueForecast.map((forecast, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium">{forecast.period}</h3>
                        <div className="flex items-center space-x-2">
                          {forecast.actual && (
                            <Badge variant="outline">Reale: {formatCurrency(forecast.actual)}</Badge>
                          )}
                          <Badge>Previsione: {formatCurrency(forecast.forecast)}</Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Confidenza</span>
                          <span>{forecast.confidence}%</span>
                        </div>
                        <Progress value={forecast.confidence} className="h-2" />
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Fattori considerati:</p>
                        <div className="flex flex-wrap gap-1">
                          {forecast.factors.map((factor, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Suggestion Details Dialog */}
        <Dialog open={showSuggestionDetails} onOpenChange={setShowSuggestionDetails}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Dettagli Suggerimento</DialogTitle>
              <DialogDescription>
                Analisi completa e azioni consigliate
              </DialogDescription>
            </DialogHeader>
            
            {selectedSuggestion && (
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  {getTypeIcon(selectedSuggestion.type)}
                  <div>
                    <h3 className="font-medium">{selectedSuggestion.title}</h3>
                    <p className="text-sm text-gray-500">{selectedSuggestion.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Impatto</p>
                    {getImpactBadge(selectedSuggestion.impact)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Confidenza</p>
                    <div className="flex items-center space-x-2">
                      <Progress value={selectedSuggestion.confidence} className="flex-1" />
                      <span className="text-sm">{selectedSuggestion.confidence}%</span>
                    </div>
                  </div>
                </div>

                {selectedSuggestion.projectedROI && (
                  <div>
                    <p className="text-sm font-medium text-gray-600">ROI Potenziale</p>
                    <p className="text-2xl font-bold text-green-600">{selectedSuggestion.projectedROI}%</p>
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium text-gray-600 mb-2">Azioni Consigliate</p>
                  <ul className="space-y-2">
                    {selectedSuggestion.actionItems.map((action, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex justify-end space-x-4">
                  <Button variant="outline">
                    <Eye className="h-4 w-4 mr-2" />
                    Analisi Dettagliata
                  </Button>
                  <Button>
                    <Target className="h-4 w-4 mr-2" />
                    Implementa Suggerimento
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

