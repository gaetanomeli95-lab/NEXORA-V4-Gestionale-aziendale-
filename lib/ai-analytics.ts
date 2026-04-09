export interface AISuggestion {
  type: 'CROSS_SELL' | 'UPSELL' | 'PRICING' | 'INVENTORY' | 'MARKETING' | 'FINANCIAL'
  title: string
  description: string
  impact: 'HIGH' | 'MEDIUM' | 'LOW'
  confidence: number // 0-100
  actionItems: string[]
  data?: any
  projectedROI?: number
}

export interface CustomerSegment {
  id: string
  name: string
  description: string
  customerCount: number
  avgOrderValue: number
  totalRevenue: number
  characteristics: string[]
  recommendations: string[]
}

export interface ForecastData {
  period: string
  actual?: number
  forecast: number
  confidence: number
  factors: string[]
}

export class AIAnalytics {
  // Customer Segmentation
  async analyzeCustomerSegments(customers: any[]): Promise<CustomerSegment[]> {
    // Mock AI segmentation - in production, use ML models
    const segments: CustomerSegment[] = [
      {
        id: 'high_value',
        name: 'Clienti High Value',
        description: 'Clienti con alto valore ordine e frequenza elevata',
        customerCount: customers.filter(c => c.totalRevenue > 1000).length,
        avgOrderValue: 850,
        totalRevenue: customers.filter(c => c.totalRevenue > 1000).reduce((sum, c) => sum + c.totalRevenue, 0),
        characteristics: [
          'Ordini frequenti',
          'Valore medio alto',
          'Fidelizzazione elevata',
          'Bassa sensibilità prezzo'
        ],
        recommendations: [
          'Programma VIP esclusivo',
          'Offerte personalizzate premium',
          'Accesso anticipato nuovi prodotti',
          'Servizi dedicati'
        ]
      },
      {
        id: 'growth_potential',
        name: 'Potenziale Crescita',
        description: 'Clienti con potenziale di aumento valore',
        customerCount: customers.filter(c => c.totalRevenue > 500 && c.totalRevenue <= 1000).length,
        avgOrderValue: 450,
        totalRevenue: customers.filter(c => c.totalRevenue > 500 && c.totalRevenue <= 1000).reduce((sum, c) => sum + c.totalRevenue, 0),
        characteristics: [
          'Frequenza moderata',
          'Valore medio',
          'Sensibilità prezzo media',
          'Potenziale upsell'
        ],
        recommendations: [
          'Cross-selling strategico',
          'Programmi fedeltà',
          'Bundle prodotti',
          'Email marketing personalizzato'
        ]
      },
      {
        id: 'at_risk',
        name: 'Clienti a Rischio',
        description: 'Clienti con rischio di abbandono',
        customerCount: customers.filter(c => c.lastOrderDate && new Date(c.lastOrderDate).getTime() < Date.now() - 90 * 24 * 60 * 60 * 1000).length,
        avgOrderValue: 200,
        totalRevenue: customers.filter(c => c.lastOrderDate && new Date(c.lastOrderDate).getTime() < Date.now() - 90 * 24 * 60 * 60 * 1000).reduce((sum, c) => sum + c.totalRevenue, 0),
        characteristics: [
          'Bassa frequenza',
          'Ordini irregolari',
          'Alta sensibilità prezzo',
          'Rischio churn elevato'
        ],
        recommendations: [
          'Campagne re-engagement',
          'Offerte speciali',
          'Survey soddisfazione',
          'Servizio clienti proattivo'
        ]
      }
    ]

    return segments
  }

  // Revenue Forecasting
  async generateRevenueForecast(historicalData: any[]): Promise<ForecastData[]> {
    // Mock AI forecasting - in production, use time series models
    const forecast: ForecastData[] = []
    const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu']
    
    for (let i = 0; i < 6; i++) {
      const baseRevenue = 3000 + Math.random() * 2000
      const growthFactor = 1 + (i * 0.05) // 5% growth per month
      const seasonalFactor = 0.8 + Math.random() * 0.4 // Seasonal variation
      
      forecast.push({
        period: months[i],
        actual: i < 2 ? baseRevenue * growthFactor * seasonalFactor : undefined,
        forecast: baseRevenue * growthFactor * seasonalFactor,
        confidence: 85 - (i * 5), // Decreasing confidence over time
        factors: [
          'Stagionalità',
          'Trend storico',
          'Campagne marketing',
          'Condizioni di mercato'
        ]
      })
    }

    return forecast
  }

