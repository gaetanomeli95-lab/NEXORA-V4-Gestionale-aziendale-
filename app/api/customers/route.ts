import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const normalizeOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') {
    return undefined
  }

  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

const normalizeCustomerType = (value: unknown) => {
  if (typeof value !== 'string') {
    return 'COMPANY'
  }

  const normalized = value.trim().toUpperCase()
  if (['INDIVIDUAL', 'PRIVATE', 'PRIVATO'].includes(normalized)) {
    return 'INDIVIDUAL'
  }

  return 'COMPANY'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId') || 'demo-tenant'
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    // Build where clause
    const where: any = { tenantId, isActive: true }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { vatNumber: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Get customers with pagination
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          invoices: {
            select: {
              id: true,
              totalAmount: true,
              status: true,
              issueDate: true
            }
          }
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit
      }),
      prisma.customer.count({ where })
    ])

    // Calculate statistics
    const stats = await prisma.customer.aggregate({
      where: { tenantId, isActive: true },
      _count: true,
      _sum: {
        creditLimit: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        customers,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        stats: {
          totalCustomers: stats._count,
          totalCreditLimit: stats._sum.creditLimit || 0
        }
      }
    })
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const tenantId = normalizeOptionalString(body.tenantId) || 'demo-tenant'
    const type = normalizeCustomerType(body.type)
    const businessName = normalizeOptionalString(body.businessName)
    const legalName = normalizeOptionalString(body.legalName)
    const firstName = normalizeOptionalString(body.firstName)
    const lastName = normalizeOptionalString(body.lastName)
    const resolvedName = normalizeOptionalString(body.name)
      || businessName
      || legalName
      || [firstName, lastName].filter(Boolean).join(' ')

    if (!resolvedName) {
      return NextResponse.json(
        { success: false, error: 'Il nome cliente è obbligatorio' },
        { status: 400 }
      )
    }

    const email = normalizeOptionalString(body.email)
    const phone = normalizeOptionalString(body.phone)
    const mobile = normalizeOptionalString(body.mobile)
    const website = normalizeOptionalString(body.website)
    const address = normalizeOptionalString(body.address)
    const city = normalizeOptionalString(body.city)
    const province = normalizeOptionalString(body.province)
    const postalCode = normalizeOptionalString(body.postalCode)
    const country = normalizeOptionalString(body.country) || 'IT'
    const billingAddress = normalizeOptionalString(body.billingAddress)
    const shippingAddress = normalizeOptionalString(body.shippingAddress)
    const vatNumber = normalizeOptionalString(body.vatNumber)
    const fiscalCode = normalizeOptionalString(body.fiscalCode)
    const taxCode = normalizeOptionalString(body.taxCode)
    const sdiCode = normalizeOptionalString(body.sdiCode)
    const pecEmail = normalizeOptionalString(body.pecEmail)
    const paymentTerms = normalizeOptionalString(body.paymentTerms)
    const notes = normalizeOptionalString(body.notes)
    const creditLimit = typeof body.creditLimit === 'number'
      ? body.creditLimit
      : Number(body.creditLimit) || 0
    const sameAsBilling = typeof body.sameAsBilling === 'boolean' ? body.sameAsBilling : true
    const status = normalizeOptionalString(body.status) || 'ACTIVE'

    // Check if customer with same email or VAT already exists
    const duplicateFilters = []
    if (email) duplicateFilters.push({ email })
    if (vatNumber) duplicateFilters.push({ vatNumber })

    if (duplicateFilters.length > 0) {
      const existingCustomer = await prisma.customer.findFirst({
        where: { tenantId, OR: duplicateFilters }
      })
      if (existingCustomer) {
        return NextResponse.json(
          { success: false, error: 'Cliente con questa email o P.IVA già esistente' },
          { status: 400 }
        )
      }
    }

    const customer = await prisma.customer.create({
      data: {
        tenantId,
        type,
        name: resolvedName,
        businessName,
        legalName,
        firstName,
        lastName,
        email,
        phone,
        mobile,
        website,
        address,
        city,
        province,
        postalCode,
        country,
        billingAddress,
        shippingAddress,
        vatNumber,
        fiscalCode,
        taxCode,
        sdiCode,
        pecEmail,
        paymentTerms,
        notes,
        creditLimit,
        sameAsBilling,
        status
      }
    })

    return NextResponse.json({
      success: true,
      data: customer
    })
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create customer' },
      { status: 500 }
    )
  }
}
