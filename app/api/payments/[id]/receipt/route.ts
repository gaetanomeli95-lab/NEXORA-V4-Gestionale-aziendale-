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
    if (!authorize(user, 'PAYMENT_READ')) {
      return ApiResponse.error('Unauthorized', 403)
    }

    // Get payment with invoice data
    const payment = await prisma.payment.findFirst({
      where: {
        id: params.id,
        tenantId: user.tenantId
      },
      include: {
        invoice: {
          include: {
            tenant: true,
            company: true,
            customer: true
          }
        }
      }
    })

    if (!payment) {
      return ApiResponse.error('Payment not found', 404)
    }

    // Generate receipt PDF
    const pdfBuffer = await PDFGenerator.generateReceiptPDF(payment)

    // Return PDF as response
    return new NextResponse(Uint8Array.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Ricevuta-${payment.reference || payment.id}.pdf"`
      }
    })
  } catch (error) {
    console.error('Error generating receipt:', error)
    return ApiResponse.error('Failed to generate receipt', 500)
  }
}