  // Product Recommendations
  async generateProductInsights(products: any[], orders: any[]): Promise<AISuggestion[]> {
    const suggestions: AISuggestion[] = []

    // Cross-sell opportunities
    const frequentlyBoughtTogether = this.analyzeFrequentlyBoughtTogether(orders)
    frequentlyBoughtTogether.forEach((combo, index) => {
      suggestions.push({
        type: 'CROSS_SELL',
        title: `Cross-sell: ${combo.product1} + ${combo.product2}`,
        description: `Questi prodotti sono spesso acquistati insieme. Considera un bundle.`,
        impact: 'HIGH',
        confidence: 85,
        actionItems: [
          `Crea bundle ${combo.product1} + ${combo.product2}`,
          'Offerta sconto 10% per acquisto combinato',
          'Posizionamento strategico nel catalogo'
        ],
        projectedROI: 25
      })
    })

    // Inventory optimization
    const lowStockProducts = products.filter(p => p.stockQuantity < p.minStockLevel)
    lowStockProducts.forEach(product => {
      suggestions.push({
        type: 'INVENTORY',
        title: `Riassortimento urgente: ${product.name}`,
        description: `Scorte attuali: ${product.stockQuantity}, Minimo: ${product.minStockLevel}`,
        impact: 'HIGH',
        confidence: 95,
        actionItems: [
          'Ordina riassortimento immediato',
          'Imposta alert automatici',
          'Analizza cause esaurimento'
        ],
        projectedROI: 15
      })
    })

    // Pricing optimization
    const highMarginProducts = products.filter(p => (p.unitPrice - (p.costPrice || 0)) / p.unitPrice > 0.5)
    highMarginProducts.forEach(product => {
      const marginPercentage = Math.round((((product.unitPrice - (product.costPrice || 0)) / product.unitPrice) || 0) * 100)

      suggestions.push({
        type: 'PRICING',
        title: `Ottimizzazione prezzo: ${product.name}`,
        description: `Margine elevato (${marginPercentage}%). Considera aumento prezzo.`,
        impact: 'MEDIUM',
        confidence: 70,
        actionItems: [
          'Test aumento del 5-10%',
          'Monitora impatto vendite',
          'Analisi prezzo concorrenza'
        ],
        projectedROI: 20
      })
    })

    return suggestions
  }

  // Churn Prediction
  async predictCustomerChurn(customers: any[]): Promise<{ customerId: string; risk: number; factors: string[] }[]> {
    return customers.map(customer => {
      const daysSinceLastOrder = customer.lastOrderDate 
        ? Math.floor((Date.now() - new Date(customer.lastOrderDate).getTime()) / (1000 * 60 * 60 * 24))
        : 999

      let risk = 0
      const factors: string[] = []

      // Risk factors
      if (daysSinceLastOrder > 90) {
        risk += 30
        factors.push('Nessun ordine negli ultimi 90 giorni')
      }
      if (daysSinceLastOrder > 60) {
        risk += 20
        factors.push('Bassa frequenza ordini')
      }
      if (customer.avgOrderValue < 100) {
        risk += 15
        factors.push('Valore ordine basso')
      }
      if (customer.totalOrders < 3) {
        risk += 25
        factors.push('Pochi ordini storici')
      }

      return {
        customerId: customer.id,
        risk: Math.min(risk, 100),
        factors
      }
    }).sort((a, b) => b.risk - a.risk)
  }

