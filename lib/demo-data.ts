import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const DEFAULT_TENANT_ID = 'demo-tenant'
const DEFAULT_COMPANY_ID = 'company-demo'
const DEFAULT_ADMIN_EMAIL = 'admin@nexora.com'

const COMPANY_LOGO = 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80'

const CATEGORY_DEFINITIONS = [
  { id: 'cat-memory', name: 'Materassi Memory Foam', description: 'Materassi memory di fascia premium' },
  { id: 'cat-lattice', name: 'Materassi in Lattice', description: 'Materassi in lattice naturali e ortopedici' },
  { id: 'cat-springs', name: 'Materassi a Molle', description: 'Materassi a molle tradizionali e insacchettate' },
  { id: 'cat-bed-bases', name: 'Reti Letto', description: 'Reti manuali ed elettriche per ogni misura' },
  { id: 'cat-accessories', name: 'Accessori Riposo', description: 'Cuscini, topper e accessori premium' }
] as const

const SUPPLIER_DEFINITIONS = [
  {
    id: 'supplier-1',
    name: 'DormiBene Italia S.p.A.',
    contactName: 'Salvo Greco',
    email: 'ordini@dormibeneitalia.it',
    phone: '+39 091 5551001',
    address: 'Zona Industriale Brancaccio, Lotto 12',
    city: 'Palermo',
    province: 'PA',
    postalCode: '90121',
    vatNumber: 'IT02145670829'
  },
  {
    id: 'supplier-2',
    name: 'Relax System Sicilia',
    contactName: 'Giada Ferrante',
    email: 'commerciale@relaxsystemsicilia.it',
    phone: '+39 095 447781',
    address: 'Via Etnea 514',
    city: 'Catania',
    province: 'CT',
    postalCode: '95128',
    vatNumber: 'IT01833490874'
  },
  {
    id: 'supplier-3',
    name: 'TecnoReti Mediterraneo',
    contactName: 'Marco Vitale',
    email: 'backoffice@tecnoreti.it',
    phone: '+39 0922 301155',
    address: 'Contrada Calderaro 8',
    city: 'Agrigento',
    province: 'AG',
    postalCode: '92100',
    vatNumber: 'IT02677830849'
  },
  {
    id: 'supplier-4',
    name: 'Comfort Textile Lab',
    contactName: 'Alessia Bonanno',
    email: 'info@comforttextilelab.it',
    phone: '+39 090 991273',
    address: 'Via La Farina 202',
    city: 'Messina',
    province: 'ME',
    postalCode: '98123',
    vatNumber: 'IT03111460839'
  }
] as const

const PRODUCT_DEFINITIONS = [
  { id: 'prod-001', categoryId: 'cat-memory', supplierId: 'supplier-1', sku: 'MAT-MEM-080', name: 'Materasso Memory Foam Easy 80x190', description: 'Materasso memory foam entry level con rivestimento sfoderabile.', unitPrice: 329, costPrice: 182, stockQuantity: 14, minStockLevel: 4, reorderQty: 8 },
  { id: 'prod-002', categoryId: 'cat-memory', supplierId: 'supplier-1', sku: 'MAT-MEM-160', name: 'Materasso Memory Foam Queen 160x190', description: 'Materasso memory foam a 7 zone differenziate.', unitPrice: 699, costPrice: 388, stockQuantity: 2, minStockLevel: 5, reorderQty: 6 },
  { id: 'prod-003', categoryId: 'cat-memory', supplierId: 'supplier-1', sku: 'MAT-MEM-180', name: 'Materasso Memory King Deluxe 180x200', description: 'Materasso premium memory con topper integrato.', unitPrice: 1190, costPrice: 690, stockQuantity: 7, minStockLevel: 4, reorderQty: 4 },
  { id: 'prod-004', categoryId: 'cat-lattice', supplierId: 'supplier-2', sku: 'MAT-LAT-080', name: 'Materasso Lattice Natura 80x190', description: 'Materasso in lattice naturale traspirante.', unitPrice: 520, costPrice: 301, stockQuantity: 8, minStockLevel: 3, reorderQty: 5 },
  { id: 'prod-005', categoryId: 'cat-lattice', supplierId: 'supplier-2', sku: 'MAT-LAT-160', name: 'Materasso Lattice Natura Queen 160x190', description: 'Materasso matrimoniale in lattice ad alta portanza.', unitPrice: 890, costPrice: 522, stockQuantity: 6, minStockLevel: 3, reorderQty: 4 },
  { id: 'prod-006', categoryId: 'cat-springs', supplierId: 'supplier-1', sku: 'MAT-MOL-080', name: 'Materasso Molle Comfort 80x190', description: 'Materasso a molle tradizionali per uso quotidiano.', unitPrice: 249, costPrice: 132, stockQuantity: 11, minStockLevel: 4, reorderQty: 8 },
  { id: 'prod-007', categoryId: 'cat-springs', supplierId: 'supplier-1', sku: 'MAT-MOL-160', name: 'Materasso Molle Insacchettate Queen 160x190', description: 'Materasso a molle indipendenti con supporto rinforzato.', unitPrice: 640, costPrice: 352, stockQuantity: 5, minStockLevel: 4, reorderQty: 5 },
  { id: 'prod-008', categoryId: 'cat-springs', supplierId: 'supplier-1', sku: 'MAT-ORT-090', name: 'Materasso Ortopedico Firm 90x200', description: 'Materasso ortopedico rigido per supporto lombare.', unitPrice: 379, costPrice: 210, stockQuantity: 9, minStockLevel: 3, reorderQty: 6 },
  { id: 'prod-009', categoryId: 'cat-bed-bases', supplierId: 'supplier-3', sku: 'RET-MAN-080', name: 'Rete Manuale Classic 80x190', description: 'Rete a doghe manuale con telaio in faggio.', unitPrice: 189, costPrice: 95, stockQuantity: 12, minStockLevel: 4, reorderQty: 10 },
  { id: 'prod-010', categoryId: 'cat-bed-bases', supplierId: 'supplier-3', sku: 'RET-MAN-160', name: 'Rete Manuale Queen 160x190', description: 'Rete matrimoniale a doppia campata.', unitPrice: 320, costPrice: 180, stockQuantity: 7, minStockLevel: 3, reorderQty: 6 },
  { id: 'prod-011', categoryId: 'cat-bed-bases', supplierId: 'supplier-3', sku: 'RET-ELT-080', name: 'Rete Elettrica Smart 80x190', description: 'Rete motorizzata con telecomando wireless.', unitPrice: 620, costPrice: 368, stockQuantity: 2, minStockLevel: 4, reorderQty: 4 },
  { id: 'prod-012', categoryId: 'cat-bed-bases', supplierId: 'supplier-3', sku: 'RET-ELT-160', name: 'Rete Elettrica Duo 160x190', description: 'Rete elettrica matrimoniale con motori indipendenti.', unitPrice: 980, costPrice: 585, stockQuantity: 0, minStockLevel: 3, reorderQty: 3 },
  { id: 'prod-013', categoryId: 'cat-accessories', supplierId: 'supplier-4', sku: 'CUS-MEM-001', name: 'Cuscino Ortopedico Memory Cervicale', description: 'Cuscino ergonomico memory foam antiacaro.', unitPrice: 69, costPrice: 24, stockQuantity: 26, minStockLevel: 8, reorderQty: 20 },
  { id: 'prod-014', categoryId: 'cat-accessories', supplierId: 'supplier-4', sku: 'CUS-LAT-002', name: 'Cuscino Lattice Fresh', description: 'Cuscino in lattice con foratura traspirante.', unitPrice: 84, costPrice: 31, stockQuantity: 18, minStockLevel: 6, reorderQty: 12 },
  { id: 'prod-015', categoryId: 'cat-accessories', supplierId: 'supplier-4', sku: 'TOP-MEM-160', name: 'Topper Memory Premium 160x190', description: 'Topper da 6 cm per migliorare il comfort del letto.', unitPrice: 210, costPrice: 98, stockQuantity: 6, minStockLevel: 4, reorderQty: 6 },
  { id: 'prod-016', categoryId: 'cat-accessories', supplierId: 'supplier-4', sku: 'COP-EST-160', name: 'Coprimaterasso Aloe 160x190', description: 'Coprimaterasso elasticizzato con trattamento aloe.', unitPrice: 59, costPrice: 18, stockQuantity: 21, minStockLevel: 6, reorderQty: 16 },
  { id: 'prod-017', categoryId: 'cat-accessories', supplierId: 'supplier-4', sku: 'KIT-CURA-001', name: 'Kit Cura Materasso Premium', description: 'Kit con spray igienizzante e accessori manutenzione.', unitPrice: 54, costPrice: 14, stockQuantity: 15, minStockLevel: 5, reorderQty: 10 },
  { id: 'prod-018', categoryId: 'cat-memory', supplierId: 'supplier-2', sku: 'MAT-HYB-160', name: 'Materasso Hybrid Pocket Queen 160x190', description: 'Materasso ibrido memory e molle insacchettate.', unitPrice: 940, costPrice: 548, stockQuantity: 4, minStockLevel: 4, reorderQty: 4 },
  { id: 'prod-019', categoryId: 'cat-bed-bases', supplierId: 'supplier-3', sku: 'RET-FIX-180', name: 'Rete Fissa King 180x200', description: 'Rete fissa rinforzata per materassi king size.', unitPrice: 275, costPrice: 144, stockQuantity: 1, minStockLevel: 3, reorderQty: 4 },
  { id: 'prod-020', categoryId: 'cat-accessories', supplierId: 'supplier-4', sku: 'TOP-GEL-180', name: 'Topper Cooling Gel 180x200', description: 'Topper rinfrescante in gel per uso premium.', unitPrice: 259, costPrice: 126, stockQuantity: 0, minStockLevel: 2, reorderQty: 4 }
] as const

