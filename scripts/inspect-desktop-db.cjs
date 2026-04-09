process.env.DATABASE_URL = 'file:C:/Users/User/AppData/Roaming/NEXORA/db/dev.db'

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

function toJson(value) {
  return JSON.stringify(
    value,
    (_, current) => (typeof current === 'bigint' ? Number(current) : current),
    2
  )
}

async function main() {
  const tenants = await prisma.tenant.findMany({
    select: { id: true, name: true }
  })

  const customerCols = await prisma.$queryRawUnsafe("PRAGMA table_info('Customer')")
  const repairCols = await prisma.$queryRawUnsafe("PRAGMA table_info('Repair')")
  const expenseCols = await prisma.$queryRawUnsafe("PRAGMA table_info('Expense')")
  const paymentCols = await prisma.$queryRawUnsafe("PRAGMA table_info('Payment')")

  console.log(toJson({
    tenants,
    customerCols,
    repairCols,
    expenseCols,
    paymentCols
  }))
}

main()
  .catch(async error => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
