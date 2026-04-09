import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse, authenticate, authorize } from '@/lib/api-enterprise'
import { QuickBooksIntegration } from '@/lib/integrations/quickbooks'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!authorize(user, 'INTEGRATION_MANAGE')) {
      return ApiResponse.error('Unauthorized', 403)
    }

    const integration = new QuickBooksIntegration({
      clientId: process.env.QUICKBOOKS_CLIENT_ID!,
      clientSecret: process.env.QUICKBOOKS_CLIENT_SECRET!,
      environment: process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'
    })

    const { authUrl } = await integration.authenticate()
    
    return ApiResponse.success({ authUrl })
  } catch (error) {
    console.error('Error initiating QuickBooks auth:', error)
    return ApiResponse.error('Failed to initiate authentication', 500)
  }
}
