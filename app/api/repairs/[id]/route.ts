import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseDateTimeInput } from '@/lib/utils'

const matchesDevice = (description: string | null | undefined, brand?: string | null, model?: string | null) => {
  const normalizedDescription = (description || '').toLowerCase()
  const normalizedBrand = (brand || '').toLowerCase().trim()
  const normalizedModel = (model || '').toLowerCase().trim()

  if (normalizedModel && normalizedDescription.includes(normalizedModel)) return true
  if (normalizedBrand && normalizedDescription.includes(normalizedBrand)) return true

  return false
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-tenant'
    const repair = await prisma.repair.findFirst({
      where: { id: params.id, tenantId },
      include: { customer: true }
    })
    if (!repair) return NextResponse.json({ success: false, error: 'Non trovata' }, { status: 404 })

    const [customerInvoices, previousRepairs] = await Promise.all([
      repair.customerId
        ? prisma.invoice.findMany({
            where: {
              tenantId,
              customerId: repair.customerId,
              status: { not: 'CANCELLED' }
            },
            orderBy: { issueDate: 'desc' },
            take: 5,
            select: {
              id: true,
              number: true,
              issueDate: true,
              totalAmount: true,
              items: {
                select: {
                  description: true,
                  quantity: true,
                  unitPrice: true,
                  productId: true
                }
              }
            }
          })
        : Promise.resolve([]),
      repair.customerId
        ? prisma.repair.findMany({
            where: {
              tenantId,
              customerId: repair.customerId,
              id: { not: repair.id }
            },
            orderBy: { repairDate: 'desc' },
            take: 5,
            select: {
              id: true,
              number: true,
              repairDate: true,
              status: true,
              model: true,
              brand: true,
              totalAmount: true
            }
          })
        : Promise.resolve([])
    ])

    const relatedInvoice = customerInvoices.find((invoice) =>
      invoice.items.some((item) => matchesDevice(item.description, repair.brand, repair.model))
    ) || customerInvoices[0]

    const warrantyMonths = 24
    const warrantyExpiresAt = relatedInvoice
      ? new Date(new Date(relatedInvoice.issueDate).setMonth(new Date(relatedInvoice.issueDate).getMonth() + warrantyMonths))
      : null
    const warrantyStatus = !warrantyExpiresAt
      ? 'UNKNOWN'
      : warrantyExpiresAt >= new Date()
        ? 'ACTIVE'
        : 'EXPIRED'

    return NextResponse.json({
      success: true,
      data: {
        ...repair,
        customerSales: customerInvoices,
        previousRepairs,
        warrantyInsight: {
          status: warrantyStatus,
          warrantyMonths,
          sourceInvoice: relatedInvoice
            ? {
                id: relatedInvoice.id,
                number: relatedInvoice.number,
                issueDate: relatedInvoice.issueDate,
                totalAmount: relatedInvoice.totalAmount
              }
            : null,
          expiresAt: warrantyExpiresAt,
          message: relatedInvoice
            ? warrantyStatus === 'ACTIVE'
              ? 'Garanzia potenzialmente attiva sulla base dell’ultima vendita collegata.'
              : 'Garanzia scaduta sulla base dell’ultima vendita collegata.'
            : 'Nessuna vendita collegata trovata per questo cliente/dispositivo.'
        }
      }
    })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Errore server' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-tenant'
    const body = await request.json()

    const existing = await prisma.repair.findFirst({ where: { id: params.id, tenantId } })
    if (!existing) return NextResponse.json({ success: false, error: 'Non trovata' }, { status: 404 })

    const totalAmount = parseFloat(body.totalAmount ?? existing.totalAmount) || 0
    const depositAmount = parseFloat(body.depositAmount ?? existing.depositAmount) || 0
    const paidAmount = parseFloat(body.paidAmount ?? existing.paidAmount) || 0
    const balanceAmount = Math.max(0, totalAmount - paidAmount - depositAmount)

    const updateData: any = {
      status: body.status ?? existing.status,
      paymentStatus: body.paymentStatus ?? existing.paymentStatus,
      customerId: body.customerId !== undefined ? (body.customerId || null) : existing.customerId,
      description: body.description !== undefined ? body.description : existing.description,
      brand: body.brand !== undefined ? body.brand : existing.brand,
      model: body.model !== undefined ? body.model : existing.model,
      serialNumber: body.serialNumber !== undefined ? body.serialNumber : existing.serialNumber,
      itemsPayload: body.itemsPayload !== undefined ? body.itemsPayload : existing.itemsPayload,
      subtotal: totalAmount,
      depositAmount,
      paidAmount,
      totalAmount,
      balanceAmount,
      notes: body.notes !== undefined ? body.notes : existing.notes,
      internalNotes: body.internalNotes !== undefined ? body.internalNotes : existing.internalNotes,
    }
    if (body.repairDate) updateData.repairDate = parseDateTimeInput(body.repairDate, existing.repairDate) || existing.repairDate
    if (body.deliveryDate) updateData.deliveryDate = parseDateTimeInput(body.deliveryDate, existing.deliveryDate || new Date()) || existing.deliveryDate
    else if (body.deliveryDate === null) updateData.deliveryDate = null

    const updated = await prisma.repair.update({
      where: { id: params.id },
      data: updateData,
      include: { customer: true }
    })
    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error updating repair:', error)
    return NextResponse.json({ success: false, error: 'Errore aggiornamento' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'demo-tenant'
    await prisma.repair.deleteMany({ where: { id: params.id, tenantId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Errore eliminazione' }, { status: 500 })
  }
}
