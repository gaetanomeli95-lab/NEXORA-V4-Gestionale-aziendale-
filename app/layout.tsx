import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from "@/components/ui/toaster"
import { DesktopRuntimeProvider } from '@/components/desktop/desktop-runtime-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NEXORA v4 - Next Generation Business Management',
  description: 'Sistema gestionale rivoluzionario con intelligenza artificiale e analytics real-time',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="it">
      <body className={inter.className}>
        <DesktopRuntimeProvider>
          {children}
          <Toaster />
        </DesktopRuntimeProvider>
      </body>
    </html>
  )
}
