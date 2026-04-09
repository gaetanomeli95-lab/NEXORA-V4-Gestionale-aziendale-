import { type AuthOptions, type Session, type User as NextAuthUser } from 'next-auth'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import CredentialsProvider from 'next-auth/providers/credentials'
import AzureADProvider from 'next-auth/providers/azure-ad'
import GoogleProvider from 'next-auth/providers/google'
import type { JWT } from 'next-auth/jwt'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { ensureRuntimeAuthBootstrap, resolveAuthTenantContext } from '@/lib/auth-bootstrap'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  tenantCode: z.string().optional(),
})

const authSecret = process.env.NEXTAUTH_SECRET || 'nexora-desktop-local-secret'
const googleClientId = process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET
const microsoftClientId = process.env.MICROSOFT_CLIENT_ID
const microsoftClientSecret = process.env.MICROSOFT_CLIENT_SECRET
const microsoftTenantId = process.env.MICROSOFT_TENANT_ID || process.env.AZURE_AD_TENANT_ID || 'common'

type AuthUser = NextAuthUser & {
  firstName?: string | null
  lastName?: string | null
  role?: string
  tenantId?: string
  avatar?: string | null
  phone?: string | null
}

type AuthToken = JWT & {
  id?: string
  role?: string
  tenantId?: string
}

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        tenantCode: { label: 'Codice Tenant', type: 'text', required: false }
      },
      async authorize(credentials) {
        try {
          const { email, password, tenantCode } = credentialsSchema.parse(credentials)
          const normalizedEmail = email.trim().toLowerCase()
          const authContext = await resolveAuthTenantContext(tenantCode)

          if (!authContext) {
            throw new Error('Tenant non valido')
          }
          
          // Find user with tenant
          const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            include: {
              tenant: true
            }
          })

          if (!user || !user.isActive) {
            throw new Error('Credenziali non valide')
          }

          if (authContext.runtimeScoped && user.tenantId !== authContext.tenant.id) {
            throw new Error('Credenziali non valide')
          }

          if (
            authContext.requiresTenantValidation &&
            authContext.normalizedTenantCode &&
            user.tenant.subdomain !== authContext.normalizedTenantCode &&
            user.tenant.domain !== authContext.normalizedTenantCode
          ) {
            throw new Error('Tenant non valido')
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(password, user.password || '')
          if (!isPasswordValid) {
            throw new Error('Credenziali non valide')
          }

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() }
          })

          // Create session
          const sessionUser: AuthUser = {
            id: user.id,
            email: user.email,
            name: [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            tenantId: user.tenantId,
            avatar: user.avatar,
            phone: user.phone,
          }

          return sessionUser
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    }),
    ...(googleClientId && googleClientSecret
      ? [
          GoogleProvider({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
            profile(profile: { sub: string; email: string; name?: string; given_name?: string; family_name?: string; picture?: string }) {
              return {
                id: profile.sub,
                email: profile.email,
                name: profile.name,
                firstName: profile.given_name,
                lastName: profile.family_name,
                avatar: profile.picture,
              }
            }
          })
        ]
      : []),
    ...(microsoftClientId && microsoftClientSecret
      ? [
          AzureADProvider({
            clientId: microsoftClientId,
            clientSecret: microsoftClientSecret,
            tenantId: microsoftTenantId,
            profile(profile: { sub?: string; oid?: string; email?: string; preferred_username?: string; name?: string; given_name?: string; family_name?: string; picture?: string }) {
              return {
                id: profile.sub || profile.oid || profile.preferred_username || profile.email || '',
                email: profile.email || profile.preferred_username,
                name: profile.name,
                firstName: profile.given_name,
                lastName: profile.family_name,
                avatar: profile.picture,
              }
            }
          })
        ]
      : [])
  ],
  pages: {
    signIn: '/auth/signin'
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  secret: authSecret,
  callbacks: {
    async jwt({ token, user, account, profile, isNewUser }) {
      const authToken = token as AuthToken
      const authUser = user as AuthUser | undefined

      // Initial sign in
      if (authUser && account) {
        authToken.id = authUser.id
        authToken.role = authUser.role
        authToken.tenantId = authUser.tenantId
        
        // Handle OAuth providers
        if (account.provider !== 'credentials') {
          // Create or update user from OAuth
          const existingUser = await prisma.user.findUnique({
            where: { email: authUser.email ?? undefined }
          })

          if (existingUser) {
            // Update existing user with OAuth data
            await prisma.user.update({
              where: { id: existingUser.id },
              data: {
                avatar: authUser.avatar,
                lastLoginAt: new Date()
              }
            })
            
            authToken.id = existingUser.id
            authToken.role = existingUser.role
            authToken.tenantId = existingUser.tenantId
          } else if (isNewUser && authUser.email) {
            // Create new user from OAuth
            const { tenant, company } = await ensureRuntimeAuthBootstrap()
            const newUser = await prisma.user.create({
              data: {
                email: authUser.email,
                name: authUser.name || [authUser.firstName, authUser.lastName].filter(Boolean).join(' ') || authUser.email,
                firstName: authUser.firstName,
                lastName: authUser.lastName,
                password: '', // OAuth users don't have passwords
                role: 'USER',
                isActive: true,
                avatar: authUser.avatar,
                tenant: {
                  connect: { id: tenant.id }
                }
              }
            })

            await prisma.userCompany.upsert({
              where: {
                userId_companyId: {
                  userId: newUser.id,
                  companyId: company.id,
                },
              },
              update: {
                role: 'USER',
                isDefault: true,
              },
              create: {
                userId: newUser.id,
                companyId: company.id,
                role: 'USER',
                isDefault: true,
              },
            })
            
            authToken.id = newUser.id
            authToken.role = newUser.role
            authToken.tenantId = newUser.tenantId
          }
        }
      }

      // Add custom claims
      if (authToken.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: authToken.id }
        })

        if (dbUser) {
          authToken.role = dbUser.role
          authToken.tenantId = dbUser.tenantId
        }
      }

      return authToken
    },
    async session({ session, token }) {
      const authSession = session as Session & {
        user: NonNullable<Session['user']> & {
          id?: string
          role?: string
          tenantId?: string
        }
      }
      const authToken = token as AuthToken

      // Add custom data to session
      authSession.user.id = authToken.id
      authSession.user.role = authToken.role
      authSession.user.tenantId = authToken.tenantId

      return authSession
    },
    async redirect({ url, baseUrl }) {
      // Allows relative callback URLs
      if (url.startsWith('/')) return `${baseUrl}${url}`
      // Allows callback URLs on the same origin
      else if (new URL(url).origin === baseUrl) return url
      return baseUrl
    },
    async signIn({ user, account }) {
      // Custom sign-in logic
      if (account?.provider === 'credentials') {
        return true
      }

      // Allow OAuth sign in
      if (account?.provider === 'google' || account?.provider === 'azure-ad') {
        const authContext = await resolveAuthTenantContext()

        if (!authContext) {
          return false
        }

        if (user.email) {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email }
          })

          if (existingUser && authContext.runtimeScoped && existingUser.tenantId !== authContext.tenant.id) {
            return false
          }
        }

        // Check if user is allowed to sign up
        const allowedDomains = process.env.ALLOWED_DOMAINS?.split(',') || []
        if (allowedDomains.length > 0) {
          const domain = user.email?.split('@')[1]
          if (!domain || !allowedDomains.includes(domain)) {
            return false
          }
        }
        return true
      }

      return false
    }
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      // Log sign in events
      console.log(`User signed in: ${user.email} via ${account?.provider}`)
      
      if (isNewUser && user.email) {
        // Send welcome email
        await sendWelcomeEmail(user.email, user.name || '')
      }
    },
    async signOut({ session }) {
      // Log sign out events
      console.log(`User signed out: ${session.user?.email}`)
    },
    async createUser({ user }) {
      // Handle new user creation
      console.log(`New user created: ${user.email}`)
    }
  }
}

