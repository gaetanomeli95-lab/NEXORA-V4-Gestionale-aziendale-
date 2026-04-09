import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { ApiResponse, authenticate, authorize } from '@/lib/api-enterprise'
import { PDFGenerator } from '@/lib/pdf-generator'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticate(request)
    if (!authorize(user, 'INVOICE_READ')) {
      return ApiResponse.error('Unauthorized', 403)
    }

    // Get invoice with all related data
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId
      },
      include: {
        tenant: true,
        company: true,
        customer: true,
        items: {
          include: {
            product: true
          }
        }
      }
    })

    if (!invoice) {
      return ApiResponse.error('Invoice not found', 404)
    }

    // Generate PDF
    const pdfBuffer = await PDFGenerator.generateInvoicePDF({
      invoice,
      tenant: invoice.tenant,
      company: invoice.company,
      customer: invoice.customer,
      items: invoice.items
    })

    // Return PDF as response
    return new NextResponse(Uint8Array.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Fattura-${invoice.number}.pdf"`
      }
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return ApiResponse.error('Failed to generate PDF', 500)
  }
}
