import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ensureRuntimeAuthBootstrap } from '@/lib/auth-bootstrap'

const nextAuthHandler = NextAuth(authOptions)
const isPublicShowcaseDeployment = Boolean(process.env.VERCEL)

export async function GET(request: Request, context: unknown) {
  if (!isPublicShowcaseDeployment) {
    await ensureRuntimeAuthBootstrap().catch(() => null)
  }
  return nextAuthHandler(request, context)
}

export async function POST(request: Request, context: unknown) {
  if (!isPublicShowcaseDeployment) {
    await ensureRuntimeAuthBootstrap().catch(() => null)
  }
  return nextAuthHandler(request, context)
}
