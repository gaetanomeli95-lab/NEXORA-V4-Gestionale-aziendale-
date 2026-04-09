import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'

import { DEFAULT_ADMIN_EMAIL, DEFAULT_TENANT_ID } from '@/lib/demo-data'
import { prisma } from '@/lib/prisma'

const DEFAULT_COMPANY_ID = 'company-demo'
const DEFAULT_ADMIN_PASSWORD = 'admin123'
const FULL_DESKTOP_TENANT_ID = 'local-full-tenant'
const FULL_DESKTOP_COMPANY_ID = 'company-local-full'
const STORAGE_DIR_NAME = 'NEXORA'
const STATE_FILE_NAME = '.state.json'

export type RuntimeBuildFlavor = 'demo' | 'full' | 'web'

const defaultTenantData = {
  name: 'NEXORA Workspace',
  legalName: 'NEXORA Workspace',
  subdomain: 'demo',
  primaryColor: '#0f766e',
  secondaryColor: '#0f172a',
  vatNumber: null,
  fiscalCode: null,
  address: null,
  city: null,
  province: null,
  postalCode: null,
  country: 'IT',
  phone: null,
  email: 'workspace@nexora.app',
  website: 'https://nexora.app',
  language: 'it',
  timezone: 'Europe/Rome',
  currency: 'EUR',
  dateFormat: 'DD/MM/YYYY',
  numberFormat: 'it-IT',
  subscriptionPlan: 'ENTERPRISE',
  subscriptionStatus: 'ACTIVE',
  isActive: true,
}

const defaultCompanyData = {
  name: 'La tua azienda',
  legalName: 'La tua azienda',
  vatNumber: null,
  taxCode: null,
  address: null,
  city: null,
  province: null,
  postalCode: null,
  country: 'IT',
  phone: null,
  email: 'workspace@nexora.app',
  website: 'https://nexora.app',
  type: 'COMPANY',
  isActive: true,
}

const fullDesktopTenantData = {
  name: 'NEXORA V4 Enterprise Workspace',
  legalName: 'NEXORA V4 Enterprise Workspace',
  subdomain: 'local-full',
  primaryColor: '#0f766e',
  secondaryColor: '#0f172a',
  vatNumber: null,
  fiscalCode: null,
  address: null,
  city: null,
  province: null,
  postalCode: null,
  country: 'IT',
  phone: null,
  email: 'local@nexora.app',
  website: null,
  language: 'it',
  timezone: 'Europe/Rome',
  currency: 'EUR',
  dateFormat: 'DD/MM/YYYY',
  numberFormat: 'it-IT',
  subscriptionPlan: 'ENTERPRISE',
  subscriptionStatus: 'ACTIVE',
  isActive: true,
}

const fullDesktopCompanyData = {
  name: 'NEXORA V4 Enterprise Workspace',
  legalName: 'NEXORA V4 Enterprise Workspace',
  vatNumber: null,
  taxCode: null,
  address: null,
  city: null,
  province: null,
  postalCode: null,
  country: 'IT',
  phone: null,
  email: 'local@nexora.app',
  website: null,
  type: 'COMPANY',
  isActive: true,
}

export function resolveServerBuildFlavor(): RuntimeBuildFlavor {
  const buildFlavor = process.env.NEXORA_BUILD_MODE || process.env.ELECTRON_BUILD_MODE

  if (buildFlavor === 'full') {
    const desktopState = readDesktopRuntimeState()

    if (desktopState?.build_flavor === 'demo' && !desktopState.trial_expired && desktopState.expires_at && new Date(desktopState.expires_at).getTime() > Date.now()) {
      return 'demo'
    }
  }

  if (buildFlavor === 'demo' || buildFlavor === 'full') {
    return buildFlavor
  }

  return 'web'
}

function readDesktopRuntimeState(): {
  build_flavor?: 'demo' | 'full'
  trial_expired?: boolean
  expires_at?: string | null
} | null {
  try {
    const localAppData = process.env.LOCALAPPDATA || path.join(process.env.USERPROFILE || path.join(process.env.HOMEDRIVE || 'C:', process.env.HOMEPATH || '\\Users\\Default'), 'AppData', 'Local')
    const candidatePaths = [
      path.join(localAppData, STORAGE_DIR_NAME, STATE_FILE_NAME),
      path.join(process.env.PROGRAMDATA || path.join(process.env.SystemDrive || 'C:', 'ProgramData'), STORAGE_DIR_NAME, STATE_FILE_NAME),
    ]

    for (const stateFilePath of candidatePaths) {
      if (!fs.existsSync(stateFilePath)) {
        continue
      }

      return JSON.parse(fs.readFileSync(stateFilePath, 'utf8'))
    }

    return null
  } catch {
    return null
  }
}

