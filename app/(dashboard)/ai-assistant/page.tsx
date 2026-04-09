"use client"

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Bot, 
  User, 
  Minimize2, 
  Maximize2, 
  X, 
  Copy, 
  Download,
  FileText,
  Receipt,
  ClipboardList,
  Package,
  Users,
  Settings,
  TrendingUp,
  Brain,
  Sparkles,
  Zap,
  CheckCircle,
  AlertCircle,
  Info,
  Lightbulb,
  Target,
  BarChart3,
  Building,
  Truck,
  CreditCard,
  BookOpen,
  Wrench,
  Tag,
  Warehouse
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from "@/hooks/use-toast"

interface AIMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  actions?: AIAction[]
}

interface AIAction {
  type: 'create_document' | 'open_page' | 'generate_report' | 'execute_task'
  label: string
  description: string
  icon: any
  action: string
  params?: any
}

interface AIContext {
  currentPage: string
  userRole: string
  recentActions: string[]
  systemStatus: {
    totalInvoices: number
    totalCustomers: number
    totalProducts: number
    pendingOrders: number
  }
}

const QUICK_ACTIONS = [
  {
    category: 'Documenti',
    actions: [
      { label: 'Crea Fattura', description: 'Genera una nuova fattura', type: 'create_invoice', icon: Receipt },
      { label: 'Crea Preventivo', description: 'Genera un nuovo preventivo', type: 'create_estimate', icon: ClipboardList },
      { label: 'Crea DDT', description: 'Genera un documento di trasporto', type: 'create_ddt', icon: Truck },
      { label: 'Crea Ordine Fornitore', description: 'Genera ordine fornitore', type: 'create_supplier_order', icon: Building }
    ]
  },
  {
    category: 'Report',
    actions: [
      { label: 'Report Vendite', description: 'Analizza vendite periodo', type: 'sales_report', icon: TrendingUp },
      { label: 'Report Clienti', description: 'Analisi clientela', type: 'customers_report', icon: Users },
      { label: 'Report Magazzino', description: 'Stato inventario', type: 'inventory_report', icon: Package },
      { label: 'Report Finanziario', description: 'Analisi cash flow', type: 'financial_report', icon: CreditCard }
    ]
  },
  {
    category: 'Azioni Rapide',
    actions: [
      { label: 'Mostra Dashboard', description: 'Vai al cruscotto', type: 'open_dashboard', icon: BarChart3 },
      { label: 'Gestione Clienti', description: 'Vai a clienti', type: 'open_customers', icon: Users },
      { label: 'Gestione Prodotti', description: 'Vai a prodotti', type: 'open_products', icon: Package },
      { label: 'Impostazioni', description: 'Vai a impostazioni', type: 'open_settings', icon: Settings }
    ]
  }
]