// Helper functions
function getPermissionsForRole(role: string): string[] {
  const permissions = {
    SUPER_ADMIN: [
      'users.create', 'users.read', 'users.update', 'users.delete',
      'companies.create', 'companies.read', 'companies.update', 'companies.delete',
      'tenants.create', 'tenants.read', 'tenants.update', 'tenants.delete',
      'invoices.create', 'invoices.read', 'invoices.update', 'invoices.delete',
      'analytics.read', 'system.manage'
    ],
    ADMIN: [
      'users.create', 'users.read', 'users.update',
      'companies.create', 'companies.read', 'companies.update',
      'invoices.create', 'invoices.read', 'invoices.update', 'invoices.delete',
      'analytics.read'
    ],
    MANAGER: [
      'users.read',
      'companies.read', 'companies.update',
      'invoices.create', 'invoices.read', 'invoices.update',
      'analytics.read'
    ],
    USER: [
      'companies.read',
      'invoices.create', 'invoices.read', 'invoices.update'
    ],
    VIEWER: [
      'companies.read',
      'invoices.read'
    ]
  }

  return permissions[role as keyof typeof permissions] || []
}

async function sendWelcomeEmail(email: string, name: string) {
  // Implement welcome email logic
  console.log(`Welcome email sent to ${email}`)
}

export default authOptions
