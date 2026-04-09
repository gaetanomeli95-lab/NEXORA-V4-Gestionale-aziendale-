import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { prisma } from '@/lib/prisma'

const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || ''
const isGeminiKey = apiKey.startsWith('AIza')

// Inizializza Google Gemini client se disponibile
const genAI = isGeminiKey ? new GoogleGenerativeAI(apiKey) : null

// System prompt per l'AI assistant NEXORA
const SYSTEM_PROMPT = `Sei un assistente AI esperto per il software di gestione aziendale NEXORA V4. 

Il tuo scopo è:
1. Rispondere a domande su dati aziendali reali (fatturato, clienti, prodotti, magazzino, cassa)
2. Aiutare a creare documenti (fatture, preventivi, DDT, ordini)
3. Fornire analisi finanziarie e operative
4. Proporre azioni concrete quando appropriato

DATI AZIENDALI DISPONIBILI:
- Fatture: importi, stati, clienti
- Pagamenti: entrate, date, metodi
- Spese: uscite, categorie, fornitori  
- Ordini fornitori: costi merci
- Clienti: anagrafiche, stato
- Prodotti: stock, prezzi, categorie
- Preventivi: importi, conversioni
- Magazzino: quantità, valori

REGOLE IMPORTANTI:
- Usa SOLO dati reali dal database che ti fornirò qui di seguito.
- Se chiedi dati finanziari, calcola basandoti su Fatture + Pagamenti - Spese - OrdiniFornitori
- Per creare documenti, proponi sempre l'azione
- Sii preciso con i numeri e le date
- Formatta valute in EUR con formato italiano

Esempio risposta finanziaria:
"Fatturato totale: €15.234,50
Incassato: €12.100,00
Spese: €3.450,00
Costo merci: €8.200,00
Guadagno effettivo: €450,00"

Per azioni che modificano o creano dati (come creare un cliente), devi SEMPRE includere la stringa esatta "Vuoi che crei il cliente [Nome Cognome]?" oppure "Vuoi che crei la fattura?". Esempio: "Vuoi che crei il cliente Mario Rossi?"`

export async function callOpenAI(message: string, tenantId: string) {
  try {
    if (!message) {
      throw new Error('Message is required')
    }

    const isApiKeyValid = apiKey && apiKey !== 'your-openai-api-key-here' && apiKey.length > 20;

    // 1. Raccogli dati contestuali dal database
    const contextData = await gatherContextData(tenantId)

    if (isApiKeyValid && isGeminiKey && genAI) {
      try {
        // 2. Costruisci il context per l'AI
        const contextPrompt = buildContextPrompt(contextData)

        // 3. Chiama Google Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
        
        const fullPrompt = `${SYSTEM_PROMPT}\n\nCONTESTO DATI ATTUALI:\n${contextPrompt}\n\nRICHIESTA UTENTE:\n${message}`;
        
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const aiResponse = response.text();

        if (aiResponse) {
          return parseAIResponse(aiResponse)
        }
      } catch (geminiError) {
        console.error('Gemini API Error:', geminiError)
        // Fallback a regole
      }
    }

    // FALLBACK INTELLIGENTE SE API NON CONFIGURATA O FALLISCE
    return generateRuleBasedResponse(message, contextData)

  } catch (error: any) {
    console.error('AI API Wrapper Error:', error)
    
    // In caso di errore globale prova con il fallback
    try {
      const contextData = await gatherContextData(tenantId);
      return generateRuleBasedResponse(message, contextData);
    } catch (e) {
      return {
        content: 'Mi dispiace, sto avendo difficoltà con il servizio AI. Per favore riprova più tardi o contatta l\'assistenza.',
        actions: [],
        timestamp: new Date().toISOString()
      }
    }
  }
}