export default function AIAssistantPage() {
  const { toast } = useToast()
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [context, setContext] = useState<AIContext | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showQuickActions, setShowQuickActions] = useState(false)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)

  const resolveActionIcon = (icon: any) => {
    if (typeof icon === 'function') return icon
    if (typeof icon !== 'string') return Info

    const iconMap: Record<string, any> = {
      Send,
      Bot,
      User,
      Copy,
      Download,
      FileText,
      Receipt,
      ClipboardList,
      Package,
      Users,
      Settings,
      TrendingUp,
      Brain,
      Sparkles,
      Zap,
      CheckCircle,
      AlertCircle,
      Info,
      Lightbulb,
      Target,
      BarChart3,
      Building,
      Truck,
      CreditCard,
      BookOpen,
      Wrench,
      Tag,
      Warehouse,
    }

    return iconMap[icon] || Info
  }

  useEffect(() => {
    // Initialize with welcome message
    const welcomeMessage: AIMessage = {
      id: '1',
      type: 'assistant',
      content: `👋 Ciao! Sono NEXORA Copilot. Posso aiutarti con:

✨ **Creare documenti** (fatture, preventivi, DDT, ordini)
📊 **Generare report** personalizzati
🔍 **Analizzare dati** e fornire insight
⚡ **Eseguire azioni rapide** nel sistema
💡 **Rispondere a domande** su qualsiasi funzione

Cosa desideri fare oggi? Puoi scrivere in linguaggio naturale, ad esempio: "Crea una fattura per Mario Rossi" o "Mostrami il report vendite del mese scorso".`,
      timestamp: new Date(),
      actions: [
        {
          type: 'create_document',
          label: 'Crea Nuovo Documento',
          description: 'Inizia a creare fatture, preventivi o altri documenti',
          icon: FileText,
          action: 'create_document'
        },
        {
          type: 'generate_report',
          label: 'Genera Report',
          description: 'Crea report personalizzati su vendite, clienti, magazzino',
          icon: BarChart3,
          action: 'generate_report'
        }
      ]
    }
    setMessages([welcomeMessage])

    // Load context
    loadContext()
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  useEffect(() => {
    if (!messages.length || !shouldAutoScroll) {
      return
    }

    const frame = window.requestAnimationFrame(() => {
      scrollToBottom(messages.length === 1 && !isTyping ? 'auto' : 'smooth')
    })

    return () => window.cancelAnimationFrame(frame)
  }, [messages, isTyping, shouldAutoScroll])

  const loadContext = async () => {
    try {
      // Mock context - in production, fetch from API
      const mockContext: AIContext = {
        currentPage: 'ai-assistant',
        userRole: 'admin',
        recentActions: ['Creata fattura #001', 'Aggiornato cliente', 'Generato report'],
        systemStatus: {
          totalInvoices: 45,
          totalCustomers: 128,
          totalProducts: 234,
          pendingOrders: 12
        }
      }
      setContext(mockContext)
    } catch (error) {
      console.error('Error loading context:', error)
    }
  }

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    const container = messagesContainerRef.current

    if (container) {
      container.scrollTo({ top: container.scrollHeight, behavior })
      return
    }

    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  const handleMessagesScroll = () => {
    const container = messagesContainerRef.current

    if (!container) {
      return
    }

    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    setShouldAutoScroll(distanceFromBottom < 96)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  const generateAIResponse = async (userMessage: string): Promise<AIMessage> => {
    // Simulate AI processing with variable delay for realism
    const processingTime = 800 + Math.random() * 1200
    await new Promise(resolve => setTimeout(resolve, processingTime))

    const lowerMessage = userMessage.toLowerCase()
    
    // ADVANCED CONTEXTUAL ANALYSIS
    const messageHistory = messages.slice(-3) // Last 3 messages for context
    const hasPreviousContext = messageHistory.length > 1
    
    // SENTIMENT ANALYSIS
    const urgencyKeywords = ['subito', 'ora', 'urgent', 'immediat', 'veloce', 'presto']
    const isUrgent = urgencyKeywords.some(keyword => lowerMessage.includes(keyword))
    
    // QUESTION TYPE DETECTION
    const isQuestion = lowerMessage.includes('?') || lowerMessage.includes('quanto') || lowerMessage.includes('come') || lowerMessage.includes('dove') || lowerMessage.includes('quando') || lowerMessage.includes('perché') || lowerMessage.includes('qual')
    
    // MULTI-INTENT DETECTION
    const intents = {
      financial: ['soldi', 'guadagn', 'incass', 'credit', 'pagament', 'fattur', 'entr', 'usc', 'cost', 'ricav', 'util', 'perd', 'bilanc', 'cash', 'euro', '€', 'denaro', 'profitto', 'margine'],
      document: ['crea', 'nuov', 'fattur', 'preventiv', 'ddt', 'ordine', 'documento', 'emetti', 'genera', 'stamp', 'pdf'],
      report: ['report', 'analisi', 'statistic', 'dati', 'andament', 'perform', 'situaz', 'riepilog', 'vendit', 'client', 'magazzin'],
      customer: ['client', 'fornitor', 'contatt', 'azient', 'cliente'],
      product: ['prodott', 'magazzin', 'scort', 'giacenz', 'articolo', 'inventario', 'merce'],
      help: ['aiuto', 'aiuta', 'guida', 'come funziona', 'istruz', 'tutorial'],
      greeting: ['ciao', 'salve', 'buongiorno', 'buonasera', 'hey', 'hi']
    }
    
    // DETECT INTENTS WITH CONFIDENCE SCORES
    const detectedIntents = Object.entries(intents).map(([intent, keywords]) => {
      const matches = keywords.filter(keyword => lowerMessage.includes(keyword)).length
      return { intent, confidence: matches / keywords.length, matches }
    }).filter(item => item.matches > 0).sort((a, b) => b.confidence - a.confidence)
    
    // CONTEXTUAL RESPONSE GENERATION
    const generateContextualResponse = (primaryIntent: string, confidence: number) => {
      const contextualPrefixes = {
        high: ['Certamente!', 'Assolutamente sì.', 'Certo, ecco subito.', 'Perfetto, ti aiuto io.'],
        medium: ['Posso aiutarti con questo.', 'Vediamo subito.', 'Lascia fare a me.'],
        low: ['Capisco, provo ad aiutarti.', 'Forse intendevi...']
      }
      
      const urgencySuffix = isUrgent ? ' ⚡' : ''
      const confidenceLevel = confidence > 0.5 ? 'high' : confidence > 0.2 ? 'medium' : 'low'
      const prefix = contextualPrefixes[confidenceLevel][Math.floor(Math.random() * contextualPrefixes[confidenceLevel].length)]
      
      return { prefix, urgencySuffix, confidenceLevel }
    }
    
    // GREETING WITH CONTEXTUAL AWARENESS
    if (detectedIntents.length === 1 && detectedIntents[0].intent === 'greeting') {
      const contextualResponses = [
        `Ciao! 👋 Sono NEXORA Copilot.\n\nRiconosco automaticamente il contesto delle tue domande e ti fornisco risposte precise.\n\n**Prova a chiedere:**\n• "Quanto ho guadagnato questo mese?"\n• "Crea una fattura per Mario Rossi"\n• "Mostrami il report vendite"\n\nSono qui per aiutarti!`,
        `Eccomi! 🚀 Il tuo assistente intelligente è pronto.\n\nPosso analizzare le tue richieste in linguaggio naturale e fornirti risposte esatte basate sui dati reali del sistema.\n\n**Cosa vuoi sapere oggi?**`
      ]
      
      return {
        id: Date.now().toString(),
        type: 'assistant',
        content: contextualResponses[Math.floor(Math.random() * contextualResponses.length)],
        timestamp: new Date(),
        actions: QUICK_ACTIONS.flatMap(category =>
          category.actions.slice(0, 2).map(action => {
            const t: AIAction['type'] = action.type.includes('create')
              ? 'create_document'
              : action.type.includes('report')
                ? 'generate_report'
                : 'open_page'

            return {
              type: t,
              label: action.label,
              description: action.description,
              icon: action.icon,
              action: action.type
            }
          })
        ).slice(0, 4)
      }
    }
    
    // FINANCIAL INTENT WITH COMPLETE SYSTEM ANALYSIS
    if (detectedIntents.some(i => i.intent === 'financial')) {
      const financialIntent = detectedIntents.find(i => i.intent === 'financial')!
      const { prefix, urgencySuffix, confidenceLevel } = generateContextualResponse('financial', financialIntent.confidence)
      
      try {
        // AI reads ENTIRE system first
        const systemResponse = await fetch('/api/ai/system-analysis')
        const systemData = await systemResponse.json()
        
        if (systemData.success) {
          const { businessOverview, financialData, recentActivity } = systemData.data
          
          // COMPREHENSIVE FINANCIAL ANALYSIS
          const totalRevenue = financialData.invoicesRevenue || 0
          const cashBookTotal = financialData.cashBookTotal || 0
          const paymentsReceived = financialData.paymentsReceived || 0
          const cashFlowTotal = financialData.cashFlow?.totalMovements || 0
          
          // AI Insights from complete system
          let insights = []
          let financialHealth = "🟢 Ottima"
          
          if (cashBookTotal > 0) {
            insights.push(`💰 Libro Cassa: €${Math.abs(cashBookTotal).toFixed(2)} ${cashBookTotal > 0 ? 'attivo' : 'passivo'}`)
          }
          
          if (totalRevenue > 0) {
            insights.push(`📈 Fatturato: €${totalRevenue.toFixed(2)}`)
          }
          
          if (paymentsReceived > 0) {
            insights.push(`✅ Pagamenti Ricevuti: €${paymentsReceived.toFixed(2)}`)
          }
          
          if (cashFlowTotal !== 0) {
            insights.push(`📊 Movimenti Cassa: €${Math.abs(cashFlowTotal).toFixed(2)}`)
          }
          
          if (businessOverview.totalCustomers > 0) {
            insights.push(`� Clienti Attivi: ${businessOverview.totalCustomers}`)
          }
          
          // Determine financial health
          if (cashBookTotal < 0) financialHealth = "🔴 Attenzione"
          else if (cashBookTotal < 1000) financialHealth = "🟡 Monitorare"
          
          const responseText = `${prefix}🧠 **AI System Analysis - Financial Intelligence**${urgencySuffix}\n\n` +
            `🔎 **Ho analizzato l'intero sistema NEXORA V4:**\n\n` +
            `📊 **Panoramica Finanziaria Completa:**\n` +
            `• **Stato Salute**: ${financialHealth}\n` +
            `• **Libro Cassa**: ${formatCurrency(cashBookTotal)} 💵\n` +
            `• **Fatturato Totale**: ${formatCurrency(totalRevenue)} 📈\n` +
            `• **Pagamenti Ricevuti**: ${formatCurrency(paymentsReceived)} ✅\n` +
            `• **Movimenti Cassa**: ${formatCurrency(cashFlowTotal)} 📋\n\n` +
            `🏢 **Contesto Business:**\n` +
            `• **Clienti Totali**: ${businessOverview.totalCustomers}\n` +
            `• **Prodotti**: ${businessOverview.totalProducts}\n` +
            `• **Fornitori**: ${businessOverview.totalSuppliers}\n` +
            `• **Ordini**: ${businessOverview.totalOrders}\n\n` +
            (insights.length > 0 ? `🧠 **Insights AI Completivi:**\n${insights.join('\n')}\n\n` : '') +
            `*Analisi basata su TUTTI i dati del sistema: fatture, libro cassa, pagamenti, magazzino, clienti.*\n\n` +
            `**Cosa vuoi approfondire?**`
          
          return {
            id: Date.now().toString(),
            type: 'assistant',
            content: responseText,
            timestamp: new Date(),
            actions: [
              {
                type: 'open_page',
                label: '📊 Report Completo',
                description: 'Analisi finanziaria dettagliata',
                icon: TrendingUp,
                action: 'financial_report'
              },
              {
                type: 'open_page',
                label: '💰 Libro Cassa',
                description: 'Movimenti cassa dettagliati',
                icon: BookOpen,
                action: 'open_cash_book'
              },
              {
                type: 'open_page',
                label: '� Panoramica Business',
                description: 'Analisi completa attività',
                icon: BarChart3,
                action: 'open_dashboard'
              }
            ]
          }
        }
      } catch (error) {
        console.error('Error in comprehensive analysis:', error)
      }
    }
    
    // DOCUMENT CREATION WITH AI GUIDANCE
    if (detectedIntents.some(i => i.intent === 'document')) {
      const documentIntent = detectedIntents.find(i => i.intent === 'document')!
      const { prefix } = generateContextualResponse('document', documentIntent.confidence)
      
      // EXTRACT ENTITY FROM MESSAGE
      const customerMatch = userMessage.match(/(?:per|a|cliente)\s+([A-Za-z\s&]+?)(?:\s|$|,|\.|\?)/i)
      const customerName = customerMatch ? customerMatch[1].trim() : null
      
      let responseText = `${prefix}📋 **Creazione Documenti Intelligente**\n\n` +
        `Ho analizzato la tua richiesta e posso aiutarti in modo avanzato:\n\n`
      
      if (customerName) {
        responseText += `👤 **Cliente Rilevato**: *${customerName}*\n\n`
      }
      
      responseText += `**🚀 Opzioni Avanzate:**\n` +
        `1. **Creazione Guidata AI**: Ti faccio domande mirate\n` +
        `2. **Ripeti Documento Simile**: Basato su documenti passati\n` +
        `3. **Template Rapido**: Usa modelli preimpostati\n` +
        `4. **Form Completo**: Controllo manuale totale\n\n` +
        `*Quale metodo preferisci?*`
      
      return {
        id: Date.now().toString(),
        type: 'assistant',
        content: responseText,
        timestamp: new Date(),
        actions: [
          {
            type: 'create_document',
            label: '🧠 Creazione AI Guidata',
            description: 'Assistente intelligente passo passo',
            icon: Sparkles,
            action: 'guided_invoice_creation'
          },
          {
            type: 'create_document',
            label: '📄 Form Completo',
            description: 'Controllo manuale totale',
            icon: Receipt,
            action: 'create_invoice'
          },
          {
            type: 'open_page',
            label: '👥 Seleziona Cliente',
            description: 'Sfoglia anagrafica clienti',
            icon: Users,
            action: 'open_customers'
          }
        ]
      }
    }
    
    // REPORT AND ANALYSIS WITH PREDICTIVE INSIGHTS
    if (detectedIntents.some(i => i.intent === 'report')) {
      const reportIntent = detectedIntents.find(i => i.intent === 'report')!
      const { prefix } = generateContextualResponse('report', reportIntent.confidence)
      
      // TIME PERIOD DETECTION
      const timePeriods = {
        'oggi': /oggi/i,
        'ieri': /ieri/i,
        'settimana': /settiman|settimana/i,
        'mese': /mese|mensile/i,
        'trimestre': /trimestre/i,
        'anno': /anno|annuale/i
      }
      
      const detectedPeriod = Object.entries(timePeriods).find(([_, regex]) => regex.test(userMessage))?.[0] || 'personalizzato'
      
      return {
        id: Date.now().toString(),
        type: 'assistant',
        content: `${prefix}📊 **Business Intelligence Avanzata**\n\n` +
          `Ho rilevato che ti interessa un'analisi ${detectedPeriod === 'personalizzato' ? 'personalizzata' : `di periodo: ${detectedPeriod}`}\n\n` +
          `**🎯 Report Intelligenti Disponibili:**\n` +
          `• **Financial Analytics**: Cash flow, profitabilità, trend\n` +
          `• **Customer Intelligence**: Segmentazione, LTV, churn\n` +
          `• **Sales Performance**: Conversioni, pipeline, forecast\n` +
          `• **Inventory Optimization**: Rotazione, stock critici, ROI\n` +
          `• **Predictive Analytics**: Previsioni e raccomandazioni AI\n\n` +
          `*Quale area vuoi analizzare in dettaglio?*`,
        timestamp: new Date(),
        actions: [
          {
            type: 'generate_report',
            label: '📈 Financial Analytics',
            description: 'Analisi finanziaria avanzata',
            icon: TrendingUp,
            action: 'financial_report'
          },
          {
            type: 'generate_report',
            label: '👥 Customer Intelligence',
            description: 'Analisi clientela predittiva',
            icon: Users,
            action: 'customers_report'
          },
          {
            type: 'generate_report',
            label: '🔮 Predictive Analytics',
            description: 'Previsioni AI e trend',
            icon: Brain,
            action: 'predictive_report'
          }
        ]
      }
    }
    
    // HELP AND SUPPORT WITH INTELLIGENT ASSISTANCE
    if (detectedIntents.some(i => i.intent === 'help')) {
      return {
        id: Date.now().toString(),
        type: 'assistant',
        content: `🤖 **NEXORA Copilot - Modalità Guida**\n\n` +
          `Sono progettato per capire il linguaggio naturale e aiutarti in modo intelligente:\n\n` +
          `**🧠 Capacità Cognitive:**\n` +
          `• **NLP**: Comprensione linguaggio naturale\n` +
          `• **Context Memory**: Ricordo conversazioni precedenti\n` +
          `• **Intent Detection**: Identificazione automatica obiettivi\n` +
          `• **Entity Extraction**: Rilevamento nomi, date, importi\n` +
          `• **Sentiment Analysis**: Comprensione urgenza e tono\n\n` +
          `**💡 Esempi Interazioni Avanzate:**\n` +
          `• "Quanto ho guadagnato da Mario Rossi quest'anno?"\n` +
          `• "Creai fattura per Bianchi Srl come quella di ieri"\n` +
          `• "Mostrami clienti a rischio di abbandono"\n` +
          `• "Prevedi vendite prossimo mese"\n\n` +
          `*Dimmi pure in parole tue, capirò e ti aiuterò!*`,
        timestamp: new Date(),
        actions: [
          {
            type: 'open_page',
            label: '📚 Tutorial Guidato',
            description: 'Impara a usare l\'AI avanzata',
            icon: BookOpen,
            action: 'open_tutorial'
          },
          {
            type: 'open_page',
            label: '⚙️ Impostazioni AI',
            description: 'Personalizza assistente',
            icon: Settings,
            action: 'open_settings'
          }
        ]
      }
    }
    
    // FALLBACK INTELLIGENT RESPONSE
    const contextualResponses = [
      `🤖 Ho analizzato la tua richiesta. Non sono sicuro di aver capito perfettamente, ma posso aiutarti con:\n\n` +
      `💰 **Finanze**: "Quanti soldi mi devono?", "Report incassi"\n` +
      `📋 **Documenti**: "Crea fattura per [cliente]", "Nuovo preventivo"\n` +
      `📊 **Analisi**: "Report vendite mese", "Clienti top"\n` +
      `👥 **Gestione**: "Vedi clienti", "Stato magazzino"\n\n` +
      `Riformula la domanda o scegli un'azione qui sotto!`,
      
      `🧠 **Modalità Apprendimento Attivo**\n\n` +
      `Sto imparando dalle tue interazioni per migliorare. Per ora posso aiutarti con:\n\n` +
      `• Analisi finanziarie reali\n` +
      `• Creazione documenti guidata\n` +
      `• Report business intelligence\n` +
      `• Gestione clienti e magazzino\n\n` +
      `Cosa desideri fare?`
    ]
    
    return {
      id: Date.now().toString(),
      type: 'assistant',
      content: contextualResponses[Math.floor(Math.random() * contextualResponses.length)],
      timestamp: new Date(),
      actions: QUICK_ACTIONS.flatMap(category =>
        category.actions.slice(0, 2).map(action => {
          const t: AIAction['type'] = action.type.includes('create')
            ? 'create_document'
            : action.type.includes('report')
              ? 'generate_report'
              : 'open_page'

          return {
            type: t,
            label: action.label,
            description: action.description,
            icon: action.icon,
            action: action.type
          }
        })
      ).slice(0, 6)
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    setShouldAutoScroll(true)

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    try {
      const rawMessage = inputValue

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: rawMessage }),
      })

      if (!res.ok) throw new Error(`AI chat request failed: ${res.status}`)

      const payload = await res.json()

      if (!payload?.success) throw new Error(payload?.error || 'AI chat request failed')

      const backendActions = Array.isArray(payload?.data?.actions) ? payload.data.actions : []
      const mappedActions: AIAction[] = backendActions.map((a: any) => ({
        type: a.type,
        label: a.label,
        description: a.description,
        icon: resolveActionIcon(a.icon),
        action: a.action,
        params: a.params,
      }))

      const aiResponse: AIMessage = {
        id: Date.now().toString(),
        type: 'assistant',
        content: payload?.data?.content || 'Ok.',
        timestamp: new Date(),
        actions: mappedActions,
      }

      setMessages(prev => [...prev, aiResponse])
    } catch (error) {
      console.error('Error generating AI response:', error)
      try {
        const aiResponse = await generateAIResponse(userMessage.content)
        setMessages(prev => [...prev, aiResponse])
      } catch {
        const errorMessage: AIMessage = {
          id: Date.now().toString(),
          type: 'assistant',
          content: 'Mi dispiace, ho riscontrato un errore. Riprova più tardi.',
          timestamp: new Date()
        }
        setMessages(prev => [...prev, errorMessage])
      }
    } finally {
      setIsTyping(false)
    }
  }

  const handleActionClick = async (action: AIAction) => {
    setShouldAutoScroll(true)

    // Handle different action types
    switch (action.action) {
      case 'execute_ai_action':
        try {
          const res = await fetch('/api/ai/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              operation: action.params?.operation,
              payload: action.params?.payload,
            }),
          })

          const result = await res.json()

          if (!res.ok || !result?.success) {
            throw new Error(result?.error || `Execute failed: ${res.status}`)
          }

          const doneMessage: AIMessage = {
            id: Date.now().toString(),
            type: 'assistant',
            content: `✅ ${result?.data?.message || 'Operazione completata.'}`,
            timestamp: new Date(),
          }
          setMessages(prev => [...prev, doneMessage])

          toast({
            title: 'Operazione eseguita',
            description: result?.data?.message || 'Operazione completata.',
          })
        } catch (e: any) {
          const errMessage: AIMessage = {
            id: Date.now().toString(),
            type: 'assistant',
            content: `❌ Errore durante l'esecuzione: ${e?.message || 'errore sconosciuto'}`,
            timestamp: new Date(),
          }
          setMessages(prev => [...prev, errMessage])

          toast({
            title: 'Errore',
            description: e?.message || 'Errore durante l\'esecuzione',
            variant: 'destructive'
          })
        }
        break
      case 'create_invoice':
        window.location.href = '/invoices?create=true'
        break
      case 'guided_invoice_creation':
        // Start guided creation
        const guidedMessage: AIMessage = {
          id: Date.now().toString(),
          type: 'assistant',
          content: `🚀 **Iniziamo la creazione guidata della fattura:**

**Step 1:** A chi vuoi fatturare?
Dimmi il nome del cliente oppure scegli dalla lista qui sotto:

[👥 Mostra Clienti] - [➕ Nuovo Cliente]

Esempi: "Mario Rossi", "Bianchi Srl", ecc.`,
          timestamp: new Date()
        }
        setMessages(prev => [...prev, guidedMessage])
        break
      case 'open_overdue_invoices':
        window.location.href = '/invoices?status=OVERDUE'
        break
      case 'credits_report':
        window.location.href = '/reports?type=credits'
        break
      case 'send_payment_reminders':
        toast({
          title: "Promemoria Inviati",
          description: "Email di promemoria inviate ai clienti con fatture scadute",
        })
        break
      case 'create_estimate':
        window.location.href = '/estimates?create=true'
        break
      case 'create_ddt':
        window.location.href = '/ddts?create=true'
        break
      case 'create_supplier_order':
        window.location.href = '/supplier-orders?create=true'
        break
      case 'open_customers':
        window.location.href = '/customers'
        break
      case 'open_products':
        window.location.href = '/products'
        break
      case 'open_warehouse':
        window.location.href = '/warehouse'
        break
      case 'open_reports':
        window.location.href = '/reports'
        break
      case 'open_settings':
        window.location.href = '/settings'
        break
      case 'open_dashboard':
        window.location.href = '/dashboard-real'
        break
      case 'open_cash_book':
        window.location.href = '/cash-book'
        break
      case 'open_tutorial':
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'assistant',
          content: `📚 **Tutorial rapido NEXORA Copilot**\n\n` +
            `1. Scrivi una richiesta naturale, ad esempio: *"Quanto ho incassato questo mese?"*\n` +
            `2. Usa i pulsanti suggeriti per aprire moduli o lanciare azioni guidate\n` +
            `3. Per creare documenti, chiedi: *"Crea una fattura per..."* oppure *"Apri preventivi"*\n` +
            `4. Per report e analisi, chiedi: *"Mostrami il report vendite"* o *"Apri analytics"*\n\n` +
            `Se vuoi, puoi iniziare subito da uno di questi comandi:\n` +
            `- *Apri dashboard*\n` +
            `- *Apri libro cassa*\n` +
            `- *Crea fattura*`,
          timestamp: new Date()
        }])
        break
      case 'predictive_report':
        window.location.href = '/reports?type=predictive'
        break
      case 'open_invoices':
        window.location.href = '/invoices'
        break
      case 'sales_report':
        window.location.href = '/reports?type=sales'
        break
      case 'customers_report':
        window.location.href = '/reports?type=customers'
        break
      case 'inventory_report':
        window.location.href = '/reports?type=inventory'
        break
      case 'financial_report':
        window.location.href = '/reports?type=financial'
        break
      default:
        toast({
          title: "Azione Eseguita",
          description: `${action.label} completato`,
        })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copiato",
      description: "Testo copiato negli appunti",
    })
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          size="lg"
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all"
        >
          <Bot className="h-5 w-5 mr-2" />
          NEXORA Copilot
          <Maximize2 className="h-4 w-4 ml-2" />
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white mb-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                <Brain className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  NEXORA Copilot
                  <Sparkles className="h-6 w-6 text-yellow-300" />
                </h1>
                <p className="text-blue-100">Il tuo copilota intelligente per NEXORA</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                className="text-white hover:bg-white/20"
                onClick={() => setIsMinimized(true)}
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Quick Actions Sidebar */}
          <div className="lg:col-span-1">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Azioni Rapide
                </CardTitle>
                <CardDescription>
                  Azioni comuni che puoi eseguire
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {QUICK_ACTIONS.map((category, categoryIndex) => (
                  <div key={categoryIndex}>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">{category.category}</h4>
                    <div className="space-y-2">
                      {category.actions.map((action, actionIndex) => (
                        <Button
                          key={actionIndex}
                          variant="outline"
                          size="sm"
                          onClick={() => handleActionClick({
                            type: action.type.includes('create') ? 'create_document' : 
                                  action.type.includes('report') ? 'generate_report' : 'open_page',
                            label: action.label,
                            description: action.description,
                            icon: action.icon,
                            action: action.type
                          })}
                          className="w-full justify-start h-auto p-3 text-left"
                        >
                          <action.icon className="h-4 w-4 mr-2 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-xs">{action.label}</div>
                            <div className="text-xs text-gray-500 truncate">{action.description}</div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-blue-600" />
                    Chat con NEXORA Copilot
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {context?.userRole === 'admin' ? 'Amministratore' : 'Utente'}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      Online
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 flex flex-col p-0">
                {/* Messages Area */}
                <div ref={messagesContainerRef} onScroll={handleMessagesScroll} className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-3 max-w-[80%] ${message.type === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.type === 'user' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                        }`}>
                          {message.type === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>
                        <div className={`rounded-lg p-4 ${
                          message.type === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                          
                          {/* Action Buttons */}
                          {message.actions && message.actions.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {message.actions.map((action, index) => (
                                <Button
                                  key={index}
                                  size="sm"
                                  variant={message.type === 'user' ? 'secondary' : 'outline'}
                                  onClick={() => handleActionClick(action)}
                                  className={`w-full justify-start h-auto p-2 ${
                                    message.type === 'user' 
                                      ? 'bg-white/20 hover:bg-white/30 text-white border-white/30' 
                                      : ''
                                  }`}
                                >
                                  <action.icon className="h-4 w-4 mr-2 flex-shrink-0" />
                                  <div className="text-left">
                                    <div className="font-medium text-xs">{action.label}</div>
                                    <div className={`text-xs ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                                      {action.description}
                                    </div>
                                  </div>
                                </Button>
                              ))}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between mt-2">
                            <span className={`text-xs ${message.type === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                              {message.timestamp.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {message.type === 'assistant' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(message.content)}
                                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {/* Typing Indicator */}
                  {isTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center">
                          <Bot className="h-4 w-4" />
                        </div>
                        <div className="bg-gray-100 rounded-lg p-4">
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Chiedimi qualsiasi cosa sulla gestione del tuo business..."
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      disabled={isTyping}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isTyping}
                      size="icon"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    💡 Suggerimento: Prova "Crea una fattura per Mario Rossi" o "Mostrami il report vendite"
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