export async function ensureDefaultAuthBootstrap() {
  const tenant = await prisma.tenant.upsert({
    where: { id: DEFAULT_TENANT_ID },
    update: {
      isActive: true,
    },
    create: {
      id: DEFAULT_TENANT_ID,
      ...defaultTenantData,
    },
  })

  const company = await prisma.company.upsert({
    where: { id: DEFAULT_COMPANY_ID },
    update: {
      tenantId: tenant.id,
      isActive: true,
    },
    create: {
      id: DEFAULT_COMPANY_ID,
      tenantId: tenant.id,
      ...defaultCompanyData,
    },
  })

  const existingAdmin = await prisma.user.findUnique({
    where: { email: DEFAULT_ADMIN_EMAIL },
  })

  const needsAdminReset =
    !existingAdmin ||
    existingAdmin.tenantId !== tenant.id ||
    existingAdmin.role !== 'ADMIN' ||
    !existingAdmin.isActive ||
    !existingAdmin.emailVerified ||
    !(await bcrypt.compare(DEFAULT_ADMIN_PASSWORD, existingAdmin.password || ''))

  const adminUser = needsAdminReset
    ? await prisma.user.upsert({
        where: { email: DEFAULT_ADMIN_EMAIL },
        update: {
          tenantId: tenant.id,
          name: 'Amministratore NEXORA',
          firstName: 'Amministratore',
          lastName: 'NEXORA',
          password: await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10),
          role: 'ADMIN',
          isActive: true,
          emailVerified: new Date(),
        },
        create: {
          tenantId: tenant.id,
          email: DEFAULT_ADMIN_EMAIL,
          name: 'Amministratore NEXORA',
          firstName: 'Amministratore',
          lastName: 'NEXORA',
          password: await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10),
          role: 'ADMIN',
          isActive: true,
          emailVerified: new Date(),
        },
      })
    : existingAdmin

  await prisma.userCompany.upsert({
    where: {
      userId_companyId: {
        userId: adminUser.id,
        companyId: company.id,
      },
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

  return {
    tenant,
    company,
    adminUser,
    buildFlavor: 'demo' as const,
  }
}

export async function ensureFullDesktopAuthBootstrap() {
  const tenant = await prisma.tenant.upsert({
    where: { id: FULL_DESKTOP_TENANT_ID },
    update: {
      isActive: true,
    },
    create: {
      id: FULL_DESKTOP_TENANT_ID,
      ...fullDesktopTenantData,
    },
  })

  const company = await prisma.company.upsert({
    where: { id: FULL_DESKTOP_COMPANY_ID },
    update: {
      tenantId: tenant.id,
      isActive: true,
    },
    create: {
      id: FULL_DESKTOP_COMPANY_ID,
      tenantId: tenant.id,
      ...fullDesktopCompanyData,
    },
  })

  return {
    tenant,
    company,
    adminUser: null,
    buildFlavor: 'full' as const,
  }
}

export async function ensureRuntimeAuthBootstrap() {
  const buildFlavor = resolveServerBuildFlavor()

  if (buildFlavor === 'full') {
    return ensureFullDesktopAuthBootstrap()
  }

  return ensureDefaultAuthBootstrap()
}

export async function resolveAuthTenantContext(tenantCode?: string | null) {
  const buildFlavor = resolveServerBuildFlavor()
  const normalizedTenantCode = tenantCode?.trim().toLowerCase() || null

  if (buildFlavor === 'full') {
    const bootstrap = await ensureFullDesktopAuthBootstrap()

    return {
      buildFlavor,
      normalizedTenantCode: null,
      tenant: bootstrap.tenant,
      company: bootstrap.company,
      requiresTenantValidation: false,
      runtimeScoped: true,
    }
  }

  if (buildFlavor === 'demo') {
    const bootstrap = await ensureDefaultAuthBootstrap()

    return {
      buildFlavor,
      normalizedTenantCode: 'demo',
      tenant: bootstrap.tenant,
      company: bootstrap.company,
      requiresTenantValidation: false,
      runtimeScoped: true,
    }
  }

  if (!normalizedTenantCode) {
    const bootstrap = await ensureDefaultAuthBootstrap()

    return {
      buildFlavor,
      normalizedTenantCode,
      tenant: bootstrap.tenant,
      company: bootstrap.company,
      requiresTenantValidation: false,
      runtimeScoped: false,
    }
  }

  const tenant = await prisma.tenant.findFirst({
    where: {
      OR: [
        { subdomain: normalizedTenantCode },
        { domain: normalizedTenantCode },
      ],
      isActive: true,
    },
    include: {
      companies: {
        where: { isActive: true },
        orderBy: { createdAt: 'asc' },
        take: 1,
      },
    },
  })

  if (!tenant) {
    return null
  }

  return {
    buildFlavor,
    normalizedTenantCode,
    tenant,
    company: tenant.companies[0] ?? null,
    requiresTenantValidation: true,
    runtimeScoped: false,
  }
}

export { DEFAULT_ADMIN_PASSWORD, DEFAULT_COMPANY_ID }
