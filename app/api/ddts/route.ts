import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ApiResponse, authenticate, authorize } from '@/lib/api-enterprise'
import { parseDateTimeInput } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const authHeader = request.headers.get('authorization')
    let tenantId = searchParams.get('tenantId') || 'demo-tenant'

    if (authHeader?.startsWith('Bearer ')) {
      const user = await authenticate(request)
      if (!authorize(user, 'INVOICE_READ')) {
        return ApiResponse.error('Unauthorized', 403)
      }
      tenantId = user.tenantId
    }

    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit
    const sortBy = searchParams.get('sortBy') || 'issueDate'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const where: any = { tenantId }

    if (search) {
      where.OR = [
        { number: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
        { referenceNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ]
    }

    const orderBy: any = {}
    if (['number', 'issueDate', 'createdAt'].includes(sortBy)) {
      orderBy[sortBy] = sortOrder
    } else {
      orderBy.issueDate = 'desc'
    }

    const [ddts, total] = await Promise.all([
      prisma.ddt.findMany({
        where,
        include: {
          customer: {
            select: { id: true, name: true, email: true, phone: true, address: true, city: true }
          },
          estimate: {
            select: { id: true, number: true }
          },
          invoice: {
            select: { id: true, number: true }
          }
        },
        orderBy,
        skip,
        take: limit
      }),
      prisma.ddt.count({ where })
    ])

    // Parse itemsPayload for each DDT
    const normalizedDdts = ddts.map((ddt) => ({
      ...ddt,
      items: ddt.itemsPayload ? JSON.parse(ddt.itemsPayload) : []
    }))

    return NextResponse.json({
      success: true,
      data: {
        ddts: normalizedDdts,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error('Error fetching DDTs:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch DDTs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      tenantId = 'demo-tenant',
      customerId,
      number,
      issueDate,
      transportMethod,
      referenceNumber,
      estimateId,
      invoiceId,
      items = [],
      notes
    } = body

    if (!number) {
      return NextResponse.json(
        { success: false, error: 'DDT number is required' },
        { status: 400 }
      )
    }

    const existing = await prisma.ddt.findFirst({
      where: { tenantId, number }
    })
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'DDT number already exists' },
        { status: 400 }
      )
    }

    const ddt = await prisma.ddt.create({
      data: {
        tenantId,
        customerId: customerId || undefined,
        number,
        issueDate: parseDateTimeInput(issueDate) || new Date(),
        transportMethod: transportMethod || undefined,
        referenceNumber: referenceNumber || undefined,
        estimateId: estimateId || undefined,
        invoiceId: invoiceId || undefined,
        itemsPayload: JSON.stringify(items),
        notes: notes || undefined
      },
      include: {
        customer: { select: { id: true, name: true } }
      }
    })

    return NextResponse.json({
      success: true,
      data: { ...ddt, items }
    })
  } catch (error) {
    console.error('Error creating DDT:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create DDT' },
      { status: 500 }
    )
  }
}
