import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const tenantId = body?.tenantId || 'demo-tenant'
    const operation = body?.operation
    const payload = body?.payload || {}

    if (!operation) {
      return NextResponse.json({ success: false, error: 'Missing operation' }, { status: 400 })
    }

    if (operation === 'create_customer') {
      const name = String(payload?.name || '').trim()
      if (!name) {
        return NextResponse.json({ success: false, error: 'Missing customer name' }, { status: 400 })
      }

      const email = payload?.email ? String(payload.email).trim() : undefined
      const vatNumber = payload?.vatNumber ? String(payload.vatNumber).trim() : undefined

      const customer = await prisma.customer.create({
        data: {
          tenantId,
          name,
          email: email || null,
          vatNumber: vatNumber || null,
          status: 'ACTIVE',
          isActive: true,
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          message: `Cliente creato: ${customer.name}`,
          customerId: customer.id,
        }
      })
    }

    return NextResponse.json({ success: false, error: `Unsupported operation: ${operation}` }, { status: 400 })
  } catch (error) {
    console.error('AI Execute Error:', error)
    return NextResponse.json({ success: false, error: 'Errore durante esecuzione azione AI' }, { status: 500 })
  }
}
