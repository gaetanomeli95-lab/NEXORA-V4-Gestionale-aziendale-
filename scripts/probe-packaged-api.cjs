const fs = require('fs')
const path = require('path')
const { spawn } = require('child_process')

const sourceDb = 'C:/Users/User/AppData/Roaming/NEXORA/db/dev.db'
const tempDb = path.join(__dirname, 'desktop-probe.db')
const serverCwd = 'C:/Users/User/Desktop/Softshop v4/dist-electron/win-unpacked/resources/app'
const port = 3017
const baseUrl = `http://127.0.0.1:${port}`

async function waitForServer() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const res = await fetch(`${baseUrl}/api/customers?limit=1`)
      if (res.ok) return
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  throw new Error('Server did not start in time')
}

async function callApi(label, pathname, options = {}) {
  const res = await fetch(`${baseUrl}${pathname}`, options)
  const text = await res.text()
  console.log(`\n=== ${label} ===`)
  console.log(`STATUS: ${res.status}`)
  console.log(text)
}

async function main() {
  if (fs.existsSync(tempDb)) {
    fs.unlinkSync(tempDb)
  }

  fs.copyFileSync(sourceDb, tempDb)

  const server = spawn(process.execPath, ['.next/standalone/server.js'], {
    cwd: serverCwd,
    env: {
      ...process.env,
      PORT: String(port),
      HOSTNAME: '127.0.0.1',
      NODE_ENV: 'production',
      DATABASE_URL: `file:${tempDb.replace(/\\/g, '/')}`
    },
    stdio: ['ignore', 'pipe', 'pipe']
  })

  server.stdout.on('data', chunk => process.stdout.write(`[server] ${chunk}`))
  server.stderr.on('data', chunk => process.stderr.write(`[server:error] ${chunk}`))

  try {
    await waitForServer()

    const stamp = Date.now()

    await callApi('POST /api/customers', '/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Probe Customer ${stamp}`,
        businessName: `Probe Customer ${stamp}`,
        email: `probe-${stamp}@example.com`,
        phone: '123456789',
        address: 'Via Test 1',
        city: 'Milano',
        province: 'MI',
        postalCode: '20100',
        country: 'Italia',
        vatNumber: `IT${stamp}`,
        fiscalCode: `FSC${stamp}`,
        paymentTerms: '30GG',
        creditLimit: 0,
        notes: 'probe'
      })
    })

    await callApi('POST /api/repairs', '/api/repairs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        repairDate: '2026-04-01',
        status: 'IN LAVORAZIONE',
        paymentStatus: 'NON PAGATO',
        description: 'Probe repair',
        brand: 'HP',
        model: 'Test',
        serialNumber: `SN-${stamp}`,
        totalAmount: 100,
        depositAmount: 0,
        paidAmount: 0,
        notes: 'probe'
      })
    })

    await callApi('POST /api/expenses', '/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'Generale',
        description: 'Probe expense',
        amount: 5,
        paymentMethod: 'CONTANTI',
        expenseDate: '2026-04-01',
        notes: 'probe'
      })
    })

    await callApi('POST /api/products', '/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Probe Product ${stamp}`,
        sku: '',
        code: `PROBE-${stamp}`,
        unitPrice: '10',
        costPrice: '5',
        markupRate: '100',
        taxRate: '22',
        unitOfMeasure: 'pz',
        stockQuantity: '0',
        minStockLevel: '0',
        trackStock: true
      })
    })

    await callApi('GET /api/cash-book', '/api/cash-book?startDate=2026-03-01&endDate=2026-04-01')
  } finally {
    server.kill()
    await new Promise(resolve => setTimeout(resolve, 500))
    if (fs.existsSync(tempDb)) {
      fs.unlinkSync(tempDb)
    }
  }
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
