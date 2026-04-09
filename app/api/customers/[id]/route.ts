import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { ApiResponse, authenticate, authorize, auditLog } from '@/lib/api-enterprise'

const prisma = new PrismaClient()

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const user = await authenticate(request)
        if (!authorize(user, 'CUSTOMER_READ')) return ApiResponse.error('Unauthorized', 403)
      } catch { /* use demo-tenant */ }
    }

    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        contacts: true,
        invoices: {
          take: 10,
          orderBy: { issueDate: 'desc' },
          include: {
            items: true
          }
        },
        estimates: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        orders: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        payments: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        documents: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        projects: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        },
        tasks: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!customer) {
      return ApiResponse.error('Customer not found', 404)
    }

    // Calculate customer statistics
    const totalInvoices = customer.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)
    const paidInvoices = customer.invoices
      .filter(inv => inv.status === 'PAID')
      .reduce((sum, inv) => sum + inv.totalAmount, 0)
    const outstandingBalance = totalInvoices - paidInvoices

    const customerData = {
      ...customer,
      statistics: {
        totalInvoices,
        paidInvoices,
        outstandingBalance,
        invoiceCount: customer.invoices.length,
        averageOrderValue: customer.invoices.length > 0 ? totalInvoices / customer.invoices.length : 0,
        lastInvoiceDate: customer.invoices[0]?.issueDate || null,
        totalContacts: customer.contacts.length,
        activeProjects: customer.projects.filter(p => p.status === 'ACTIVE').length
      }
    }

    return ApiResponse.success(customerData)
  } catch (error) {
    console.error('Error fetching customer:', error)
    return ApiResponse.error('Failed to fetch customer', 500)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    let userId: string | undefined
    let tenantId = 'demo-tenant'

    try {
      const user = await authenticate(request)
      if (!authorize(user, 'CUSTOMER_UPDATE')) {
        return ApiResponse.error('Unauthorized', 403)
      }
      userId = user.id
      tenantId = user.tenantId
    } catch {
      // Demo mode: allow without auth
    }

    const body = await request.json()

    const existingCustomer = await prisma.customer.findFirst({
      where: { id: params.id, tenantId }
    })

    if (!existingCustomer) {
      return ApiResponse.error('Customer not found', 404)
    }

    if (body.vatNumber && body.vatNumber !== existingCustomer.vatNumber) {
      const existingWithVat = await prisma.customer.findFirst({
        where: { vatNumber: body.vatNumber, id: { not: params.id }, tenantId }
      })
      if (existingWithVat) {
        return ApiResponse.error('Customer with this VAT number already exists', 400)
      }
    }

    const updateData: any = {}
    const fields = [
      'name', 'type', 'businessName', 'legalName', 'firstName', 'lastName',
      'email', 'phone', 'mobile', 'website', 'vatNumber', 'fiscalCode',
      'taxId', 'sdiCode', 'pecEmail', 'address', 'city', 'province',
      'postalCode', 'country', 'billingAddress', 'shippingAddress',
      'sameAsBilling', 'paymentTerms', 'creditLimit', 'currency',
      'industry', 'size', 'segment', 'source', 'preferredContact',
      'marketingConsent', 'privacyConsent', 'status', 'rating', 'notes', 'tags'
    ]
    for (const field of fields) {
      if (body[field] !== undefined) updateData[field] = body[field]
    }

    const updatedCustomer = await prisma.customer.update({
      where: { id: params.id },
      data: updateData
    })

    if (userId) {
      await auditLog(
        tenantId, userId, 'UPDATE', 'CUSTOMER', params.id,
        existingCustomer, updatedCustomer,
        request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        request.headers.get('user-agent') || undefined
      )
    }

    return ApiResponse.success(updatedCustomer)
  } catch (error) {
    console.error('Error updating customer:', error)
    return ApiResponse.error('Failed to update customer', 500)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existingCustomer = await prisma.customer.findUnique({
      where: { id: params.id }
    })

    if (!existingCustomer) {
      return NextResponse.json({ success: false, error: 'Cliente non trovato' }, { status: 404 })
    }

    // Check active invoices
    const activeInvoices = await prisma.invoice.count({
      where: { customerId: params.id, status: { in: ['DRAFT', 'SENT', 'PARTIAL'] } }
    })
    if (activeInvoices > 0) {
      return NextResponse.json({ success: false, error: 'Impossibile eliminare: cliente con fatture attive' }, { status: 400 })
    }

    // Soft delete
    await prisma.customer.update({
      where: { id: params.id },
      data: { isActive: false, status: 'DELETED' }
    })

    return NextResponse.json({ success: true, message: 'Cliente eliminato' })
  } catch (error) {
    console.error('Error deleting customer:', error)
    return NextResponse.json({ success: false, error: 'Errore server' }, { status: 500 })
  }
}