function generateRuleBasedResponse(message: string, contextData: any): { content: string; actions: any[], timestamp: string } {
  const lowerMessage = message.toLowerCase()
  
  // Intent detection
  const isCreateIntent = /\b(crea|nuovo|aggiungi|inserisci)\b/i.test(lowerMessage)
  const isAnalysisIntent = /\b(quanto|guadagnato|fatturato|incassato|speso|bilancio|cassa|profitto|andamento)\b/i.test(lowerMessage)

  let responseContent = ''
  let actions: any[] = []

  if (isCreateIntent) {
    if (/cliente/i.test(lowerMessage)) {
      const nameMatch = lowerMessage.match(/cliente\s+([a-z\s]+)/i)
      const customerName = nameMatch && nameMatch[1] ? nameMatch[1].trim() : 'Nuovo Cliente da AI'
      
      responseContent = `🧾 **Conferma richiesta**\nVuoi che crei nel database il cliente **${customerName}**?`
      actions = [
        {
          type: 'execute_task',
          label: 'Conferma creazione cliente',
          description: `Crea il cliente: ${customerName}`,
          icon: 'CheckCircle',
          action: 'execute_ai_action',
          params: {
            operation: 'create_customer',
            payload: { name: customerName }
          }
        }
      ]
    } else if (/fattura/i.test(lowerMessage)) {
      responseContent = `📄 **Creazione Fattura**\nPosso aiutarti a creare una nuova fattura. Specifica il cliente e gli articoli.`
      actions = [
        { type: 'open_page', label: 'Crea Fattura', description: 'Apri il form di creazione fattura', icon: 'FileText', action: 'create_invoice' }
      ]
    } else if (/preventivo/i.test(lowerMessage)) {
      responseContent = `📋 **Creazione Preventivo**\nVuoi creare un nuovo preventivo?`
      actions = [
        { type: 'open_page', label: 'Crea Preventivo', description: 'Apri il form di creazione preventivo', icon: 'FileText', action: 'create_estimate' }
      ]
    } else {
      responseContent = `🔧 **Creazione**\nCosa vuoi creare? (cliente, fattura, preventivo, ordine, etc.)`
      actions = [
        { type: 'open_page', label: 'Nuovo Cliente', description: 'Aggiungi cliente', icon: 'UserPlus', action: 'create_customer' },
        { type: 'open_page', label: 'Nuova Fattura', description: 'Emetti fattura', icon: 'FileText', action: 'create_invoice' },
        { type: 'open_page', label: 'Nuovo Preventivo', description: 'Crea preventivo', icon: 'FileText', action: 'create_estimate' }
      ]
    }
  } else if (isAnalysisIntent) {
    const f = contextData.financial;
    responseContent = `🧠 **Analisi Globale del Sistema (Modalità Fallback)**

💰 **FINANZA**
• **Fatturato totale**: €${f.totalRevenue.toFixed(2)}
• **Incassato**: €${f.totalPayments.toFixed(2)}
• **Spese operative**: €${f.totalExpenses.toFixed(2)}
• **Costo merci**: €${f.totalSupplierOrders.toFixed(2)}
• **Saldo cassa**: €${f.cashBalance.toFixed(2)}
• **Guadagno effettivo**: €${f.effectiveProfit.toFixed(2)}

Vuoi approfondire qualche area specifica?`

    actions = [
      { type: 'open_page', label: 'Vedi Libro Cassa', description: 'Tutti i movimenti', icon: 'BookOpen', action: 'open_cash_book' },
      { type: 'generate_report', label: 'Stampa Report PDF', description: 'Genera report completo', icon: 'Download', action: 'financial_report' }
    ]
  } else {
    // Intent: generico (saluti, ecc)
    responseContent = `🤖 **Assistente AI NEXORA V4**

Ciao! Sono il tuo assistente intelligente. 
*(Nota: Attualmente sto funzionando in modalità "offline intelligente" perché la chiave AI non è configurata o c'è un problema di connessione).*

Posso comunque aiutarti con:

💼 **ANALISI E REPORT**
• "Quanto ho guadagnato?" 

📋 **CREAZIONE DOCUMENTI**
• "Crea fattura"
• "Nuovo preventivo" 
• "Crea cliente Mario Rossi"

Chiedimi pure!`

    actions = [
      { type: 'open_page', label: 'Dashboard Finanziaria', description: 'Vedi dati economici', icon: 'TrendingUp', action: 'open_dashboard' },
      { type: 'open_page', label: 'Crea Documento', description: 'Nuova fattura', icon: 'PlusCircle', action: 'create_document' }
    ]
  }

  return {
    content: responseContent,
    actions,
    timestamp: new Date().toISOString()
  }
}

