import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { Toaster } from "@/components/ui/toaster"
import { DesktopRuntimeProvider } from '@/components/desktop/desktop-runtime-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'NEXORA V4 | Gestionale intelligente per aziende',
  description: 'Gestionale moderno per aziende e professionisti con demo desktop Windows, documenti commerciali, magazzino, clienti e analytics.',
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
