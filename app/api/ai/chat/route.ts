import { NextRequest, NextResponse } from 'next/server'
import { callOpenAI } from '@/lib/ai/openai-client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, tenantId = 'demo-tenant' } = body

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Usa OpenAI per elaborare la richiesta
    const aiResponse = await callOpenAI(message, tenantId)

    return NextResponse.json({
      success: true,
      data: aiResponse
    })

  } catch (error: any) {
    console.error('AI Chat Error:', error)
    return NextResponse.json({ 
      error: 'Errore durante elaborazione richiesta AI',
      message: error.message 
    }, { status: 500 })
  }
}
