import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse, authenticate, authorize } from '@/lib/api-enterprise'
import { MultiTenantManager } from '@/lib/multi-tenant'

const tenantManager = MultiTenantManager.getInstance()

export async function GET(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!authorize(user, 'TENANT_MANAGE')) {
      return ApiResponse.error('Unauthorized', 403)
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const plan = searchParams.get('plan')

    let tenants = tenantManager.getAllTenants()

    // Apply filters
    if (status && status !== 'all') {
      tenants = tenants.filter(t => t.status === status)
    }

    if (plan && plan !== 'all') {
      tenants = tenants.filter(t => t.subscription.plan === plan)
    }

    return ApiResponse.success(tenants)
  } catch (error) {
    console.error('Error fetching tenants:', error)
    return ApiResponse.error('Failed to fetch tenants', 500)
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await authenticate(request)
    if (!authorize(user, 'TENANT_CREATE')) {
      return ApiResponse.error('Unauthorized', 403)
    }

    const body = await request.json()
    const { name, domain, subscriptionPlan, settings, billing } = body

    // Validate required fields
    if (!name) {
      return ApiResponse.error('Tenant name is required', 400)
    }

    const tenant = await tenantManager.createTenant({
      name,
      domain,
      status: 'ACTIVE',
      subscription: {
        plan: subscriptionPlan || 'STARTER',
        status: 'ACTIVE',
        startDate: new Date(),
        features: tenantManager.getPlanFeatures(subscriptionPlan || 'STARTER'),
        limits: tenantManager.getPlanLimits(subscriptionPlan || 'STARTER')
      },
      settings: {
        timezone: settings?.timezone || 'Europe/Rome',
        currency: settings?.currency || 'EUR',
        language: settings?.language || 'it',
        dateFormat: settings?.dateFormat || 'DD/MM/YYYY',
        numberFormat: settings?.numberFormat || 'it-IT',
        theme: settings?.theme || 'light',
        customBranding: {
          primaryColor: settings?.customBranding?.primaryColor || '#2563eb',
          secondaryColor: settings?.customBranding?.secondaryColor || '#64748b',
          logo: settings?.customBranding?.logo,
          favicon: settings?.customBranding?.favicon
        }
      },
      integrations: {},
      billing: {
        address: billing?.address || '',
        city: billing?.city || '',
        postalCode: billing?.postalCode || '',
        country: billing?.country || 'IT',
        vatNumber: billing?.vatNumber,
        paymentMethod: billing?.paymentMethod || 'CREDIT_CARD',
        invoices: []
      }
    })

    return ApiResponse.success(tenant)
  } catch (error) {
    console.error('Error creating tenant:', error)
    return ApiResponse.error('Failed to create tenant', 500)
  }
}
