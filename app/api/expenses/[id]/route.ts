import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

async function resolveTenantId(request: NextRequest) {
  const session = await getServerSession(authOptions)

  return (session?.user as { tenantId?: string } | undefined)?.tenantId ||
    request.headers.get('x-tenant-id') ||
    'demo-tenant'
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = await resolveTenantId(request)

    const expense = await prisma.expense.findFirst({
      where: { id: params.id, tenantId }
    })

    if (!expense) {
      return NextResponse.json({ success: false, error: 'Spesa non trovata' }, { status: 404 })
    }

    await prisma.expense.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true, message: 'Spesa eliminata con successo' })
  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json({ success: false, error: 'Errore server' }, { status: 500 })
  }
}
