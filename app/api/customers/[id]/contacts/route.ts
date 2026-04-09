import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { ApiResponse, authenticate, authorize } from '@/lib/api-enterprise'

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

    const contacts = await prisma.contact.findMany({
      where: { customerId: params.id },
      orderBy: { isPrimary: 'desc' }
    })

    return ApiResponse.success(contacts)
  } catch (error) {
    console.error('Error fetching customer contacts:', error)
    return ApiResponse.error('Failed to fetch customer contacts', 500)
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticate(request)
    if (!authorize(user, 'CUSTOMER_UPDATE')) {
      return ApiResponse.error('Unauthorized', 403)
    }

    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      phone,
      mobile,
      position,
      department,
      isPrimary,
      isInvoicingContact,
      isTechnicalContact,
      notes
    } = body

    // If setting as primary, unset other primary contacts
    if (isPrimary) {
      await prisma.contact.updateMany({
        where: { customerId: params.id },
        data: { isPrimary: false }
      })
    }

    const contact = await prisma.contact.create({
      data: {
        customerId: params.id,
        firstName,
        lastName,
        email,
        phone,
        mobile,
        position,
        department,
        isPrimary,
        isInvoicingContact,
        isTechnicalContact,
        notes
      }
    })

    return ApiResponse.success(contact)
  } catch (error) {
    console.error('Error creating customer contact:', error)
    return ApiResponse.error('Failed to create customer contact', 500)
  }
}
