import { Suspense } from 'react'
import SignInForm from '@/components/ui/auth/signin-form'
import { ensureRuntimeAuthBootstrap } from '@/lib/auth-bootstrap'

export default async function SignInPage() {
  await ensureRuntimeAuthBootstrap().catch(() => null)

  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  )
}
