import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-tenant'
    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source') || 'estimate' // estimate or invoice

    let sourceDoc: any
    let customerId: string
    let items: any[] = []
    let refNumber: string

    if (source === 'estimate') {
      sourceDoc = await prisma.estimate.findFirst({
        where: { id: params.id, tenantId },
        include: { items: true }
      })
      if (!sourceDoc) return NextResponse.json({ success: false, error: 'Preventivo non trovato' }, { status: 404 })
      customerId = sourceDoc.customerId
      refNumber = sourceDoc.number
      items = sourceDoc.items.map((item: any) => ({
        code: item.code || '',
        description: item.description,
        quantity: item.quantity,
        unit: item.unit
      }))
    } else {
      sourceDoc = await prisma.invoice.findFirst({
        where: { id: params.id, tenantId },
        include: { items: true }
      })
      if (!sourceDoc) return NextResponse.json({ success: false, error: 'Fattura non trovata' }, { status: 404 })
      customerId = sourceDoc.customerId
      refNumber = sourceDoc.number
      items = sourceDoc.items.map((item: any) => ({
        code: item.code || '',
        description: item.description,
        quantity: item.quantity,
        unit: item.unit
      }))
    }

    const existingDdt = await prisma.ddt.findFirst({
      where: {
        tenantId,
        ...(source === 'estimate' ? { estimateId: params.id } : { invoiceId: params.id })
      }
    })

    if (existingDdt) {
      return NextResponse.json({
        success: true,
        data: existingDdt,
        message: `DDT ${existingDdt.number} già presente per ${source === 'estimate' ? 'il preventivo' : 'la fattura'} ${refNumber}.`
      })
    }

    const lastDdt = await prisma.ddt.findFirst({
      where: { tenantId },
      orderBy: { number: 'desc' }
    })

    let nextNum = 1
    if (lastDdt?.number) {
      const parts = lastDdt.number.split('-')
      if (parts.length >= 3) {
        nextNum = parseInt(parts[2]) + 1
      }
    }
    const ddtNumber = `DDT-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`

    const ddt = await prisma.ddt.create({
      data: {
        tenantId,
        customerId,
        number: ddtNumber,
        issueDate: new Date(),
        referenceNumber: refNumber,
        estimateId: source === 'estimate' ? params.id : undefined,
        invoiceId: source === 'invoice' ? params.id : undefined,
        itemsPayload: JSON.stringify(items),
        transportMethod: 'Mezzo proprio',
        notes: `Generato da ${source === 'estimate' ? 'preventivo' : 'fattura'} ${refNumber}`
      }
    })

    return NextResponse.json({
      success: true,
      data: ddt,
      message: `DDT ${ddtNumber} generato con successo!`
    })
  } catch (error) {
    console.error('Error generating DDT:', error)
    return NextResponse.json({ success: false, error: 'Errore durante la generazione del DDT' }, { status: 500 })
  }
}
