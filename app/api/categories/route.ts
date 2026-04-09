import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId') || 'demo-tenant'

    const categories = await prisma.productCategory.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ success: true, data: categories })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch categories' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-tenant'
    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ success: false, error: 'Il nome è obbligatorio' }, { status: 400 })
    }

    const existing = await prisma.productCategory.findFirst({
      where: { tenantId, name }
    })

    if (existing) {
      return NextResponse.json({ success: false, error: 'Categoria già esistente' }, { status: 400 })
    }

    const category = await prisma.productCategory.create({
      data: {
        tenantId,
        name,
        description
      }
    })

    return NextResponse.json({ success: true, data: category })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json({ success: false, error: 'Failed to create category' }, { status: 500 })
  }
}