  // Marketing Campaign Optimization
  async optimizeMarketingCampaigns(campaigns: any[]): Promise<AISuggestion[]> {
    const suggestions: AISuggestion[] = []

    campaigns.forEach(campaign => {
      if (campaign.conversionRate < 0.02) {
        suggestions.push({
          type: 'MARKETING',
          title: `Ottimizza campagna: ${campaign.name}`,
          description: `Tasso conversione basso: ${(campaign.conversionRate * 100).toFixed(2)}%`,
          impact: 'HIGH',
          confidence: 80,
          actionItems: [
            'Test A/B subject email',
            'Segmentazione target più precisa',
            'Personalizzazione contenuto',
            'Ottimizzazione call-to-action'
          ],
          projectedROI: 35
        })
      }

      if (campaign.roi < 1) {
        suggestions.push({
          type: 'MARKETING',
          title: `ROI negativo campagna: ${campaign.name}`,
          description: `ROI attuale: ${campaign.roi.toFixed(2)}`,
          impact: 'HIGH',
          confidence: 90,
          actionItems: [
            'Rivaluta budget allocation',
            'Analizza canali performance',
            'Migliora targeting',
            'Considera pausa campagna'
          ],
          projectedROI: 50
        })
      }
    })

    return suggestions
  }

  // Financial Health Analysis
  async analyzeFinancialHealth(financialData: any): Promise<AISuggestion[]> {
    const suggestions: AISuggestion[] = []

    // Cash flow analysis
    if (financialData.cashFlow < 0) {
      suggestions.push({
        type: 'FINANCIAL',
        title: 'Cash Flow Negativo',
        description: `Cash flow attuale: €${financialData.cashFlow.toFixed(2)}`,
        impact: 'HIGH',
        confidence: 95,
        actionItems: [
          'Accelera incassi fatture',
          'Rinegozia termini pagamento fornitori',
          'Considera finanziamento a breve termine',
          'Riduci spese non essenziali'
        ],
        projectedROI: 40
      })
    }

    // Profit margin analysis
    const profitMargin = financialData.totalRevenue > 0 
      ? (financialData.netProfit / financialData.totalRevenue) * 100 
      : 0

    if (profitMargin < 10) {
      suggestions.push({
        type: 'FINANCIAL',
        title: 'Margine Profitto Bass',
        description: `Margine attuale: ${profitMargin.toFixed(2)}%`,
        impact: 'MEDIUM',
        confidence: 85,
        actionItems: [
          'Analizza costi fissi',
          'Ottimizza pricing strategico',
          'Migliora efficienza operativa',
          'Focus prodotti high-margin'
        ],
        projectedROI: 30
      })
    }

    return suggestions
  }

  // Helper method for analyzing frequently bought together products
  private analyzeFrequentlyBoughtTogether(orders: any[]): Array<{ product1: string; product2: string; frequency: number }> {
    // Mock implementation - in production, use association rule mining
    return [
      { product1: 'Laptop Pro', product2: 'Mouse Wireless', frequency: 85 },
      { product1: 'Smartphone X', product2: 'Case Premium', frequency: 72 },
      { product1: 'Tablet Pro', product2: 'Keyboard Bluetooth', frequency: 68 }
    ]
  }

  // Generate comprehensive AI insights report
  async generateInsightsReport(data: {
    customers: any[]
    products: any[]
    orders: any[]
    financials: any
    campaigns: any[]
  }): Promise<{
    customerSegments: CustomerSegment[]
    revenueForecast: ForecastData[]
    suggestions: AISuggestion[]
    churnRisk: { customerId: string; risk: number; factors: string[] }[]
  }> {
    const [
      customerSegments,
      revenueForecast,
      productInsights,
      churnRisk,
      marketingInsights,
      financialInsights
    ] = await Promise.all([
      this.analyzeCustomerSegments(data.customers),
      this.generateRevenueForecast(data.orders),
      this.generateProductInsights(data.products, data.orders),
      this.predictCustomerChurn(data.customers),
      this.optimizeMarketingCampaigns(data.campaigns),
      this.analyzeFinancialHealth(data.financials)
    ])

    const allSuggestions = [
      ...productInsights,
      ...marketingInsights,
      ...financialInsights
    ].sort((a, b) => {
      // Sort by impact and confidence
      const impactWeight = { HIGH: 3, MEDIUM: 2, LOW: 1 }
      const scoreA = impactWeight[a.impact] * a.confidence
      const scoreB = impactWeight[b.impact] * b.confidence
      return scoreB - scoreA
    })

    return {
      customerSegments,
      revenueForecast,
      suggestions: allSuggestions,
      churnRisk
    }
  }
}
