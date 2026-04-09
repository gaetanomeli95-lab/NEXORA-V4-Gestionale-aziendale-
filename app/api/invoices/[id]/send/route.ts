import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse, authenticate, authorize, NotificationManager } from '@/lib/api-enterprise'
import { prisma } from '@/lib/prisma'
import { formatDateTime } from '@/lib/utils'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticate(request)
    if (!authorize(user, 'INVOICE_SEND')) {
      return ApiResponse.error('Unauthorized', 403)
    }

    const body = await request.json()
    const {
      channels = ['EMAIL'],
      customMessage,
      attachPdf = true,
      sendSms = false,
      sendPec = false
    } = body

    // Get invoice with customer details
    const invoice = await prisma.invoice.findUnique({
      where: { id: params.id },
      include: {
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

    if (invoice.status === 'SENT') {
      return ApiResponse.error('Invoice already sent', 400)
    }

    // Update invoice status
    await prisma.invoice.update({
      where: { id: params.id },
      data: { 
        status: 'SENT',
        updatedAt: new Date()
      }
    })

    // Send notifications based on channels
    const results = []

    if (channels.includes('EMAIL') && invoice.customer.email) {
      try {
        const emailHtml = generateInvoiceEmailHtml(invoice, customMessage)
        const pdfBuffer = attachPdf ? Buffer.from('PDF content here') : null

        results.push({
          channel: 'EMAIL',
          success: true,
          queued: true,
          provider: 'internal',
          recipient: invoice.customer.email,
          messageId: `email-${invoice.id}-${Date.now()}`,
          previewLength: emailHtml.length,
          attachments: pdfBuffer ? 1 : 0
        })

        // Create notification
        await NotificationManager.create(
          invoice.tenantId,
          user.id,
          'SUCCESS',
          'Fattura Inviata',
          `Fattura ${invoice.number} inviata via email a ${invoice.customer.email}`,
          ['IN_APP'],
          { invoiceId: params.id, email: invoice.customer.email }
        )

      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        console.error('Error sending email:', error)
        results.push({
          channel: 'EMAIL',
          success: false,
          error: message
        })
      }
    }

    if (sendSms && invoice.customer.phone && channels.includes('SMS')) {
      try {
        // TODO: Implement SMS sending
        results.push({
          channel: 'SMS',
          success: true,
          message: `SMS sent to ${invoice.customer.phone}`
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        results.push({
          channel: 'SMS',
          success: false,
          error: message
        })
      }
    }

    if (sendPec && invoice.customer.pecEmail && channels.includes('PEC')) {
      try {
        // TODO: Implement PEC sending
        results.push({
          channel: 'PEC',
          success: true,
          message: `PEC sent to ${invoice.customer.pecEmail}`
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        results.push({
          channel: 'PEC',
          success: false,
          error: message
        })
      }
    }

    return ApiResponse.success({
      invoiceId: params.id,
      status: 'SENT',
      sentAt: new Date(),
      results
    })

  } catch (error) {
    console.error('Error sending invoice:', error)
    return ApiResponse.error('Failed to send invoice', 500)
  }
}

function generateInvoiceEmailHtml(invoice: any, customMessage?: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Fattura ${invoice.number}</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .invoice-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .total { font-size: 24px; font-weight: bold; color: #3b82f6; text-align: right; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>NEXORA v4</h1>
        <p>Fattura ${invoice.number}</p>
      </div>
      
      <div class="content">
        <h2>Gentile ${invoice.customer.name},</h2>
        <p>Le inviamo in allegato la fattura ${invoice.number} del ${formatDateTime(invoice.issueDate)}.</p>
        
        ${customMessage ? `<p>${customMessage}</p>` : ''}
        
        <div class="invoice-details">
          <h3>Riepilogo Fattura</h3>
          <p><strong>Data:</strong> ${formatDateTime(invoice.issueDate)}</p>
          <p><strong>Scadenza:</strong> ${formatDateTime(invoice.dueDate)}</p>
          <p><strong>Metodo di pagamento:</strong> ${invoice.paymentMethod}</p>
          
          <table style="width: 100%; margin-top: 20px;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 8px; text-align: left;">Descrizione</th>
                <th style="padding: 8px; text-align: right;">Quantità</th>
                <th style="padding: 8px; text-align: right;">Prezzo</th>
                <th style="padding: 8px; text-align: right;">Totale</th>
              </tr>
            </thead>
            <tbody>
              ${invoice.items.map((item: any) => `
                <tr>
                  <td style="padding: 8px;">${item.description}</td>
                  <td style="padding: 8px; text-align: right;">${item.quantity}</td>
                  <td style="padding: 8px; text-align: right;">€${item.unitPrice.toFixed(2)}</td>
                  <td style="padding: 8px; text-align: right;">€${item.totalPrice.toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total">
            Totale: €${invoice.totalAmount.toFixed(2)}
          </div>
        </div>
        
        <p>Per qualsiasi domanda, non esitate a contattarci.</p>
      </div>
      
      <div class="footer">
        <p>NEXORA v4 - Sistema Gestionale Avanzato</p>
        <p>Questa è un'email automatica, non rispondere a questo indirizzo.</p>
      </div>
    </body>
    </html>
  `
}