const CUSTOMER_NAMES = [
  ['Luca', 'Rossi'], ['Francesca', 'Greco'], ['Paolo', 'Vitale'], ['Elena', 'Leone'],
  ['Marco', 'Bellini'], ['Chiara', 'Romano'], ['Fabio', 'Conti'], ['Serena', 'Ricci'],
  ['Davide', 'Esposito'], ['Giorgia', 'Ferri'], ['Matteo', 'Sala'], ['Silvia', 'Gallo'],
  ['Roberto', 'Costa'], ['Federica', 'Marino'], ['Andrea', 'Bruno'], ['Noemi', 'Messina'],
  ['Stefano', 'Basile'], ['Valentina', 'Caruso'], ['Pietro', 'Santoro'], ['Irene', 'Parisi'],
  ['Salvatore', 'Rizzo'], ['Alessia', 'Moretti'], ['Claudio', 'Bianchi'], ['Marta', 'De Luca'],
  ['Enrico', 'Giordano']
] as const

const CUSTOMER_BUSINESSES = [
  { name: 'Ristorante Da Mario', legalName: 'Ristorante Da Mario S.r.l.', businessName: 'Ristorante Da Mario' },
  { name: 'Hotel Belvedere', legalName: 'Hotel Belvedere S.p.A.', businessName: 'Hotel Belvedere' },
  { name: 'Studio Dentistico Sorriso', legalName: 'Studio Dentistico Sorriso STP', businessName: 'Studio Dentistico Sorriso' },
  { name: 'Residence Le Palme', legalName: 'Residence Le Palme S.r.l.', businessName: 'Residence Le Palme' },
  { name: 'B&B Porto Nuovo', legalName: 'B&B Porto Nuovo S.a.s.', businessName: 'B&B Porto Nuovo' },
  { name: 'Clinica San Luca', legalName: 'Clinica San Luca S.r.l.', businessName: 'Clinica San Luca' },
  { name: 'ArredoCasa Design', legalName: 'ArredoCasa Design S.r.l.', businessName: 'ArredoCasa Design' }
] as const

const CUSTOMER_CITIES = [
  ['Palermo', 'PA', '90141', 'Via Libertà'],
  ['Bagheria', 'PA', '90011', 'Via Dante'],
  ['Monreale', 'PA', '90046', 'Via Venero'],
  ['Catania', 'CT', '95129', 'Corso Italia'],
  ['Messina', 'ME', '98122', 'Via Garibaldi'],
  ['Trapani', 'TP', '91100', 'Via Fardella'],
  ['Marsala', 'TP', '91025', 'Via Mazzini'],
  ['Agrigento', 'AG', '92100', 'Viale della Vittoria'],
  ['Siracusa', 'SR', '96100', 'Corso Gelone'],
  ['Ragusa', 'RG', '97100', 'Via Archimede']
] as const

const VAT_RATE = 22

type LineInput = {
  productId: string
  quantity: number
  discount?: number
}

type InvoicePlan = {
  id: string
  number: string
  customerId: string
  issueOffset: number
  dueOffset: number
  status: string
  paymentStatus: string
  paidAmount?: number
  paymentMethod: string
  lines: LineInput[]
}

type EstimatePlan = {
  id: string
  number: string
  customerId: string
  issueOffset: number
  dueOffset: number
  deliveryOffset: number
  status: string
  paymentStatus: string
  stockStatus: string
  probability: number
  lines: LineInput[]
}

