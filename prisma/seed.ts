import { PrismaClient } from '@prisma/client'
import { DEFAULT_ADMIN_EMAIL, seedDemoDatabase } from '../lib/demo-data'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Inizio seed database enterprise demo...')

  const summary = await seedDemoDatabase(prisma)

  console.log('✅ Seed database completato con successo!')
  console.log('')
  console.log('📊 Demo data caricati:')
  console.log(`  - Azienda demo: ${summary.companyName}`)
  console.log(`  - Clienti: ${summary.customers}`)
  console.log(`  - Prodotti: ${summary.products}`)
  console.log(`  - Fatture: ${summary.invoices}`)
  console.log(`  - Preventivi: ${summary.estimates}`)
  console.log(`  - Riparazioni: ${summary.repairs}`)
  console.log(`  - Fatture scadute: ${summary.overdueInvoices}`)
  console.log(`  - Fatture aperte/inviate: ${summary.upcomingInvoices}`)
  console.log(`  - Prodotti scorta bassa: ${summary.lowStockProducts}`)
  console.log(`  - Prodotti esauriti: ${summary.outOfStockProducts}`)
  console.log(`  - Riparazioni pronte: ${summary.readyRepairs}`)
  console.log(`  - Preventivi accettati: ${summary.acceptedEstimates}`)
  console.log('')
  console.log('🔑 Credenziali demo:')
  console.log(`  Email: ${DEFAULT_ADMIN_EMAIL}`)
  console.log('  Password: admin123')
}

main()
  .catch((e) => {
    console.error('❌ Errore durante il seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
