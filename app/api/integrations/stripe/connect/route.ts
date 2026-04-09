import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse, authenticate, authorize } from '@/lib/api-enterprise'
import { StripeIntegration } from '@/lib/integrations/stripe'

export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!authorize(user, 'INTEGRATION_MANAGE')) {
      return ApiResponse.error('Unauthorized', 403)
    }

    const body = await request.json()
    const { apiKey, webhookSecret } = body

    if (!apiKey) {
      return ApiResponse.error('API key is required', 400)
    }

    const integration = new StripeIntegration({
      apiKey,
      webhookSecret
    })

    // Test connection
    const isConnected = await integration.testConnection()
    
    if (isConnected) {
      // Store keys securely (in a real implementation, use database with encryption)
      // For now, we'll just return success
      return ApiResponse.success({ 
        message: 'Stripe connected successfully',
        accountId: 'acct_test_placeholder' // In real implementation, get from Stripe
      })
    } else {
      return ApiResponse.error('Failed to connect to Stripe', 400)
    }
  } catch (error) {
    console.error('Error connecting to Stripe:', error)
    return ApiResponse.error('Failed to connect to Stripe', 500)
  }
}
