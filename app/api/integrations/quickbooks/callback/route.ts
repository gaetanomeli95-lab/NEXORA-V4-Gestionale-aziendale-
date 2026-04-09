import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse } from '@/lib/api-enterprise'
import { QuickBooksIntegration } from '@/lib/integrations/quickbooks'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const realmId = searchParams.get('realmId')
    const state = searchParams.get('state')

    if (!code || !realmId) {
      return NextResponse.redirect('/integrations?error=missing_params')
    }

    const integration = new QuickBooksIntegration({
      clientId: process.env.QUICKBOOKS_CLIENT_ID!,
      clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET!,
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
    })

    await integration.exchangeCodeForTokens(code, realmId)
    
    // Test connection
    const isConnected = await integration.testConnection()
    
    if (isConnected) {
      // Store tokens securely (in a real implementation, use database)
      // For now, we'll just redirect with success
      return NextResponse.redirect('/integrations?quickbooks=connected')
    } else {
      return NextResponse.redirect('/integrations?quickbooks=error')
    }
  } catch (error) {
    console.error('Error in QuickBooks callback:', error)
    return NextResponse.redirect('/integrations?quickbooks=error')
  }
}
