import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiResponse, authenticate, authorize } from '@/lib/api-enterprise'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const authHeader = request.headers.get('authorization')
    let tenantId = searchParams.get('tenantId') || 'demo-tenant'

    if (authHeader?.startsWith('Bearer ')) {
      const user = await authenticate(request)
      if (!authorize(user, 'PRODUCT_READ')) {
        return ApiResponse.error('Unauthorized', 403)
      }
      tenantId = user.tenantId
    }

    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: any = { tenantId }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { vatNumber: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit
      }),
      prisma.supplier.count({ where })
    ])

    return NextResponse.json({
      success: true,
      data: {
        suppliers,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) }
      }
    })
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch suppliers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenantId = 'demo-tenant', name, email, phone, address, city, postalCode, country, vatNumber, fiscalCode, contactName, province, notes } = body

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      )
    }

    const supplier = await prisma.supplier.create({
      data: {
        tenantId,
        name,
        email: email || undefined,
        phone: phone || undefined,
        address: address || undefined,
        city: city || undefined,
        postalCode: postalCode || undefined,
        country: country || undefined,
        vatNumber: vatNumber || undefined,
        fiscalCode: fiscalCode || undefined,
        contactName: contactName || undefined,
        province: province || undefined,
        notes: notes || undefined,
      }
    })

    return NextResponse.json({ success: true, data: supplier })
  } catch (error) {
    console.error('Error creating supplier:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create supplier' },
      { status: 500 }
    )
  }
}
