import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseDateTimeInput } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId') || 'demo-tenant'
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const paymentStatus = searchParams.get('paymentStatus') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    const where: any = { tenantId }
    if (status) where.status = status
    if (paymentStatus) where.paymentStatus = paymentStatus
    if (search) {
      where.OR = [
        { number: { contains: search } },
        { description: { contains: search } },
        { brand: { contains: search } },
        { model: { contains: search } },
        { serialNumber: { contains: search } },
        { customer: { name: { contains: search } } }
      ]
    }

    const [repairs, total] = await Promise.all([
      prisma.repair.findMany({
        where,
        include: { customer: { select: { id: true, name: true, email: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.repair.count({ where })
    ])

    const stats = await prisma.repair.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: true
    })

    return NextResponse.json({ success: true, data: { repairs, total, stats } })
  } catch (error) {
    console.error('Error fetching repairs:', error)
    return NextResponse.json({ success: false, error: 'Errore server' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-tenant'
    const body = await request.json()

    // Auto-generate repair number
    const year = new Date().getFullYear()
    const lastRepair = await prisma.repair.findFirst({
      where: { tenantId, number: { startsWith: `RIP-${year}` } },
      orderBy: { number: 'desc' }
    })
    let nextNum = 1
    if (lastRepair?.number) {
      const match = lastRepair.number.match(/(\d+)$/)
      if (match) nextNum = parseInt(match[1]) + 1
    }
    const number = body.number || `RIP-${year}-${String(nextNum).padStart(3, '0')}`

    const totalAmount = parseFloat(body.totalAmount) || 0
    const depositAmount = parseFloat(body.depositAmount) || 0
    const paidAmount = parseFloat(body.paidAmount) || 0
    const balanceAmount = Math.max(0, totalAmount - paidAmount - depositAmount)

    const repair = await prisma.repair.create({
      data: {
        tenantId,
        number,
        customerId: body.customerId || null,
        repairDate: parseDateTimeInput(body.repairDate) || new Date(),
        deliveryDate: parseDateTimeInput(body.deliveryDate) || null,
        status: body.status || 'IN LAVORAZIONE',
        paymentStatus: body.paymentStatus || 'NON PAGATO',
        description: body.description || null,
        brand: body.brand || null,
        model: body.model || null,
        serialNumber: body.serialNumber || null,
        itemsPayload: body.itemsPayload || null,
        subtotal: totalAmount,
        depositAmount,
        paidAmount,
        totalAmount,
        balanceAmount,
        notes: body.notes || null,
        internalNotes: body.internalNotes || null,
      },
      include: { customer: true }
    })

    return NextResponse.json({ success: true, data: repair })
  } catch (error) {
    console.error('Error creating repair:', error)
    return NextResponse.json({ success: false, error: 'Errore creazione riparazione' }, { status: 500 })
  }
}