const shiftDate = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date
}

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/^\.|\.$/g, '')

function buildCustomers(companyId: string) {
  return CUSTOMER_NAMES.map(([firstName, lastName], index) => {
    const city = CUSTOMER_CITIES[index % CUSTOMER_CITIES.length]
    const streetNumber = 10 + index * 3
    const fullName = `${firstName} ${lastName}`
    const business = CUSTOMER_BUSINESSES[Math.floor(index / 4)] as { name?: string; legalName?: string; businessName?: string } | undefined
    const isCompany = index % 4 === 0
    const businessDisplayName = business?.name || fullName
    const businessLegalName = business?.legalName || businessDisplayName
    const businessCompanyName = business?.businessName || businessDisplayName
    const email = isCompany
      ? `${slugify(businessCompanyName || fullName)}@azienda.it`
      : `${slugify(`${firstName}.${lastName}`)}@email.it`
    const phone = isCompany
      ? `+39 091 ${String(550000 + index * 17).slice(0, 6)}`
      : `+39 3${String(20 + (index % 70)).padStart(2, '0')} ${String(1000000 + index * 431).slice(0, 7)}`

    return {
      id: `customer-${String(index + 1).padStart(3, '0')}`,
      tenantId: DEFAULT_TENANT_ID,
      companyId,
      code: `CLI-${String(index + 1).padStart(3, '0')}`,
      type: isCompany ? 'COMPANY' : 'PRIVATE',
      name: isCompany ? businessDisplayName : fullName,
      legalName: isCompany ? businessLegalName : undefined,
      businessName: isCompany ? businessCompanyName : undefined,
      firstName: isCompany ? undefined : firstName,
      lastName: isCompany ? undefined : lastName,
      fiscalCode: `CF${String(10000000 + index).padStart(8, '0')}`,
      vatNumber: isCompany ? `IT${String(23000000000 + index).padStart(11, '0')}` : undefined,
      email,
      phone,
      mobile: phone,
      address: `${city[3]} ${streetNumber}`,
      city: city[0],
      province: city[1],
      postalCode: city[2],
      country: 'IT',
      billingAddress: `${city[3]} ${streetNumber}, ${city[2]} ${city[0]} (${city[1]})`,
      shippingAddress: `${city[3]} ${streetNumber + 1}, ${city[2]} ${city[0]} (${city[1]})`,
      paymentTerms: index % 3 === 0 ? 'NET15' : index % 3 === 1 ? 'NET30' : 'NET60',
      creditLimit: 1500 + index * 250,
      preferredContact: index % 2 === 0 ? 'PHONE' : 'EMAIL',
      status: 'ACTIVE',
      rating: (index % 5) + 1,
      notes: isCompany
        ? 'Cliente business ad alto potenziale, interessato a forniture camere o strutture ricettive.'
        : index % 6 === 0 ? 'Cliente interessato a promo bundle rete + materasso.' : undefined,
      isActive: true,
      lastContactAt: shiftDate(-(index + 2))
    }
  })
}

function computeLines(productMap: Map<string, typeof PRODUCT_DEFINITIONS[number]>, lines: readonly LineInput[]) {
  let subtotal = 0
  let taxAmount = 0

  const items = lines.map((line, index) => {
    const product = productMap.get(line.productId)
    if (!product) {
      throw new Error(`Prodotto demo non trovato: ${line.productId}`)
    }

    const discount = line.discount || 0
    const unitPrice = product.unitPrice
    const lineNet = line.quantity * unitPrice * (1 - discount / 100)
    const lineTax = Number((lineNet * (VAT_RATE / 100)).toFixed(2))

    subtotal += lineNet
    taxAmount += lineTax

    return {
      productId: product.id,
      code: product.sku,
      description: product.name,
      quantity: line.quantity,
      unit: 'pz',
      unitPrice,
      totalPrice: Number(lineNet.toFixed(2)),
      price: unitPrice,
      total: Number(lineNet.toFixed(2)),
      discount,
      taxRate: VAT_RATE,
      vatRate: VAT_RATE,
      taxAmount: lineTax,
      sortOrder: index,
      order: index,
      notes: undefined
    }
  })

  const subtotalRounded = Number(subtotal.toFixed(2))
  const taxRounded = Number(taxAmount.toFixed(2))
  const totalRounded = Number((subtotalRounded + taxRounded).toFixed(2))

  return { items, subtotal: subtotalRounded, taxAmount: taxRounded, totalAmount: totalRounded }
}

const INVOICE_LINE_TEMPLATES: LineInput[][] = [
  [{ productId: 'prod-001', quantity: 1 }, { productId: 'prod-013', quantity: 2 }],
  [{ productId: 'prod-006', quantity: 1 }, { productId: 'prod-009', quantity: 1 }],
  [{ productId: 'prod-004', quantity: 1 }, { productId: 'prod-014', quantity: 2 }],
  [{ productId: 'prod-002', quantity: 1 }, { productId: 'prod-015', quantity: 1 }],
  [{ productId: 'prod-007', quantity: 1 }, { productId: 'prod-016', quantity: 1 }, { productId: 'prod-017', quantity: 1 }],
  [{ productId: 'prod-010', quantity: 1 }, { productId: 'prod-005', quantity: 1 }],
  [{ productId: 'prod-011', quantity: 1 }, { productId: 'prod-013', quantity: 2 }],
  [{ productId: 'prod-018', quantity: 1 }, { productId: 'prod-020', quantity: 1 }],
  [{ productId: 'prod-003', quantity: 1 }, { productId: 'prod-019', quantity: 1 }],
  [{ productId: 'prod-012', quantity: 1 }, { productId: 'prod-014', quantity: 2 }]
]

