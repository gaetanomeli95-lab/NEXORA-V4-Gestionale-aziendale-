import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import LayoutWithNav from '@/app/layout-with-nav'
import { authOptions } from '@/lib/auth'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/signin?error=SessionRequired')
  }

  return <LayoutWithNav>{children}</LayoutWithNav>
}
