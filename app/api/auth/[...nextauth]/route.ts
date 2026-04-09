import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ensureRuntimeAuthBootstrap } from '@/lib/auth-bootstrap'

const nextAuthHandler = NextAuth(authOptions)

export async function GET(request: Request, context: unknown) {
  await ensureRuntimeAuthBootstrap().catch(() => null)
  return nextAuthHandler(request, context)
}

export async function POST(request: Request, context: unknown) {
  await ensureRuntimeAuthBootstrap().catch(() => null)
  return nextAuthHandler(request, context)
}