function buildInvoicePlans(customers: Array<{ id: string }>): InvoicePlan[] {
  const paidIssueOffsets = [-170, -164, -158, -152, -146, -138, -132, -126, -118, -112, -106, -98, -92, -84, -78, -70, -64, -56, -48, -40, -34, -28, -22, -16, -10]
  const upcomingIssueOffsets = [-26, -23, -21, -18, -16, -14, -11, -9, -7, -5]
  const overdueIssueOffsets = [-44, -37, -31, -24, -19]
  const upcomingDueOffsets = [3, 4, 5, 3, 4, 5, 3, 4, 5, 4]
  const overdueDueOffsets = [-16, -14, -13, -12, -10]
  const paymentMethods = ['BANK_TRANSFER', 'POS', 'CASH']
  const plans: InvoicePlan[] = []

  let sequence = 1

  paidIssueOffsets.forEach((issueOffset, index) => {
    plans.push({
      id: `inv-${String(sequence).padStart(3, '0')}`,
      number: `FAT-2026-${String(sequence).padStart(3, '0')}`,
      customerId: customers[(index * 2) % customers.length].id,
      issueOffset,
      dueOffset: issueOffset + 18 + (index % 6),
      status: 'PAID',
      paymentStatus: 'PAID',
      paidAmount: undefined,
      paymentMethod: paymentMethods[index % paymentMethods.length],
      lines: INVOICE_LINE_TEMPLATES[index % INVOICE_LINE_TEMPLATES.length]
    })
    sequence++
  })

  upcomingIssueOffsets.forEach((issueOffset, index) => {
    plans.push({
      id: `inv-${String(sequence).padStart(3, '0')}`,
      number: `FAT-2026-${String(sequence).padStart(3, '0')}`,
      customerId: customers[(index * 2 + 1) % customers.length].id,
      issueOffset,
      dueOffset: upcomingDueOffsets[index],
      status: 'SENT',
      paymentStatus: 'UNPAID',
      paidAmount: 0,
      paymentMethod: 'BANK_TRANSFER',
      lines: INVOICE_LINE_TEMPLATES[(index + 3) % INVOICE_LINE_TEMPLATES.length]
    })
    sequence++
  })

  overdueIssueOffsets.forEach((issueOffset, index) => {
    plans.push({
      id: `inv-${String(sequence).padStart(3, '0')}`,
      number: `FAT-2026-${String(sequence).padStart(3, '0')}`,
      customerId: customers[(index * 3 + 2) % customers.length].id,
      issueOffset,
      dueOffset: overdueDueOffsets[index],
      status: 'OVERDUE',
      paymentStatus: 'UNPAID',
      paidAmount: 0,
      paymentMethod: 'BANK_TRANSFER',
      lines: INVOICE_LINE_TEMPLATES[(index + 7) % INVOICE_LINE_TEMPLATES.length]
    })
    sequence++
  })

  return plans
}

function buildEstimatePlans(customers: Array<{ id: string }>): EstimatePlan[] {
  const configurations = [
    { status: 'DRAFT', paymentStatus: 'NON PAGATO', stockStatus: 'DA SCARICARE', probability: 30, issueOffset: -18, dueOffset: 15, deliveryOffset: 20 },
    { status: 'DRAFT', paymentStatus: 'NON PAGATO', stockStatus: 'DA SCARICARE', probability: 35, issueOffset: -15, dueOffset: 14, deliveryOffset: 18 },
    { status: 'DRAFT', paymentStatus: 'NON PAGATO', stockStatus: 'DA SCARICARE', probability: 40, issueOffset: -11, dueOffset: 12, deliveryOffset: 16 },
    { status: 'DRAFT', paymentStatus: 'NON PAGATO', stockStatus: 'DA SCARICARE', probability: 25, issueOffset: -8, dueOffset: 10, deliveryOffset: 15 },
    { status: 'SENT', paymentStatus: 'NON PAGATO', stockStatus: 'DA SCARICARE', probability: 60, issueOffset: -9, dueOffset: 9, deliveryOffset: 12 },
    { status: 'SENT', paymentStatus: 'NON PAGATO', stockStatus: 'DA SCARICARE', probability: 65, issueOffset: -7, dueOffset: 8, deliveryOffset: 11 },
    { status: 'SENT', paymentStatus: 'NON PAGATO', stockStatus: 'DA SCARICARE', probability: 70, issueOffset: -5, dueOffset: 7, deliveryOffset: 10 },
    { status: 'ACCEPTED', paymentStatus: 'PARZIALMENTE PAGATO', stockStatus: 'SCARICATO', probability: 85, issueOffset: -6, dueOffset: 6, deliveryOffset: 8 },
    { status: 'ACCEPTED', paymentStatus: 'PARZIALMENTE PAGATO', stockStatus: 'SCARICATO', probability: 90, issueOffset: -4, dueOffset: 5, deliveryOffset: 7 },
    { status: 'ACCEPTED', paymentStatus: 'NON PAGATO', stockStatus: 'DA SCARICARE', probability: 75, issueOffset: -2, dueOffset: 4, deliveryOffset: 6 }
  ]

  return configurations.map((configuration, index) => ({
    id: `est-${String(index + 1).padStart(3, '0')}`,
    number: `PRE-2026-${String(index + 1).padStart(3, '0')}`,
    customerId: customers[(index * 2 + 1) % customers.length].id,
    issueOffset: configuration.issueOffset,
    dueOffset: configuration.dueOffset,
    deliveryOffset: configuration.deliveryOffset,
    status: configuration.status,
    paymentStatus: configuration.paymentStatus,
    stockStatus: configuration.stockStatus,
    probability: configuration.probability,
    lines: INVOICE_LINE_TEMPLATES[(index + 1) % INVOICE_LINE_TEMPLATES.length]
  }))
}

