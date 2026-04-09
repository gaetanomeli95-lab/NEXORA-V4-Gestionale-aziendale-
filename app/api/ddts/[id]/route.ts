import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-tenant'

    const ddt = await prisma.ddt.findFirst({
      where: { id: params.id, tenantId },
      include: { customer: true }
    })

    if (!ddt) {
      return NextResponse.json({ success: false, error: 'DDT non trovato' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: ddt })
  } catch (error) {
    console.error('Error fetching DDT:', error)
    return NextResponse.json({ success: false, error: 'Errore server' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-tenant'

    const existing = await prisma.ddt.findFirst({
      where: { id: params.id, tenantId }
    })

    if (!existing) {
      return NextResponse.json({ success: false, error: 'DDT non trovato' }, { status: 404 })
    }

    await prisma.ddt.delete({ where: { id: params.id } })

    return NextResponse.json({ success: true, message: 'DDT eliminato' })
  } catch (error) {
    console.error('Error deleting DDT:', error)
    return NextResponse.json({ success: false, error: 'Errore server' }, { status: 500 })
  }
}
