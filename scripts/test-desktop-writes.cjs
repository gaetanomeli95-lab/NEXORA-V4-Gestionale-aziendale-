process.env.DATABASE_URL = 'file:C:/Users/User/AppData/Roaming/NEXORA/db/dev.db'

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function probe(label, runner) {
  try {
    await prisma.$transaction(async tx => {
      await runner(tx)
      throw new Error('__ROLLBACK__')
    })
  } catch (error) {
    if (error && error.message === '__ROLLBACK__') {
      console.log(`${label}: OK`)
      return
    }

    console.log(`${label}: FAIL`)
    console.error(error)
  }
}

async function main() {
  const stamp = Date.now()

  await probe('customer.create', tx => tx.customer.create({
    data: {
      tenantId: 'demo-tenant',
      name: `Debug Customer ${stamp}`,
      email: `debug-${stamp}@example.com`
    }
  }))

  await probe('repair.create', tx => tx.repair.create({
    data: {
      tenantId: 'demo-tenant',
      number: `RIP-DEBUG-${stamp}`,
      repairDate: new Date(),
      status: 'IN LAVORAZIONE',
      paymentStatus: 'NON PAGATO',
      totalAmount: 0,
      subtotal: 0,
      depositAmount: 0,
      paidAmount: 0,
      balanceAmount: 0
    }
  }))

  await probe('expense.create', tx => tx.expense.create({
    data: {
      tenantId: 'demo-tenant',
      category: 'Generale',
      description: `Debug Expense ${stamp}`,
      amount: 1,
      paymentMethod: 'CONTANTI',
      expenseDate: new Date()
    }
  }))

  await probe('product.create', tx => tx.product.create({
    data: {
      tenantId: 'demo-tenant',
      name: `Debug Product ${stamp}`,
      sku: null,
      code: `DBG-${stamp}`,
      unitPrice: 1,
      costPrice: 0,
      markupRate: 0,
      taxRate: 22,
      unitOfMeasure: 'pz',
      stockQuantity: 0,
      minStockLevel: 0,
      trackStock: true
    }
  }))
}

main()
  .catch(error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