function buildRepairPlans(tenantId: string, customers: Array<{ id: string }>) {
  return [
    {
      id: 'rep-001', tenantId, customerId: customers[2].id, number: 'RIP-2026-001', repairDate: shiftDate(-12), deliveryDate: shiftDate(2), status: 'IN LAVORAZIONE', paymentStatus: 'NON PAGATO',
      description: 'Sostituzione fodera materasso matrimoniale con cucitura laterale usurata.', brand: 'CF SleepLab', model: 'Materasso Memory Foam Queen 160x190', serialNumber: 'CFM-160-2025-019', subtotal: 120, depositAmount: 0, paidAmount: 0, totalAmount: 146.4, balanceAmount: 146.4,
      notes: 'Cliente richiede riconsegna entro il weekend.', internalNotes: 'Verificare idoneità garanzia vendita FAT-2026-006.'
    },
    {
      id: 'rep-002', tenantId, customerId: customers[9].id, number: 'RIP-2026-002', repairDate: shiftDate(-8), deliveryDate: shiftDate(1), status: 'PRONTO', paymentStatus: 'ACCONTO',
      description: 'Sostituzione motore rete elettrica lato sinistro.', brand: 'TecnoReti', model: 'Rete Elettrica Duo 160x190', serialNumber: 'TRD-160-2024-884', subtotal: 220, depositAmount: 80, paidAmount: 80, totalAmount: 268.4, balanceAmount: 188.4,
      notes: 'Prodotto pronto per il ritiro showroom Palermo.', internalNotes: 'Cliente da contattare oggi pomeriggio.'
    },
    {
      id: 'rep-003', tenantId, customerId: customers[13].id, number: 'RIP-2026-003', repairDate: shiftDate(-7), deliveryDate: shiftDate(3), status: 'IN LAVORAZIONE', paymentStatus: 'NON PAGATO',
      description: 'Controllo rumorosità su rete manuale con doghe allentate.', brand: 'TecnoReti', model: 'Rete Manuale Queen 160x190', serialNumber: 'TRM-160-2023-221', subtotal: 65, depositAmount: 0, paidAmount: 0, totalAmount: 79.3, balanceAmount: 79.3,
      notes: 'In attesa conferma cliente per sostituzione kit doghe.', internalNotes: 'Possibile upsell rete elettrica.'
    },
    {
      id: 'rep-004', tenantId, customerId: customers[5].id, number: 'RIP-2026-004', repairDate: shiftDate(-6), deliveryDate: shiftDate(1), status: 'PRONTO', paymentStatus: 'NON PAGATO',
      description: 'Riposizionamento imbottitura su topper premium 160x190.', brand: 'Comfort Textile', model: 'Topper Memory Premium 160x190', serialNumber: 'TOP-160-2025-332', subtotal: 74, depositAmount: 0, paidAmount: 0, totalAmount: 90.28, balanceAmount: 90.28,
      notes: 'Pronto a banco, attendere conferma cliente.', internalNotes: 'Proporre upgrade cuscini memory.'
    },
    {
      id: 'rep-005', tenantId, customerId: customers[18].id, number: 'RIP-2026-005', repairDate: shiftDate(-5), deliveryDate: shiftDate(2), status: 'PRONTO', paymentStatus: 'ACCONTO',
      description: 'Sostituzione piedini su rete fissa king size.', brand: 'TecnoReti', model: 'Rete Fissa King 180x200', serialNumber: 'RFK-180-2024-088', subtotal: 95, depositAmount: 40, paidAmount: 40, totalAmount: 115.9, balanceAmount: 75.9,
      notes: 'Articolo già testato in laboratorio.', internalNotes: 'Ritiro previsto entro 48h.'
    },
    {
      id: 'rep-006', tenantId, customerId: customers[20].id, number: 'RIP-2026-006', repairDate: shiftDate(-14), deliveryDate: shiftDate(-3), status: 'CONSEGNATO', paymentStatus: 'PAGATO',
      description: 'Sostituzione cerniera su rivestimento materasso memory.', brand: 'CF SleepLab', model: 'Materasso Memory Foam Easy 80x190', serialNumber: 'CFE-080-2024-501', subtotal: 58, depositAmount: 0, paidAmount: 70.76, totalAmount: 70.76, balanceAmount: 0,
      notes: 'Consegnato al cliente in showroom.', internalNotes: 'Cliente soddisfatto, nessuna anomalia residua.'
    },
    {
      id: 'rep-007', tenantId, customerId: customers[7].id, number: 'RIP-2026-007', repairDate: shiftDate(-10), deliveryDate: shiftDate(-1), status: 'CONSEGNATO', paymentStatus: 'PAGATO',
      description: 'Taratura telecomando e centralina rete elettrica smart.', brand: 'TecnoReti', model: 'Rete Elettrica Smart 80x190', serialNumber: 'RES-080-2024-731', subtotal: 110, depositAmount: 0, paidAmount: 134.2, totalAmount: 134.2, balanceAmount: 0,
      notes: 'Intervento concluso con test completo.', internalNotes: 'Aggiunto promemoria manutenzione annuale.'
    },
    {
      id: 'rep-008', tenantId, customerId: customers[23].id, number: 'RIP-2026-008', repairDate: shiftDate(-9), deliveryDate: shiftDate(-2), status: 'CONSEGNATO', paymentStatus: 'PAGATO',
      description: 'Sostituzione inserto gel su topper cooling king.', brand: 'Comfort Textile', model: 'Topper Cooling Gel 180x200', serialNumber: 'TCG-180-2025-119', subtotal: 88, depositAmount: 0, paidAmount: 107.36, totalAmount: 107.36, balanceAmount: 0,
      notes: 'Riconsegnato con imballo nuovo.', internalNotes: 'Riparazione chiusa con esito positivo.'
    }
  ]
}

async function clearDemoTenant(prisma: PrismaClient) {
  const invoiceIds = (await prisma.invoice.findMany({ where: { tenantId: DEFAULT_TENANT_ID }, select: { id: true } })).map((item) => item.id)
  const estimateIds = (await prisma.estimate.findMany({ where: { tenantId: DEFAULT_TENANT_ID }, select: { id: true } })).map((item) => item.id)
  const orderIds = (await prisma.order.findMany({ where: { tenantId: DEFAULT_TENANT_ID }, select: { id: true } })).map((item) => item.id)
  const supplierOrderIds = (await prisma.supplierOrder.findMany({ where: { tenantId: DEFAULT_TENANT_ID }, select: { id: true } })).map((item) => item.id)
  const customerIds = (await prisma.customer.findMany({ where: { tenantId: DEFAULT_TENANT_ID }, select: { id: true } })).map((item) => item.id)
  const companyIds = (await prisma.company.findMany({ where: { tenantId: DEFAULT_TENANT_ID }, select: { id: true } })).map((item) => item.id)

  await prisma.notification.deleteMany({ where: { tenantId: DEFAULT_TENANT_ID } })
  await prisma.auditLog.deleteMany({ where: { tenantId: DEFAULT_TENANT_ID } })
  await prisma.document.deleteMany({ where: { tenantId: DEFAULT_TENANT_ID } })
  await prisma.payment.deleteMany({ where: { tenantId: DEFAULT_TENANT_ID } })
  await prisma.stockMovement.deleteMany({ where: { tenantId: DEFAULT_TENANT_ID } })
  await prisma.expense.deleteMany({ where: { tenantId: DEFAULT_TENANT_ID } })
  await prisma.invoiceItem.deleteMany({ where: { invoiceId: { in: invoiceIds } } })
  await prisma.estimateItem.deleteMany({ where: { estimateId: { in: estimateIds } } })
  await prisma.orderItem.deleteMany({ where: { orderId: { in: orderIds } } })
  await prisma.supplierOrderItem.deleteMany({ where: { supplierOrderId: { in: supplierOrderIds } } })
  await prisma.ddt.deleteMany({ where: { tenantId: DEFAULT_TENANT_ID } })
  await prisma.repair.deleteMany({ where: { tenantId: DEFAULT_TENANT_ID } })
  await prisma.invoice.deleteMany({ where: { tenantId: DEFAULT_TENANT_ID } })
  await prisma.estimate.deleteMany({ where: { tenantId: DEFAULT_TENANT_ID } })
  await prisma.order.deleteMany({ where: { tenantId: DEFAULT_TENANT_ID } })
  await prisma.supplierOrder.deleteMany({ where: { tenantId: DEFAULT_TENANT_ID } })
  await prisma.contact.deleteMany({ where: { customerId: { in: customerIds } } })
  await prisma.customer.deleteMany({ where: { tenantId: DEFAULT_TENANT_ID } })
  await prisma.product.deleteMany({ where: { tenantId: DEFAULT_TENANT_ID } })
  await prisma.supplier.deleteMany({ where: { tenantId: DEFAULT_TENANT_ID } })
  await prisma.productCategory.deleteMany({ where: { tenantId: DEFAULT_TENANT_ID } })
  await prisma.userCompany.deleteMany({ where: { companyId: { in: companyIds } } })
  await prisma.company.deleteMany({ where: { tenantId: DEFAULT_TENANT_ID } })
  await prisma.user.deleteMany({ where: { tenantId: DEFAULT_TENANT_ID } })
}

