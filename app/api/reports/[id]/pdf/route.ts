import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse, authenticate, authorize } from '@/lib/api-enterprise'
import { PDFGenerator } from '@/lib/pdf-generator'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await authenticate(request)
    if (!authorize(user, 'ANALYTICS_EXPORT')) {
      return ApiResponse.error('Unauthorized', 403)
    }

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'sales'
    const period = searchParams.get('period') || 'month'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Get report data
    const reportParams = new URLSearchParams({
      period,
      ...(startDate && endDate && { startDate, endDate })
    })

    const reportUrl = new URL(`/api/reports/sales?${reportParams.toString()}`, request.nextUrl.origin)
    const response = await fetch(reportUrl, {
      headers: {
        cookie: request.headers.get('cookie') || '',
        authorization: request.headers.get('authorization') || ''
      },
      cache: 'no-store'
    })
    const result = await response.json()
    
    if (!result.success) {
      return ApiResponse.error('Failed to fetch report data', 500)
    }

    // Generate PDF report
    const pdfBuffer = await PDFGenerator.generateReportPDF({
      ...result.data,
      period: period === 'custom' ? `${startDate} - ${endDate}` : period,
      reportType
    })

    // Return PDF as response
    return new NextResponse(Uint8Array.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Report-${reportType}-${period}.pdf"`
      }
    })
  } catch (error) {
    console.error('Error generating report PDF:', error)
    return ApiResponse.error('Failed to generate report PDF', 500)
  }
}
