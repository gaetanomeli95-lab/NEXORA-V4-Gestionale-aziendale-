import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'
import { parseDateTimeInput } from '@/lib/utils'

export const dynamic = 'force-dynamic'

async function resolveTenantId(request: NextRequest) {
  const session = await getServerSession(authOptions)

  return (session?.user as { tenantId?: string } | undefined)?.tenantId ||
    request.headers.get('x-tenant-id') ||
    new URL(request.url).searchParams.get('tenantId') ||
    'demo-tenant'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = await resolveTenantId(request)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const category = searchParams.get('category')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const skip = (page - 1) * limit

    const where: any = { tenantId }
    if (startDate || endDate) {
      where.expenseDate = {}
      if (startDate) where.expenseDate.gte = new Date(startDate)
      if (endDate) where.expenseDate.lte = new Date(endDate + 'T23:59:59.999Z')
    }
    if (category && category !== 'all') where.category = category

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({ where, orderBy: { expenseDate: 'desc' }, skip, take: limit }),
      prisma.expense.count({ where })
    ])

    const categories = await prisma.expense.findMany({
      where: { tenantId },
      select: { category: true },
      distinct: ['category']
    })

    return NextResponse.json({
      success: true,
      data: expenses,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      categories: categories.map(c => c.category).filter(Boolean)
    })
  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json({ success: false, error: 'Errore server' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = await resolveTenantId(request)
    const body = await request.json()

    if (!body.amount || isNaN(parseFloat(body.amount))) {
      return NextResponse.json({ success: false, error: 'Importo non valido' }, { status: 400 })
    }

    const expense = await prisma.expense.create({
      data: {
        tenantId,
        category: body.category || 'Generale',
        description: body.description || '',
        amount: parseFloat(body.amount),
        paymentMethod: body.paymentMethod || 'CONTANTI',
        expenseDate: parseDateTimeInput(body.expenseDate) || new Date(),
        notes: body.notes || null
      }
    })

    return NextResponse.json({ success: true, data: expense }, { status: 201 })
  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json({ success: false, error: 'Errore server' }, { status: 500 })
  }
}

