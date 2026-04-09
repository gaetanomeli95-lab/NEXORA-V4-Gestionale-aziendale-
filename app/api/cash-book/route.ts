import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'

const toNumber = (value: unknown) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  if (typeof value === 'object' && value !== null && 'toNumber' in value && typeof (value as { toNumber?: unknown }).toNumber === 'function') {
    const parsed = (value as { toNumber: () => number }).toNumber()
    return Number.isFinite(parsed) ? parsed : 0
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const session = await getServerSession(authOptions)
    const tenantId = searchParams.get('tenantId') || (session?.user as { tenantId?: string } | undefined)?.tenantId || 'demo-tenant'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const dateFilter: any = {}
    if (startDate) dateFilter.gte = new Date(startDate)
    if (endDate) dateFilter.lte = new Date(endDate + 'T23:59:59.999Z')
    const hasDateFilter = Object.keys(dateFilter).length > 0

    // Entrate: pagamenti registrati
    const payments = await prisma.payment.findMany({
      where: {
        tenantId,
        status: { not: 'CANCELLED' },
        ...(hasDateFilter ? { paymentDate: dateFilter } : {})
      },
      include: {
        customer: { select: { name: true } },
        invoice: { select: { number: true } },
        estimate: { select: { number: true } },
        order: { select: { number: true } }
      },
      orderBy: { paymentDate: 'desc' }
    })

    // Uscite manuali: spese
    const expenses = await prisma.expense.findMany({
      where: {
        tenantId,
        ...(hasDateFilter ? { expenseDate: dateFilter } : {})
      },
      orderBy: { expenseDate: 'desc' }
    })

    // Uscite da ordini fornitore pagati
    const supplierOrders = await prisma.supplierOrder.findMany({
      where: {
        tenantId,
        paymentStatus: 'PAGATO',
        ...(hasDateFilter ? { updatedAt: dateFilter } : {})
      },
      include: { supplier: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' }
    })

    // Unifica tutti i movimenti
    const movements: any[] = []

    for (const p of payments) {
      const doc = p.invoice?.number
        ? `Fattura ${p.invoice.number}`
        : p.estimate?.number
        ? `Preventivo ${p.estimate.number}`
        : p.order?.number
        ? `Ordine Cliente / Banco ${p.order.number}`
        : p.reference
        ? p.reference
        : 'Incasso Libero'
        
      movements.push({
        id: `pay_${p.id}`,
        date: p.paymentDate,
        type: 'IN',
        category: 'Incasso',
        description: doc,
        subject: p.customer?.name || '',
        method: p.method,
        in: toNumber(p.amount),
        out: 0,
        notes: p.notes || '',
        reference: p.reference || ''
      })
    }

    for (const e of expenses) {
      movements.push({
        id: `exp_${e.id}`,
        date: e.expenseDate,
        type: 'OUT',
        category: e.category || 'Spesa',
        description: e.description || 'Spesa',
        subject: '',
        method: e.paymentMethod || 'CONTANTI',
        in: 0,
        out: toNumber(e.amount),
        notes: e.notes || '',
        reference: ''
      })
    }

    for (const so of supplierOrders) {
      movements.push({
        id: `sup_${so.id}`,
        date: so.updatedAt,
        type: 'OUT',
        category: 'Ordine Fornitore',
        description: `Ordine ${so.number}`,
        subject: so.supplier?.name || '',
        method: 'N/D',
        in: 0,
        out: toNumber(so.totalAmount),
        notes: so.notes || '',
        reference: so.number
      })
    }

    // Ordina per data decrescente
    movements.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Totali base
    const totalIn = movements.reduce((s, m) => s + m.in, 0)
    const totalOutExpenses = expenses.reduce((sum, expense) => sum + toNumber(expense.amount), 0)
    const totalOutSupplierOrders = supplierOrders.reduce((sum, order) => sum + toNumber(order.totalAmount), 0)
    const totalOut = totalOutExpenses + totalOutSupplierOrders
    const balance = totalIn - totalOut

    // Liquidità ripartita per metodo
    const cashMethods = ['CONTANTI', 'CASH']
    const bankMethods = ['BONIFICO', 'CARTA', 'BANK_TRANSFER', 'POS', 'PAYPAL', 'ASSEGNO', 'ALTRO', 'N/D']
    let liquiditaContanti = 0
    let liquiditaBanca = 0
    for (const m of movements) {
      const net = m.in - m.out
      const mUpper = (m.method || '').toUpperCase()
      if (cashMethods.some(c => mUpper.includes(c))) liquiditaContanti += net
      else liquiditaBanca += net
    }

    const paidInvoiceIds = Array.from(new Set(payments.map(payment => payment.invoiceId).filter(Boolean))) as string[]
    const paidEstimateIds = Array.from(new Set(payments.map(payment => payment.estimateId).filter(Boolean))) as string[]
    const paidOrderIds = Array.from(new Set(payments.map(payment => payment.orderId).filter(Boolean))) as string[]

    const [paidInvoices, paidEstimates, paidOrders] = await Promise.all([
      paidInvoiceIds.length > 0
        ? prisma.invoice.findMany({
            where: { tenantId, id: { in: paidInvoiceIds } },
            include: { items: { include: { product: { select: { costPrice: true } } } } }
          })
        : Promise.resolve([]),
      paidEstimateIds.length > 0
        ? prisma.estimate.findMany({
            where: { tenantId, id: { in: paidEstimateIds } },
            include: { items: { include: { product: { select: { costPrice: true } } } } }
          })
        : Promise.resolve([]),
      paidOrderIds.length > 0
        ? prisma.order.findMany({
            where: { tenantId, id: { in: paidOrderIds } },
            include: { items: { include: { product: { select: { costPrice: true } } } } }
          })
        : Promise.resolve([])
    ])

    let costoMerce = 0

    for (const invoice of paidInvoices) {
      for (const item of invoice.items) {
        const cost = toNumber(item.product?.costPrice)
        costoMerce += cost * item.quantity
      }
    }

    for (const est of paidEstimates) {
      for (const item of est.items) {
        const cost = toNumber(item.product?.costPrice)
        costoMerce += cost * item.quantity
      }
    }

    for (const order of paidOrders) {
      for (const item of order.items) {
        const cost = toNumber(item.product?.costPrice)
        costoMerce += cost * item.quantity
      }
    }

    // GUADAGNO EFFETTIVO = DENARO IN CASSA - COSTO MERCE
    const denaroInCassa = totalIn - totalOutExpenses
    const guadagnoEffettivo = totalIn - totalOutExpenses - costoMerce

    // Saldo progressivo (dal più recente: parte dal saldo finale, scala a ritroso)
    let running = balance
    for (const m of movements) {
      m.runningBalance = running
      running = m.type === 'IN' ? running - m.in : running + m.out
    }

    return NextResponse.json({
      success: true,
      data: {
        movements,
        totals: {
          totalIn,
          totalOut,
          balance,
          costoMerce,
          denaroInCassa,
          guadagnoEffettivo,
          liquiditaContanti,
          liquiditaBanca
        }
      }
    })
  } catch (error) {
    console.error('Error fetching cash book:', error)
    return NextResponse.json({ success: false, error: 'Errore server' }, { status: 500 })
  }
}

