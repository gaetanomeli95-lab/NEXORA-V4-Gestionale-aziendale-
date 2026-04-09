"use client"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle, Loader2, Shield, UserPlus, Mail, Lock, Building } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDesktopRuntime } from '@/components/desktop/desktop-runtime-provider'

export default function SignUpPage() {
  const router = useRouter()
  const { buildFlavor, isDesktopRuntime, runtimeType, trialStatus } = useDesktopRuntime()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tenantCode, setTenantCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const isFullDesktopBuild = runtimeType === 'electron' && buildFlavor === 'full'
  const showCompanyCodeField = !isDesktopRuntime
  const companyCodeLabel = 'Codice azienda (opzionale)'
  const companyCodePlaceholder = 'lascia vuoto se non richiesto'
  const requiresActivation = isFullDesktopBuild && Boolean(trialStatus?.activation_required) && !trialStatus?.activation_valid

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (requiresActivation) {
      setError('Attiva prima la licenza demo dalla schermata di accesso')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          email,
          password,
          tenantCode: showCompanyCodeField ? tenantCode.trim() : '',
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setError(result.error || 'Registrazione non riuscita')
        return
      }

      setSuccess('Account creato con successo. Reindirizzamento al login...')

      const params = new URLSearchParams({
        success: '1',
        email: result.data?.email || email,
      })

      if (result.data?.tenantCode) {
        params.set('tenantCode', result.data.tenantCode)
      }

      setTimeout(() => {
        router.push(`/auth/signin?${params.toString()}`)
      }, 900)
    } catch (signupError) {
      setError('Si è verificato un errore durante la registrazione')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-blue-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-lg"
      >
        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 shadow-lg">
              <UserPlus className="h-7 w-7 text-white" />
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">Crea il tuo account</CardTitle>
            <CardDescription>
              Registrazione immediata per accedere a NEXORA con credenziali personali.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}

            {success ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            ) : null}

            <Alert className="border-cyan-200 bg-cyan-50">
              <Shield className="h-4 w-4 text-cyan-700" />
              <AlertDescription className="space-y-1 text-slate-700">
                <div className="font-semibold text-slate-900">
                  {isDesktopRuntime && buildFlavor === 'full'
                    ? 'Demo desktop attivabile'
                    : isDesktopRuntime && buildFlavor === 'demo'
                      ? 'Versione demo desktop'
                      : 'Accesso demo sempre disponibile'}
                </div>
                {isFullDesktopBuild ? (
                  <div>Attiva prima la demo dalla pagina di accesso. La licenza completa sarà disponibile a breve.</div>
                ) : (
                  <div>Per la demo puoi usare `admin@nexora.com` / `admin123` senza inserire alcun codice azienda.</div>
                )}
              </AlertDescription>
            </Alert>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome e cognome</Label>
                <div className="relative">
                  <UserPlus className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Mario Rossi"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="nome@azienda.com"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Almeno 6 caratteri"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {showCompanyCodeField ? (
                <div className="space-y-2">
                  <Label htmlFor="tenantCode">{companyCodeLabel}</Label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="tenantCode"
                      value={tenantCode}
                      onChange={(event) => setTenantCode(event.target.value)}
                      placeholder={companyCodePlaceholder}
                      className="pl-10"
                    />
                  </div>
                </div>
              ) : null}

              <Button type="submit" className="w-full" disabled={isLoading || requiresActivation}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creazione account...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Registrati
                  </>
                )}
              </Button>

              {requiresActivation ? (
                <p className="text-center text-xs text-amber-700">
                  Attiva prima la licenza demo dalla schermata di accesso.
                </p>
              ) : null}
            </form>

            <div className="text-center text-sm text-slate-600">
              Hai già un account?{' '}
              <Link href="/auth/signin" className="font-semibold text-blue-600 hover:text-blue-500">
                Accedi ora
              </Link>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-xs text-slate-600">
              NEXORA è un progetto ideato e sviluppato da <span className="font-semibold text-slate-900">Gaetano Meli</span>.
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
