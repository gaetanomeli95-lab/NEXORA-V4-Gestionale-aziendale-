import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('🧹 Inizio pulizia database...')

  try {
    // 1. Elimina prima tutte le tabelle dipendenti / transazionali
    await prisma.invoiceItem.deleteMany()
    await prisma.estimateItem.deleteMany()
    await prisma.orderItem.deleteMany()
    await prisma.supplierOrderItem.deleteMany()
    await prisma.payment.deleteMany()
    await prisma.stockMovement.deleteMany()
    await prisma.document.deleteMany()
    await prisma.expense.deleteMany()
    await prisma.repair.deleteMany()

    // 2. Elimina i documenti principali
    await prisma.invoice.deleteMany()
    await prisma.estimate.deleteMany()
    await prisma.order.deleteMany()
    await prisma.supplierOrder.deleteMany()
    await prisma.ddt.deleteMany()

    // 3. Elimina le anagrafiche (escludendo l'azienda base se serve, ma azzeriamo tutto ciò che è test)
    await prisma.contact.deleteMany()
    await prisma.customer.deleteMany()
    await prisma.supplier.deleteMany()
    await prisma.product.deleteMany()
    await prisma.productCategory.deleteMany()

    console.log('✅ Database pulito (Anagrafiche, Documenti, Movimenti e Pagamenti eliminati).')
    console.log('✅ Sono stati mantenuti Utente e Azienda per garantirti l\'accesso.')

  } catch (error) {
    console.error('❌ Errore durante la pulizia:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