async function summarizeDemoTenant(prisma: PrismaClient) {
  return {
    customers: await prisma.customer.count({ where: { tenantId: DEFAULT_TENANT_ID } }),
    invoices: await prisma.invoice.count({ where: { tenantId: DEFAULT_TENANT_ID } }),
    estimates: await prisma.estimate.count({ where: { tenantId: DEFAULT_TENANT_ID } }),
    repairs: await prisma.repair.count({ where: { tenantId: DEFAULT_TENANT_ID } }),
    products: await prisma.product.count({ where: { tenantId: DEFAULT_TENANT_ID } }),
    payments: await prisma.payment.count({ where: { tenantId: DEFAULT_TENANT_ID } }),
    expenses: await prisma.expense.count({ where: { tenantId: DEFAULT_TENANT_ID } }),
  }
}

export async function clearDemoData(prisma: PrismaClient) {
  const summary = await summarizeDemoTenant(prisma)

  await clearDemoTenant(prisma)
  await prisma.tenant.deleteMany({ where: { id: DEFAULT_TENANT_ID } })

  return summary
}

export async function resetDemoData(prisma: PrismaClient) {
  await clearDemoData(prisma)

  const tenant = await prisma.tenant.upsert({
    where: { id: DEFAULT_TENANT_ID },
    update: {
      name: 'CF Materassi Srl',
      legalName: 'CF Materassi Srl',
      subdomain: 'demo',
      logo: COMPANY_LOGO,
      vatNumber: 'IT02944520827',
      fiscalCode: '02944520827',
      address: 'Via Ugo La Malfa 91',
      city: 'Palermo',
      province: 'PA',
      postalCode: '90146',
      country: 'IT',
      phone: '+39 091 7745123',
      email: 'info@cfmaterassi-demo.it',
      website: 'https://demo.cfmaterassi.it',
      subscriptionPlan: 'ENTERPRISE',
      subscriptionStatus: 'ACTIVE',
      language: 'it',
      timezone: 'Europe/Rome',
      currency: 'EUR',
      dateFormat: 'DD/MM/YYYY',
      numberFormat: 'it-IT',
      primaryColor: '#0f766e',
      secondaryColor: '#0f172a',
      isActive: true
    },
    create: {
      id: DEFAULT_TENANT_ID,
      name: 'CF Materassi Srl',
      legalName: 'CF Materassi Srl',
      subdomain: 'demo',
      logo: COMPANY_LOGO,
      vatNumber: 'IT02944520827',
      fiscalCode: '02944520827',
      address: 'Via Ugo La Malfa 91',
      city: 'Palermo',
      province: 'PA',
      postalCode: '90146',
      country: 'IT',
      phone: '+39 091 7745123',
      email: 'info@cfmaterassi-demo.it',
      website: 'https://demo.cfmaterassi.it',
      subscriptionPlan: 'ENTERPRISE',
      subscriptionStatus: 'ACTIVE',
      language: 'it',
      timezone: 'Europe/Rome',
      currency: 'EUR',
      dateFormat: 'DD/MM/YYYY',
      numberFormat: 'it-IT',
      primaryColor: '#0f766e',
      secondaryColor: '#0f172a',
      isActive: true
    }
  })

  const company = await prisma.company.create({
    data: {
      id: DEFAULT_COMPANY_ID,
      tenantId: tenant.id,
      name: 'CF Materassi Srl',
      legalName: 'CF Materassi Srl',
      vatNumber: 'IT02944520827',
      taxCode: '02944520827',
      address: 'Via Ugo La Malfa 91',
      city: 'Palermo',
      province: 'PA',
      postalCode: '90146',
      country: 'IT',
      phone: '+39 091 7745123',
      email: 'info@cfmaterassi-demo.it',
      website: 'https://demo.cfmaterassi.it',
      logo: COMPANY_LOGO,
      type: 'COMPANY',
      isActive: true
    }
  })

  const adminUser = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: DEFAULT_ADMIN_EMAIL,
      name: 'Claudio Ferrante',
      firstName: 'Claudio',
      lastName: 'Ferrante',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
      isActive: true,
      emailVerified: new Date()
    }
  })

  await prisma.userCompany.create({
    data: {
      userId: adminUser.id,
      companyId: company.id,
      role: 'ADMIN',
      isDefault: true
    }
  })

  const customers = buildCustomers(company.id)
  await prisma.customer.createMany({ data: customers })
  await prisma.productCategory.createMany({ data: CATEGORY_DEFINITIONS.map((category) => ({ ...category, tenantId: tenant.id })) })
  await prisma.supplier.createMany({ data: SUPPLIER_DEFINITIONS.map((supplier) => ({ ...supplier, tenantId: tenant.id, country: 'IT', isActive: true })) })
  await prisma.product.createMany({
    data: PRODUCT_DEFINITIONS.map((product, index) => ({
      ...product,
      tenantId: tenant.id,
      code: product.sku,
      brand: product.name.includes('Rete') ? 'TecnoReti' : product.name.includes('Cuscino') || product.name.includes('Topper') ? 'Comfort Textile' : 'CF SleepLab',
      size: product.name.includes('80x190') ? '80x190' : product.name.includes('90x200') ? '90x200' : product.name.includes('160x190') ? '160x190' : product.name.includes('180x200') ? '180x200' : undefined,
      color: index % 3 === 0 ? 'Bianco' : index % 3 === 1 ? 'Avorio' : 'Grigio Perla',
      unitOfMeasure: 'pz',
      warehouseName: 'Magazzino Palermo',
      location: `Corsia ${String.fromCharCode(65 + (index % 4))}-${(index % 6) + 1}`,
      retailPrice: Number((product.unitPrice * 1.08).toFixed(2)),
      maxStockLevel: product.stockQuantity + product.reorderQty,
      reorderPoint: product.minStockLevel,
      trackStock: true,
      isActive: true,
      status: 'ACTIVE',
      taxRate: VAT_RATE,
      markupRate: Number((((product.unitPrice - product.costPrice) / product.costPrice) * 100).toFixed(2)),
      tags: JSON.stringify([
        product.categoryId.includes('memory') ? 'memory' : product.categoryId.includes('lattice') ? 'lattice' : product.categoryId.includes('springs') ? 'molle' : product.categoryId.includes('bed-bases') ? 'reti' : 'accessori',
        product.stockQuantity <= 4 ? 'riordino-prioritario' : 'pronta-consegna'
      ])
    }))
  })

  const productMap: Map<string, (typeof PRODUCT_DEFINITIONS)[number]> = new Map(
    PRODUCT_DEFINITIONS.map((product) => [product.id, product])
  )

  const invoicePlans = buildInvoicePlans(customers)

  for (const plan of invoicePlans) {
    const totals = computeLines(productMap, plan.lines)
    const paidAmount = typeof plan.paidAmount === 'number' ? plan.paidAmount : totals.totalAmount

    await prisma.invoice.create({
      data: {
        id: plan.id,
        tenantId: tenant.id,
        companyId: company.id,
        customerId: plan.customerId,
        number: plan.number,
        date: shiftDate(plan.issueOffset),
        issueDate: shiftDate(plan.issueOffset),
        dueDate: shiftDate(plan.dueOffset),
        status: plan.status,
        type: 'INVOICE',
        paymentStatus: plan.paymentStatus,
        paymentMethod: plan.paymentMethod,
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        vatTotal: totals.taxAmount,
        totalAmount: totals.totalAmount,
        total: totals.totalAmount,
        discountAmount: 0,
        paidAmount,
        balanceAmount: Number(Math.max(totals.totalAmount - paidAmount, 0).toFixed(2)),
        notes: `Vendita demo ${plan.number} - showroom Palermo`,
        items: {
          create: totals.items.map((item) => ({
            productId: item.productId,
            code: item.code,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            price: item.price,
            total: item.total,
            discount: item.discount,
            taxRate: item.taxRate,
            vatRate: item.vatRate,
            taxAmount: item.taxAmount,
            deliveredQty: item.quantity,
            sortOrder: item.sortOrder,
            order: item.order,
            notes: item.notes
          }))
        }
      }
    })

    if (paidAmount > 0) {
      await prisma.payment.create({
        data: {
          tenantId: tenant.id,
          customerId: plan.customerId,
          invoiceId: plan.id,
          amount: paidAmount,
          paymentDate: shiftDate(plan.issueOffset + 3),
          method: plan.paymentMethod,
          status: 'PAID',
          notes: `Incasso demo ${plan.number}`
        }
      })
    }
  }

  const estimatePlans = buildEstimatePlans(customers)

  for (const plan of estimatePlans) {
    const totals = computeLines(productMap, plan.lines)
    const paidAmount = plan.paymentStatus === 'PARZIALMENTE PAGATO' ? Number((totals.totalAmount * 0.3).toFixed(2)) : 0

    await prisma.estimate.create({
      data: {
        id: plan.id,
        tenantId: tenant.id,
        companyId: company.id,
        customerId: plan.customerId,
        number: plan.number,
        issueDate: shiftDate(plan.issueOffset),
        dueDate: shiftDate(plan.dueOffset),
        deliveryDate: shiftDate(plan.deliveryOffset),
        status: plan.status,
        paymentStatus: plan.paymentStatus,
        stockStatus: plan.stockStatus,
        invoiceStatus: 'NON FATTURATO',
        returnStatus: 'NON RESO',
        subtotal: totals.subtotal,
        taxAmount: totals.taxAmount,
        totalAmount: totals.totalAmount,
        discountAmount: 0,
        depositAmount: paidAmount,
        paidAmount,
        balanceAmount: Number((totals.totalAmount - paidAmount).toFixed(2)),
        paymentMethod: 'BANK_TRANSFER',
        notes: `Preventivo demo ${plan.number}`,
        internalNotes: `Probabilità chiusura ${plan.probability}% • follow-up showroom pianificato`,
        items: {
          create: totals.items.map((item) => ({
            productId: item.productId,
            code: item.code,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            price: item.price,
            total: item.total,
            discount: item.discount,
            taxRate: item.taxRate,
            vatRate: item.vatRate,
            taxAmount: item.taxAmount,
            sortOrder: item.sortOrder,
            order: item.order,
            notes: item.notes
          }))
        }
      }
    })

    if (paidAmount > 0) {
      await prisma.payment.create({
        data: {
          tenantId: tenant.id,
          customerId: plan.customerId,
          estimateId: plan.id,
          amount: paidAmount,
          paymentDate: shiftDate(plan.issueOffset + 1),
          method: 'BONIFICO',
          status: 'PAID',
          notes: `Acconto demo ${plan.number}`
        }
      })
    }
  }

  await prisma.ddt.createMany({
    data: [
      {
        id: 'ddt-001',
        tenantId: tenant.id,
        customerId: customers[14].id,
        estimateId: 'est-005',
        number: 'DDT-2026-001',
        issueDate: shiftDate(-1),
        transportMethod: 'Consegna interna Palermo',
        referenceNumber: 'PAL-DDT-001',
        itemsPayload: JSON.stringify([{ code: 'MAT-MOL-160', description: 'Molle Insacchettate Queen 160x190', quantity: 1, unit: 'pz' }]),
        notes: 'Consegna programmata con montaggio incluso.'
      },
      {
        id: 'ddt-002',
        tenantId: tenant.id,
        customerId: customers[0].id,
        invoiceId: 'inv-001',
        number: 'DDT-2026-002',
        issueDate: shiftDate(-60),
        transportMethod: 'Corriere Espresso',
        referenceNumber: 'PAL-TRACK-8451',
        itemsPayload: JSON.stringify([{ code: 'MAT-MEM-160', description: 'Memory Foam Queen 160x190', quantity: 1, unit: 'pz' }]),
        notes: 'Consegna showroom + accessori omaggio.'
      }
    ]
  })

  await prisma.supplierOrder.createMany({
    data: [
      { id: 'so-001', tenantId: tenant.id, supplierId: 'supplier-3', number: 'ORD-FOR-2026-001', orderDate: shiftDate(-2), loadingStatus: 'DA CARICARE', paymentStatus: 'NON PAGATO', totalAmount: 2940, notes: 'Riordino reti elettriche e manuali demo.' },
      { id: 'so-002', tenantId: tenant.id, supplierId: 'supplier-4', number: 'ORD-FOR-2026-002', orderDate: shiftDate(-1), loadingStatus: 'PARZIALE', paymentStatus: 'PAGATO', totalAmount: 980, notes: 'Riordino accessori showroom e promo bundle.' }
    ]
  })

  await prisma.supplierOrderItem.createMany({
    data: [
      { id: 'so-item-001', supplierOrderId: 'so-001', productId: 'prod-011', description: 'Rete Elettrica Smart 80x190', quantity: 3, unit: 'pz', unitPrice: 360, totalPrice: 1080, taxRate: VAT_RATE, notes: 'Priorità alta demo' },
      { id: 'so-item-002', supplierOrderId: 'so-001', productId: 'prod-012', description: 'Rete Elettrica Duo 160x190', quantity: 2, unit: 'pz', unitPrice: 580, totalPrice: 1160, taxRate: VAT_RATE, notes: 'Richiesta showroom' },
      { id: 'so-item-003', supplierOrderId: 'so-001', productId: 'prod-009', description: 'Rete Manuale Classic 80x190', quantity: 7, unit: 'pz', unitPrice: 100, totalPrice: 700, taxRate: VAT_RATE, notes: 'Scorta rapida' },
      { id: 'so-item-004', supplierOrderId: 'so-002', productId: 'prod-013', description: 'Cuscino Memory Cervicale', quantity: 20, unit: 'pz', unitPrice: 25, totalPrice: 500, taxRate: VAT_RATE, notes: 'Promo apertura' },
      { id: 'so-item-005', supplierOrderId: 'so-002', productId: 'prod-015', description: 'Topper Memory 160x190', quantity: 4, unit: 'pz', unitPrice: 120, totalPrice: 480, taxRate: VAT_RATE, notes: 'Bundle demo' }
    ]
  })

  await prisma.repair.createMany({
    data: buildRepairPlans(tenant.id, customers)
  })

  await prisma.expense.createMany({
    data: [
      { id: 'exp-001', tenantId: tenant.id, category: 'Energia', description: 'Bolletta showroom Palermo', amount: 486.2, paymentMethod: 'BANK_TRANSFER', expenseDate: shiftDate(-12), notes: 'Competenza mese corrente' },
      { id: 'exp-002', tenantId: tenant.id, category: 'Marketing', description: 'Campagna social promo memory foam', amount: 320, paymentMethod: 'CARD', expenseDate: shiftDate(-8), notes: 'Lead generation Meta Ads' },
      { id: 'exp-003', tenantId: tenant.id, category: 'Logistica', description: 'Consegne zona Palermo e provincia', amount: 214.5, paymentMethod: 'BANK_TRANSFER', expenseDate: shiftDate(-5), notes: 'Corriere e montaggio' },
      { id: 'exp-004', tenantId: tenant.id, category: 'Servizi', description: 'Manutenzione software gestionale', amount: 189, paymentMethod: 'CARD', expenseDate: shiftDate(-2), notes: 'Canone mensile demo' }
    ]
  })

  await prisma.stockMovement.createMany({
    data: PRODUCT_DEFINITIONS.flatMap((product) => {
      const soldQty = invoicePlans
        .flatMap((invoice) => invoice.lines)
        .filter((line) => line.productId === product.id)
        .reduce((sum, line) => sum + Number(line.quantity), 0)

      return [
        {
          id: `mov-in-${product.id}`,
          tenantId: tenant.id,
          productId: product.id,
          movementType: 'IN',
          quantity: product.stockQuantity + soldQty,
          beforeQuantity: 0,
          afterQuantity: product.stockQuantity + soldQty,
          reference: 'CARICO-DEMO',
          referenceType: 'DEMO_SETUP',
          referenceNumber: `LOAD-${product.sku}`,
          reason: 'Carico demo iniziale',
          notes: 'Reset demo data',
          movementDate: shiftDate(-90)
        },
        {
          id: `mov-out-${product.id}`,
          tenantId: tenant.id,
          productId: product.id,
          movementType: 'OUT',
          quantity: soldQty,
          beforeQuantity: product.stockQuantity + soldQty,
          afterQuantity: product.stockQuantity,
          reference: soldQty > 0 ? 'VENDITE-DEMO' : 'NESSUNA-VENDITA',
          referenceType: 'INVOICE',
          referenceNumber: soldQty > 0 ? `SALE-${product.sku}` : `STOCK-${product.sku}`,
          reason: soldQty > 0 ? 'Scarico per vendite demo' : 'Nessuno scarico',
          notes: 'Allineamento stock demo',
          movementDate: shiftDate(-1)
        }
      ]
    })
  })

  const productSales = invoicePlans.reduce<Record<string, { soldCount: number; revenue: number }>>((accumulator, invoice) => {
    invoice.lines.forEach((line) => {
      const product = productMap.get(line.productId)
      if (!product) return
      if (!accumulator[line.productId]) accumulator[line.productId] = { soldCount: 0, revenue: 0 }
      accumulator[line.productId].soldCount += line.quantity
      accumulator[line.productId].revenue += Number((product.unitPrice * line.quantity).toFixed(2))
    })
    return accumulator
  }, {})

  for (const product of PRODUCT_DEFINITIONS) {
    const sales = productSales[product.id]
    await prisma.product.update({
      where: { id: product.id },
      data: {
        soldCount: sales?.soldCount || 0,
        revenue: Number((sales?.revenue || 0).toFixed(2))
      }
    })
  }

  return {
    tenantName: tenant.name,
    companyName: company.name,
    customers: customers.length,
    products: PRODUCT_DEFINITIONS.length,
    invoices: invoicePlans.length,
    estimates: estimatePlans.length,
    repairs: 8,
    overdueInvoices: invoicePlans.filter((invoice) => invoice.status === 'OVERDUE').length,
    upcomingInvoices: invoicePlans.filter((invoice) => invoice.status === 'SENT').length,
    lowStockProducts: PRODUCT_DEFINITIONS.filter((product) => product.stockQuantity > 0 && product.stockQuantity < 3).length,
    outOfStockProducts: PRODUCT_DEFINITIONS.filter((product) => product.stockQuantity === 0).length,
    readyRepairs: buildRepairPlans(tenant.id, customers).filter((repair) => repair.status === 'PRONTO').length,
    acceptedEstimates: estimatePlans.filter((estimate) => estimate.status === 'ACCEPTED').length
  }
}

export async function seedDemoDatabase(prisma: PrismaClient) {
  return resetDemoData(prisma)
}

export { DEFAULT_ADMIN_EMAIL, DEFAULT_TENANT_ID }
