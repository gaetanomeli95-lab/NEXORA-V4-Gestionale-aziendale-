import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Inizio seed database semplificato...')

  // 1. Tenant (Azienda Demo)
  const tenant = await prisma.tenant.upsert({
    where: { id: 'demo-tenant' },
    update: {},
    create: {
      id: 'demo-tenant',
      name: 'NEXORA Demo SRL',
      legalName: 'NEXORA Demo SRL',
      subdomain: 'demo',
      vatNumber: 'IT12345678901',
      address: 'Via Roma 123',
      city: 'Milano',
      province: 'MI',
      postalCode: '20121',
      country: 'Italy',
      phone: '+39 02 12345678',
      email: 'info@NEXORAdemo.it',
    },
  })

  console.log('✅ Tenant creato:', tenant.name)

  const company = await prisma.company.upsert({
    where: { id: 'company-demo' },
    update: {
      tenantId: tenant.id,
      legalName: 'NEXORA Demo SRL',
      vatNumber: 'IT12345678901',
      address: 'Via Roma 123',
      city: 'Milano',
      province: 'MI',
      postalCode: '20121',
      country: 'IT',
      phone: '+39 02 12345678',
      email: 'info@NEXORAdemo.it',
      isActive: true,
    },
    create: {
      id: 'company-demo',
      tenantId: tenant.id,
      name: 'NEXORA Demo SRL',
      legalName: 'NEXORA Demo SRL',
      vatNumber: 'IT12345678901',
      address: 'Via Roma 123',
      city: 'Milano',
      province: 'MI',
      postalCode: '20121',
      country: 'IT',
      phone: '+39 02 12345678',
      email: 'info@NEXORAdemo.it',
      isActive: true,
    },
  })

  console.log('✅ Company creata:', company.name)

  // 2. Utente Admin
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@nexora.com' },
    update: {
      tenantId: tenant.id,
      name: 'Admin Demo',
      firstName: 'Admin',
      lastName: 'Demo',
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      tenantId: tenant.id,
      email: 'admin@nexora.com',
      name: 'Admin Demo',
      firstName: 'Admin',
      lastName: 'Demo',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
      isActive: true,
    },
  })

  await prisma.userCompany.upsert({
    where: {
      userId_companyId: {
        userId: adminUser.id,
        companyId: company.id,
      }
    },
    update: {
      role: 'ADMIN',
      isDefault: true,
    },
    create: {
      userId: adminUser.id,
      companyId: company.id,
      role: 'ADMIN',
      isDefault: true,
    },
  })

  console.log('✅ Utente admin creato:', adminUser.email)

  // 3. Clienti
  const customers = [
    {
      id: 'customer-1',
      tenantId: tenant.id,
      companyId: company.id,
      name: 'Mario Rossi',
      email: 'mario.rossi@email.it',
      phone: '+39 333 1234567',
      address: 'Via Milano 45',
      city: 'Roma',
      postalCode: '00100',
      country: 'Italy',
      vatNumber: 'IT98765432100',
      fiscalCode: 'RSSMRA85A01H501Z',
      paymentTerms: 'NET30',
      creditLimit: 10000.00,
    },
    {
      id: 'customer-2',
      tenantId: tenant.id,
      companyId: company.id,
      name: 'Laura Bianchi SNC',
      email: 'info@bianchisnc.it',
      phone: '+39 02 98765432',
      address: 'Corso Buenos Aires 123',
      city: 'Milano',
      postalCode: '20124',
      country: 'Italy',
      vatNumber: 'IT11223344556',
      paymentTerms: 'NET60',
      creditLimit: 25000.00,
    },
    {
      id: 'customer-3',
      tenantId: tenant.id,
      companyId: company.id,
      name: 'Giuseppe Verdi',
      email: 'giuseppe.verdi@email.it',
      phone: '+39 0444 123456',
      address: 'Via San Francesco 78',
      city: 'Vicenza',
      postalCode: '36100',
      country: 'Italy',
      vatNumber: 'IT55667788990',
      paymentTerms: 'NET15',
      creditLimit: 5000.00,
    }
  ]

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { id: customer.id },
      update: {},
      create: customer,
    })
  }

  console.log('✅ Clienti creati:', customers.length)

  // 4. Prodotti
  const products = [
    {
      id: 'prod-1',
      tenantId: tenant.id,
      sku: 'HW-LAPTOP-001',
      name: 'Laptop Pro 15"',
      description: 'Laptop professionale con processore Intel i7, 16GB RAM, 512GB SSD',
      unitPrice: 1299.99,
      costPrice: 950.00,
      stockQuantity: 25,
      minStockLevel: 5,
      trackStock: true,
      isActive: true,
      taxRate: 22.00,
    },
    {
      id: 'prod-2',
      tenantId: tenant.id,
      sku: 'SW-OFFICE-365',
      name: 'Microsoft 365 Business',
      description: 'Licenza annuale Microsoft 365 per business',
      unitPrice: 99.00,
      costPrice: 75.00,
      stockQuantity: 999,
      minStockLevel: 0,
      trackStock: false,
      isActive: true,
      taxRate: 22.00,
    },
    {
      id: 'prod-3',
      tenantId: tenant.id,
      sku: 'HW-MOUSE-002',
      name: 'Mouse Wireless Pro',
      description: 'Mouse wireless ergonomico con ricarica USB',
      unitPrice: 49.99,
      costPrice: 25.00,
      stockQuantity: 150,
      minStockLevel: 20,
      trackStock: true,
      isActive: true,
      taxRate: 22.00,
    },
    {
      id: 'prod-4',
      tenantId: tenant.id,
      sku: 'SVC-CONSULT-001',
      name: 'Consulenza IT Base',
      description: 'Pacchetto 10 ore consulenza IT remota',
      unitPrice: 450.00,
      costPrice: 200.00,
      stockQuantity: 0,
      minStockLevel: 0,
      trackStock: false,
      isActive: true,
      taxRate: 22.00,
    }
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {},
      create: product,
    })
  }

  console.log('✅ Prodotti creati:', products.length)

  // 5. Fatture
  const invoices = [
    {
      id: 'inv-2024-001',
      tenantId: tenant.id,
      customerId: 'customer-1',
      number: 'FAT-2024-001',
      issueDate: new Date('2024-03-01'),
      dueDate: new Date('2024-03-31'),
      status: 'PAID',
      subtotal: 1299.99,
      taxAmount: 285.99,
      totalAmount: 1585.98,
      paymentMethod: 'BANK_TRANSFER',
      notes: 'Fattura per acquisto laptop professionale',
    },
    {
      id: 'inv-2024-002',
      tenantId: tenant.id,
      customerId: 'customer-2',
      number: 'FAT-2024-002',
      issueDate: new Date('2024-03-05'),
      dueDate: new Date('2024-05-04'),
      status: 'PENDING',
      subtotal: 594.00,
      taxAmount: 130.68,
      totalAmount: 724.68,
      paymentMethod: 'BANK_TRANSFER',
      notes: 'Licenze Microsoft 365 per 6 utenti',
    },
    {
      id: 'inv-2024-003',
      tenantId: tenant.id,
      customerId: 'customer-3',
      number: 'FAT-2024-003',
      issueDate: new Date('2024-03-10'),
      dueDate: new Date('2024-03-25'),
      status: 'OVERDUE',
      subtotal: 49.99,
      taxAmount: 10.99,
      totalAmount: 60.98,
      paymentMethod: 'PAYPAL',
      notes: 'Mouse wireless pro',
    }
  ]

  for (const invoice of invoices) {
    await prisma.invoice.upsert({
      where: { id: invoice.id },
      update: {},
      create: invoice,
    })
  }

  console.log('✅ Fatture create:', invoices.length)

  // 6. Invoice Items (dettagli fatture)
  const invoiceItems = [
    {
      id: 'simple-inv-item-1',
      invoiceId: 'inv-2024-001',
      productId: 'prod-1',
      description: 'Laptop Pro 15" - Configurazione standard',
      quantity: 1,
      unitPrice: 1299.99,
      totalPrice: 1299.99,
      taxRate: 22.00,
      taxAmount: 285.99,
    },
    {
      id: 'simple-inv-item-2',
      invoiceId: 'inv-2024-002',
      productId: 'prod-2',
      description: 'Microsoft 365 Business - Licenza annuale',
      quantity: 6,
      unitPrice: 99.00,
      totalPrice: 594.00,
      taxRate: 22.00,
      taxAmount: 130.68,
    },
    {
      id: 'simple-inv-item-3',
      invoiceId: 'inv-2024-003',
      productId: 'prod-3',
      description: 'Mouse Wireless Pro - Garanzia 2 anni',
      quantity: 1,
      unitPrice: 49.99,
      totalPrice: 49.99,
      taxRate: 22.00,
      taxAmount: 10.99,
    }
  ]

  for (const item of invoiceItems) {
    await prisma.invoiceItem.upsert({
      where: { id: item.id },
      update: {},
      create: item,
    })
  }

  console.log('✅ Dettagli fatture creati')

  // 7. Movimenti Magazzino
  const stockMovements = [
    {
      tenantId: tenant.id,
      productId: 'prod-1',
      movementType: 'IN',
      quantity: 50,
      reference: 'ORD-2024-001',
      notes: 'Carico iniziale magazzino',
    },
    {
      tenantId: tenant.id,
      productId: 'prod-1',
      movementType: 'OUT',
      quantity: 25,
      reference: 'FAT-2024-001',
      notes: 'Vendita a Mario Rossi',
    },
    {
      tenantId: tenant.id,
      productId: 'prod-3',
      movementType: 'IN',
      quantity: 200,
      reference: 'ORD-2024-002',
      notes: 'Carico fornitura',
    },
    {
      tenantId: tenant.id,
      productId: 'prod-3',
      movementType: 'OUT',
      quantity: 50,
      reference: 'FAT-2024-003',
      notes: 'Vendita a Giuseppe Verdi',
    }
  ]

  for (const movement of stockMovements) {
    await prisma.stockMovement.upsert({
      where: { id: `movement-${Date.now()}-${Math.random()}` },
      update: {},
      create: {
        ...movement,
        id: `movement-${Date.now()}-${Math.random()}`,
        movementDate: new Date(),
      },
    })
  }

  console.log('✅ Movimenti magazzino creati')

  console.log('🎉 Seed database completato con successo!')
  console.log('')
  console.log('📊 Dati creati:')
  console.log('  - 1 Utente Admin')
  console.log('  - 1 Tenant (Azienda Demo)')
  console.log('  - 3 Clienti')
  console.log('  - 4 Prodotti')
  console.log('  - 3 Fatture')
  console.log('  - 3 Invoice Items')
  console.log('  - 4 Movimenti Magazzino')
  console.log('')
  console.log('🔑 Credenziali per accesso:')
  console.log('  Email: admin@nexora.com')
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
