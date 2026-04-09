import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

import { prisma } from '@/lib/prisma'
import { resolveAuthTenantContext } from '@/lib/auth-bootstrap'

const signupSchema = z.object({
  name: z.string().trim().min(2, 'Inserisci nome e cognome').max(120),
  email: z.string().trim().email('Email non valida'),
  password: z.string().min(6, 'La password deve contenere almeno 6 caratteri').max(100),
  tenantCode: z.string().trim().max(60).optional().or(z.literal('')),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password, tenantCode } = signupSchema.parse(body)

    const normalizedEmail = email.toLowerCase()

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'Esiste già un account con questa email',
        },
        { status: 409 }
      )
    }

    const authContext = await resolveAuthTenantContext(tenantCode)

    if (!authContext) {
      return NextResponse.json(
        {
          success: false,
          error: 'Codice azienda non valido',
        },
        { status: 404 }
      )
    }

    const tenant = authContext.tenant
    const company = authContext.company
    const hashedPassword = await bcrypt.hash(password, 10)

    const [firstName, ...lastNameParts] = name.split(' ').filter(Boolean)
    const lastName = lastNameParts.join(' ') || null

    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: normalizedEmail,
        name,
        firstName: firstName || name,
        lastName,
        password: hashedPassword,
        role: 'USER',
        isActive: true,
        emailVerified: new Date(),
      },
    })

    if (company) {
      await prisma.userCompany.upsert({
        where: {
          userId_companyId: {
            userId: user.id,
            companyId: company.id,
          },
        },
        update: {
          role: 'USER',
          isDefault: true,
        },
        create: {
          userId: user.id,
          companyId: company.id,
          role: 'USER',
          isDefault: true,
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Account creato con successo',
      data: {
        email: normalizedEmail,
        tenantCode: authContext.requiresTenantValidation ? (authContext.normalizedTenantCode || '') : '',
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: error.issues[0]?.message || 'Dati non validi',
        },
        { status: 400 }
      )
    }

    console.error('Signup error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Impossibile creare l\'account in questo momento',
      },
      { status: 500 }
    )
  }
}