async function gatherContextData(tenantId: string) {
  try {
    const [
      invoicesStats,
      paymentsStats,
      expensesStats,
      supplierOrdersStats,
      customersCount,
      productsCount,
      estimatesCount
    ] = await Promise.all([
      // Statistiche fatture
      prisma.invoice.aggregate({
        where: { tenantId },
        _sum: { totalAmount: true },
        _count: true
      }),
      // Statistiche pagamenti
      prisma.payment.aggregate({
        where: { tenantId },
        _sum: { amount: true },
        _count: true
      }),
      // Statistiche spese
      prisma.expense.aggregate({
        where: { tenantId },
        _sum: { amount: true },
        _count: true
      }),
      // Statistiche ordini fornitori
      prisma.supplierOrder.aggregate({
        where: { tenantId },
        _sum: { totalAmount: true },
        _count: true
      }),
      // Conteggio clienti
      prisma.customer.count({
        where: { tenantId }
      }),
      // Conteggio prodotti
      prisma.product.count({
        where: { tenantId }
      }),
      // Conteggio preventivi
      prisma.estimate.count({
        where: { tenantId }
      })
    ])

    // Calcoli finanziari
    const totalRevenue = invoicesStats._sum.totalAmount || 0
    const totalPayments = paymentsStats._sum.amount || 0
    const totalExpenses = expensesStats._sum.amount || 0
    const totalSupplierOrders = supplierOrdersStats._sum.totalAmount || 0
    const cashBalance = totalPayments - totalExpenses - totalSupplierOrders
    const effectiveProfit = totalRevenue - totalExpenses - totalSupplierOrders

    return {
      financial: {
        totalRevenue,
        totalPayments,
        totalExpenses,
        totalSupplierOrders,
        cashBalance,
        effectiveProfit
      },
      counts: {
        invoices: invoicesStats._count,
        payments: paymentsStats._count,
        expenses: expensesStats._count,
        supplierOrders: supplierOrdersStats._count,
        customers: customersCount,
        products: productsCount,
        estimates: estimatesCount
      }
    }
  } catch (error) {
    console.error('Error gathering context data:', error)
    return {
      financial: { totalRevenue: 0, totalPayments: 0, totalExpenses: 0, totalSupplierOrders: 0, cashBalance: 0, effectiveProfit: 0 },
      counts: { invoices: 0, payments: 0, expenses: 0, supplierOrders: 0, customers: 0, products: 0, estimates: 0 }
    }
  }
}

function buildContextPrompt(data: any): string {
  const { financial, counts } = data
  
  return `DATI ATTUALI AZIENDA:

FINANZA:
- Fatturato totale: €${financial.totalRevenue.toFixed(2)}
- Incassato: €${financial.totalPayments.toFixed(2)}
- Spese: €${financial.totalExpenses.toFixed(2)}
- Costo merci: €${financial.totalSupplierOrders.toFixed(2)}
- Saldo cassa: €${financial.cashBalance.toFixed(2)}
- Guadagno effettivo: €${financial.effectiveProfit.toFixed(2)}

CONTATORI:
- Fatture: ${counts.invoices}
- Pagamenti: ${counts.payments}
- Spese: ${counts.expenses}
- Ordini fornitori: ${counts.supplierOrders}
- Clienti: ${counts.customers}
- Prodotti: ${counts.products}
- Preventivi: ${counts.estimates}

Usa questi dati per rispondere alle domande dell'utente. Se l'utente chiede numeri, usa quelli reali qui sopra.`
}

function parseAIResponse(aiResponse: string) {
  const actions: any[] = []

  // Rimuovi eventuali backticks o markdown che circondano il testo
  const cleanResponse = aiResponse.replace(/\*\*/g, '')

  // Pattern per riconoscere proposte di azione
  const createActionPattern = /Vuoi che (.+?)\?/i
  const match = cleanResponse.match(createActionPattern)

  if (match) {
    const proposedAction = match[1].toLowerCase()
    
    // Mappa azioni comuni a operazioni backend
    if (proposedAction.includes('cliente')) {
      // Estrai nome cliente se presente
      const nameMatch = cleanResponse.match(/cliente\s+([a-zA-Z\s\']+)/i)
      const customerName = nameMatch?.[1]?.trim() || 'Nuovo Cliente'
      
      actions.push({
        type: 'execute_task',
        label: 'Conferma creazione cliente',
        description: `Crea il cliente: ${customerName}`,
        icon: 'CheckCircle',
        action: 'execute_ai_action',
        params: {
          operation: 'create_customer',
          payload: { name: customerName }
        }
      })
    }

    if (proposedAction.includes('fattura')) {
      actions.push({
        type: 'open_page',
        label: 'Crea nuova fattura',
        description: 'Apri form fattura',
        icon: 'FileText',
        action: 'create_invoice'
      })
    }

    if (proposedAction.includes('preventivo')) {
      actions.push({
        type: 'open_page',
        label: 'Crea preventivo',
        description: 'Apri form preventivo',
        icon: 'FileText',
        action: 'create_estimate'
      })
    }
  }

  return {
    content: aiResponse,
    actions
  }
}
