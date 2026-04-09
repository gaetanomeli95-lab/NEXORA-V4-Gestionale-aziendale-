import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Inizio seed database pulito...')

  // 1. Tenant & Company
  const tenant = await prisma.tenant.upsert({
    where: { id: 'demo-tenant' },
    update: {},
    create: {
      id: 'demo-tenant',
      name: 'La Mia Azienda SRL',
      isActive: true,
    },
  })

  await prisma.company.upsert({
    where: { id: 'company-1' },
    update: {},
    create: {
      id: 'company-1',
      tenantId: tenant.id,
      name: 'La Mia Azienda SRL',
      vatNumber: 'IT12345678901',
      taxCode: '12345678901',
      address: 'Via Roma 1',
      city: 'Milano',
      province: 'MI',
      postalCode: '20100',
      country: 'IT',
      email: 'info@lamiaazienda.it',
      phone: '+39 02 1234567',
    },
  })
  console.log('✅ Azienda base creata')

  // 2. Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10)
  await prisma.user.upsert({
    where: { email: 'admin@nexora.com' },
    update: {
      password: hashedPassword
    },
    create: {
      email: 'admin@nexora.com',
      name: 'Amministratore',
      password: hashedPassword,
      role: 'ADMIN',
      tenantId: tenant.id,
      isActive: true,
    },
  })
  console.log('✅ Utente admin creato: admin@nexora.com')

  console.log('🎉 Seed database pulito completato con successo!')
  console.log('')
  console.log('🔑 Credenziali per accesso:')
  console.log('  Email: admin@nexora.com')
  console.log('  Password: admin123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
