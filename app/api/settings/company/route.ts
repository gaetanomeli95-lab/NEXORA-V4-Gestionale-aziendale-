import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DEFAULT_TENANT_ID = 'demo-tenant'

function mapTenantToSettings(tenant: any) {
  return {
    name: tenant?.name || 'NEXORA v4 Enterprise',
    logo: tenant?.logo || '',
    address: tenant?.address || '',
    city: tenant?.city || '',
    postalCode: tenant?.postalCode || '',
    country: tenant?.country || 'Italy',
    phone: tenant?.phone || '',
    email: tenant?.email || '',
    vatNumber: tenant?.vatNumber || '',
    website: tenant?.website || ''
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId') || DEFAULT_TENANT_ID

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId }
    })

    return NextResponse.json({
      success: true,
      data: mapTenantToSettings(tenant)
    })
  } catch (error) {
    console.error('Error fetching company settings:', error)
    return NextResponse.json({ success: false, error: 'Errore server' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId') || DEFAULT_TENANT_ID
    const body = await request.json()

    const tenant = await prisma.tenant.upsert({
      where: { id: tenantId },
      update: {
        name: body.name || 'NEXORA v4 Enterprise',
        logo: body.logo || null,
        address: body.address || null,
        city: body.city || null,
        postalCode: body.postalCode || null,
        country: body.country || 'Italy',
        phone: body.phone || null,
        email: body.email || null,
        vatNumber: body.vatNumber || null,
        website: body.website || null
      },
      create: {
        id: tenantId,
        name: body.name || 'NEXORA v4 Enterprise',
        logo: body.logo || null,
        address: body.address || null,
        city: body.city || null,
        postalCode: body.postalCode || null,
        country: body.country || 'Italy',
        phone: body.phone || null,
        email: body.email || null,
        website: body.website || null,
        vatNumber: body.vatNumber || null
      }
    })

    return NextResponse.json({
      success: true,
      data: mapTenantToSettings(tenant)
    })
  } catch (error) {
    console.error('Error saving company settings:', error)
    return NextResponse.json({ success: false, error: 'Errore server' }, { status: 500 })
  }
}
