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
    const type = searchParams.get('type') || 'estimate' // estimate, invoice, ddt

    let newDoc: any

    if (type === 'estimate') {
      const source = await prisma.estimate.findFirst({
        where: { id: params.id, tenantId },
        include: { items: true }
      })
      if (!source) return NextResponse.json({ success: false, error: 'Documento non trovato' }, { status: 404 })

      // Generate number
      const last = await prisma.estimate.findFirst({ where: { tenantId }, orderBy: { number: 'desc' } })
      let nextNum = 1
      if (last?.number) {
        const parts = last.number.split('-')
        if (parts.length >= 3) nextNum = parseInt(parts[2]) + 1
      }
      const newNumber = `PRE-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`

      newDoc = await prisma.estimate.create({
        data: {
          tenantId,
          customerId: source.customerId,
          number: newNumber,
          issueDate: new Date(),
          status: 'DRAFT',
          subtotal: source.subtotal,
          discountAmount: source.discountAmount,
          taxAmount: source.taxAmount,
          totalAmount: source.totalAmount,
          notes: source.notes,
          items: {
            create: source.items.map(item => ({
              tenantId,
              productId: item.productId,
              code: item.code,
              description: item.description,
              quantity: item.quantity,
              unit: item.unit,
              unitPrice: item.unitPrice,
              discount: item.discount,
              vatRate: item.vatRate,
              totalPrice: item.totalPrice,
            }))
          }
        }
      })
    } else if (type === 'invoice') {
      const source = await prisma.invoice.findFirst({
        where: { id: params.id, tenantId },
        include: { items: true }
      })
      if (!source) return NextResponse.json({ success: false, error: 'Documento non trovato' }, { status: 404 })

      // Generate number
      const last = await prisma.invoice.findFirst({ where: { tenantId }, orderBy: { number: 'desc' } })
      let nextNum = 1
      if (last?.number) {
        const parts = last.number.split('-')
        if (parts.length >= 3) nextNum = parseInt(parts[2]) + 1
      }
      const newNumber = `FAT-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`

      newDoc = await prisma.invoice.create({
        data: {
          tenantId,
          customerId: source.customerId,
          number: newNumber,
          issueDate: new Date(),
          dueDate: source.dueDate ?? new Date(),
          status: 'DRAFT',
          subtotal: source.subtotal,
          taxAmount: source.taxAmount,
          totalAmount: source.totalAmount,
          paidAmount: 0,
          balanceAmount: source.totalAmount,
          notes: source.notes,
          items: {
            create: source.items.map(item => ({
              productId: item.productId,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              taxRate: item.taxRate,
              taxAmount: item.taxAmount,
            }))
          }
        }
      })
    } else if (type === 'ddt') {
      const source = await prisma.ddt.findFirst({
        where: { id: params.id, tenantId }
      })
      if (!source) return NextResponse.json({ success: false, error: 'Documento non trovato' }, { status: 404 })

      // Generate number
      const last = await prisma.ddt.findFirst({ where: { tenantId }, orderBy: { number: 'desc' } })
      let nextNum = 1
      if (last?.number) {
        const parts = last.number.split('-')
        if (parts.length >= 3) nextNum = parseInt(parts[2]) + 1
      }
      const newNumber = `DDT-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`

      newDoc = await prisma.ddt.create({
        data: {
          tenantId,
          customerId: source.customerId,
          number: newNumber,
          issueDate: new Date(),
          transportMethod: source.transportMethod,
          referenceNumber: source.referenceNumber,
          itemsPayload: source.itemsPayload,
          notes: source.notes
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: newDoc,
      message: 'Documento duplicato con successo'
    })
  } catch (error) {
    console.error('Error duplicating document:', error)
    return NextResponse.json({ success: false, error: 'Errore durante la duplicazione' }, { status: 500 })
  }
}
