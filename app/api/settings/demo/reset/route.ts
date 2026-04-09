import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { clearDemoData, resetDemoData } from '@/lib/demo-data'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const summary = await resetDemoData(prisma)

    return NextResponse.json({
      success: true,
      data: summary,
      message: 'Demo data ripristinati con successo'
    })
  } catch (error) {
    console.error('Error resetting demo data:', error)
    return NextResponse.json(
      { success: false, error: 'Errore durante il ripristino dei demo data' },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const summary = await clearDemoData(prisma)

    return NextResponse.json({
      success: true,
      data: summary,
      message: 'Demo data eliminati con successo'
    })
  } catch (error) {
    console.error('Error clearing demo data:', error)
    return NextResponse.json(
      { success: false, error: 'Errore durante l\'eliminazione dei demo data' },
      { status: 500 }
    )
  }
}
