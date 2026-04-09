"use client"

import React, { useState, useEffect } from 'react'
import { getProviders, signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Lock, 
  Mail, 
  Building, 
  Eye, 
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader2,
  Chrome,
  LogIn,
  Shield,
  Zap,
  Smartphone,
  Fingerprint
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'
import { useDesktopRuntime } from '@/components/desktop/desktop-runtime-provider'

type OAuthProviderId = 'google' | 'azure-ad'

const DEMO_LOGIN_EMAIL = 'admin@nexora.com'
const DEMO_LOGIN_PASSWORD = 'admin123'

export default function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const { buildFlavor, isDesktopRuntime, runtimeType, trialStatus, activateDemoLicense } = useDesktopRuntime()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [tenantCode, setTenantCode] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activationLoading, setActivationLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [availableProviders, setAvailableProviders] = useState<Record<OAuthProviderId, boolean>>({
    google: false,
    'azure-ad': false,
  })
  const supportsManagedDesktopStatus = runtimeType === 'electron'
  const showCompanyCodeField = !isDesktopRuntime
  const companyCodeLabel = 'Codice azienda (opzionale)'
  const companyCodePlaceholder = 'lascia vuoto se non richiesto'
  const desktopStatusPending = supportsManagedDesktopStatus && isDesktopRuntime && !trialStatus
  const isFullDesktopBuild = supportsManagedDesktopStatus && buildFlavor === 'full'
  const requiresActivation = isFullDesktopBuild && Boolean(trialStatus?.activation_required) && !trialStatus?.activation_valid
  const fullBuildActivated = isFullDesktopBuild && Boolean(trialStatus?.activation_valid)

  const getErrorMessage = (value: unknown, fallback: string) => {
    if (value instanceof Error && value.message) {
      return value.message
    }

    if (typeof value === 'string' && value.trim()) {
      return value
    }

    return fallback
  }

  // Check for callback errors
  useEffect(() => {
    const error = searchParams.get('error')
    const activationRequired = searchParams.get('activationRequired')
    const initialEmail = searchParams.get('email')
    const initialTenantCode = searchParams.get('tenantCode')

    if (initialEmail) {
      setEmail(initialEmail)
    }

    if (initialTenantCode) {
      setTenantCode(initialTenantCode)
    }

    if (activationRequired === '1') {
      setError('Attiva la licenza demo per 7 giorni prima di poter usare il gestionale')
    }

    if (error) {
      switch (error) {
        case 'CredentialsSignin':
          setError('Credenziali non valide')
          break
        case 'OAuthSignin':
          setError('Errore durante l\'accesso con OAuth')
          break
        case 'OAuthCreateAccount':
          setError('Impossibile creare l\'account con questo provider')
          break
        case 'EmailCreateAccount':
          setError('Impossibile creare l\'account con questa email')
          break
        case 'Callback':
          setError('Errore durante il callback di autenticazione')
          break
        case 'OAuthAccountNotLinked':
          setError('Questo account è già associato a un altro provider')
          break
        case 'SessionRequired':
          setError('Sessione richiesta per accedere a questa pagina')
          break
        default:
          setError('Si è verificato un errore durante l\'accesso')
      }
    }

    const success = searchParams.get('success')
    if (success) {
      setSuccess('Account creato con successo! Accedi per continuare.')
    }

    // Redirect if already authenticated
    if (status === 'authenticated' && session && !requiresActivation && !desktopStatusPending) {
      router.push('/dashboard-real')
    }
  }, [searchParams, status, session, router, requiresActivation, desktopStatusPending])

  const handleDemoActivation = async () => {
    if (!isFullDesktopBuild) {
      return
    }

    setActivationLoading(true)
    setError('')
    setSuccess('')

    try {
      const nextStatus = await activateDemoLicense()

      if (!nextStatus || nextStatus.build_flavor !== 'demo' || nextStatus.trial_expired) {
        throw new Error(nextStatus?.message || 'Impossibile attivare la demo')
      }

      setEmail(DEMO_LOGIN_EMAIL)
      setPassword(DEMO_LOGIN_PASSWORD)
      setRememberMe(true)
      setSuccess(nextStatus.message || 'Demo attivata. Ora puoi accedere al sistema oppure aprire la panoramica NEXORA.')
    } catch (activationError) {
      setError(getErrorMessage(activationError, 'Impossibile attivare la demo'))
    } finally {
      setActivationLoading(false)
    }
  }

  useEffect(() => {
    let active = true

    getProviders()
      .then((providers) => {
        if (!active) return

        setAvailableProviders({
          google: Boolean(providers?.google),
          'azure-ad': Boolean(providers?.['azure-ad']),
        })
      })
      .catch(() => {
        if (!active) return

        setAvailableProviders({
          google: false,
          'azure-ad': false,
        })
      })

    return () => {
      active = false
    }
  }, [])

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        tenantCode: showCompanyCodeField ? tenantCode.trim() : '',
        redirect: false,
        callbackUrl: '/dashboard-real'
      })

      if (result?.error) {
        setError('Credenziali non valide')
      } else if (result?.ok) {
        setSuccess('Accesso riuscito! Reindirizzamento...')
        setTimeout(() => {
          router.push('/dashboard-real')
        }, 1000)
      }
    } catch (error) {
      setError('Si è verificato un errore durante l\'accesso')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignIn = async (provider: OAuthProviderId) => {
    setIsLoading(true)
    setError('')

    const providerLabel = provider === 'google' ? 'Google' : 'Microsoft'

    if (!availableProviders[provider]) {
      setError(`Accesso con ${providerLabel} non disponibile. Configura le credenziali OAuth nelle variabili ambiente.`)
      setIsLoading(false)
      return
    }

    try {
      await signIn(provider, {
        callbackUrl: '/dashboard-real',
      })
    } catch (error) {
      setError(`Errore durante l'accesso con ${providerLabel}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBiometricAuth = async () => {
    if ('credentials' in navigator) {
      try {
        // Implement WebAuthn biometric authentication
        const credential = await navigator.credentials.get({
          publicKey: {
            challenge: new Uint8Array(32),
            allowCredentials: [],
            userVerification: 'required'
          }
        })
        
        if (credential) {
          // Send credential to server for verification
          console.log('Biometric authentication successful')
          setSuccess('Autenticazione biometrica riuscita!')
        }
      } catch (error) {
        setError('Autenticazione biometrica non disponibile o fallita')
      }
    } else {
      setError('Il tuo browser non supporta l\'autenticazione biometrica')
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(147,51,234,0.24),_transparent_32%),linear-gradient(135deg,_#020617_0%,_#0f172a_30%,_#172554_68%,_#312e81_100%)] flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Panel - Branding */}
        <div className="hidden lg:flex flex-col justify-center space-y-8 rounded-[2rem] border border-white/10 bg-white/10 p-10 text-white shadow-[0_30px_80px_rgba(2,6,23,0.45)] backdrop-blur-xl">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-8"
          >
            <div className="inline-flex w-fit items-center rounded-full border border-cyan-300/25 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-cyan-100">
              NEXORA Desktop Experience
            </div>

            <div className="flex items-center space-x-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] bg-gradient-to-br from-cyan-400 via-blue-500 to-fuchsia-600 shadow-[0_18px_45px_rgba(37,99,235,0.4)] ring-4 ring-white/10">
                <Zap className="h-10 w-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight text-white">NEXORA v4</h1>
                <p className="text-base font-medium text-slate-100">Gestionale evoluto per demo, vendita e operatività quotidiana</p>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl font-bold leading-tight text-white">
                Il tuo gestionale, con un'identità visiva più forte e accesso immediato.
              </h2>
              <p className="max-w-xl leading-relaxed text-slate-100">
                Scopri una piattaforma rivoluzionaria con intelligenza artificiale, 
                collaborazione in tempo reale e analisi avanzate per trasformare la tua azienda.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="flex items-center space-x-4 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/15 ring-1 ring-cyan-300/30">
                  <Shield className="h-5 w-5 text-cyan-200" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Sicurezza Aziendale</h3>
                  <p className="text-sm text-slate-100">Accesso protetto e demo desktop gestita localmente.</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-fuchsia-400/15 ring-1 ring-fuchsia-300/30">
                  <Zap className="h-5 w-5 text-fuchsia-200" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Intelligenza Artificiale</h3>
                  <p className="text-sm text-slate-100">Assistente smart, insight chiari e decisioni più rapide.</p>
                </div>
              </div>

              <div className="flex items-center space-x-4 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-400/15 ring-1 ring-emerald-300/30">
                  <Smartphone className="h-5 w-5 text-emerald-200" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Esperienza Desktop</h3>
                  <p className="text-sm text-slate-100">Installazione rapida, demo istantanea e accesso guidato.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-4">
                <div className="text-2xl font-bold text-white">7</div>
                <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-200">Giorni demo</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-4">
                <div className="text-2xl font-bold text-white">AI</div>
                <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-200">Assistita</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/35 px-4 py-4">
                <div className="text-2xl font-bold text-white">24/7</div>
                <div className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-200">Operatività</div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Panel - Sign In Form */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center"
        >
          <Card className="w-full max-w-md border border-slate-800 bg-slate-950 text-slate-50 shadow-[0_30px_80px_rgba(2,6,23,0.78)] backdrop-blur-xl">
            <CardHeader className="space-y-4 text-center pb-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-gradient-to-br from-cyan-400 via-blue-500 to-fuchsia-600 shadow-[0_16px_40px_rgba(37,99,235,0.35)] ring-4 ring-white/10 lg:hidden">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <div className="mx-auto inline-flex items-center rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200">
                Accesso NEXORA
              </div>
              <CardTitle className="text-3xl font-bold text-white">
                Accedi al tuo account
              </CardTitle>
              <CardDescription className="text-slate-200">
                Inserisci le tue credenziali per accedere alla piattaforma
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6 text-slate-100">
              {/* Alerts */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Alert variant="destructive" className="border-rose-500/35 bg-rose-950/70 text-rose-50 [&>svg]:text-rose-300">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <Alert className="border-emerald-500/35 bg-emerald-950/65 text-emerald-50 [&>svg]:text-emerald-300">
                      <CheckCircle className="h-4 w-4 text-emerald-300" />
                      <AlertDescription className="text-emerald-100">{success}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <Alert className="border-cyan-400/30 bg-slate-900 text-slate-100 [&>svg]:text-cyan-300">
                <Shield className="h-4 w-4 text-cyan-300" />
                <AlertDescription className="space-y-1 text-slate-100">
                  <div className="font-semibold text-white">
                    {fullBuildActivated
                      ? 'Versione completa attiva'
                      : isFullDesktopBuild
                        ? 'Demo desktop attivabile'
                        : 'Accesso demo immediato'}
                  </div>
                  {fullBuildActivated ? (
                    <>
                      <div>{trialStatus?.message || 'Licenza completa attiva su questo dispositivo.'}</div>
                    </>
                  ) : isFullDesktopBuild ? (
                    <>
                      <div>Attiva la demo locale con un click e usa NEXORA per 7 giorni su questo dispositivo.</div>
                      <div>La licenza completa sarà acquistabile a breve.</div>
                      <div>{trialStatus?.message || 'Verifica stato licenza in corso...'}</div>
                    </>
                  ) : (
                    <>
                      <div><span className="font-semibold">Email:</span> admin@nexora.com</div>
                      <div><span className="font-semibold">Password:</span> admin123</div>
                      <div>Nella demo desktop non serve inserire il codice azienda.</div>
                    </>
                  )}
                </AlertDescription>
              </Alert>

              {isFullDesktopBuild ? (
                <div className={`rounded-2xl border p-4 ${fullBuildActivated ? 'border-emerald-500/30 bg-slate-900' : 'border-amber-400/35 bg-slate-900'}`}>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-semibold text-white">Attivazione demo</div>
                      <div className="text-xs text-slate-100">
                        {fullBuildActivated
                          ? `${trialStatus?.activation_holder ? `Licenza intestata a ${trialStatus.activation_holder}. ` : ''}${trialStatus?.message || 'Licenza valida.'}`
                          : 'Premi il pulsante per registrare subito una demo locale valida 7 giorni su questo dispositivo.'}
                      </div>
                    </div>

                    {trialStatus?.device_fingerprint ? (
                      <div className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-slate-100">
                        <div className="font-medium text-white">ID dispositivo</div>
                        <div className="mt-1 break-all font-mono">{trialStatus.device_fingerprint}</div>
                      </div>
                    ) : null}

                    {!fullBuildActivated ? (
                      <div className="space-y-3">
                        <Button type="button" onClick={handleDemoActivation} disabled={activationLoading || desktopStatusPending} className="w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-fuchsia-600 text-white shadow-[0_16px_35px_rgba(37,99,235,0.35)] hover:from-cyan-400 hover:via-blue-500 hover:to-fuchsia-500">
                          {activationLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Attivazione demo in corso...
                            </>
                          ) : (
                            <>
                              <Shield className="h-4 w-4 mr-2" />
                              Attiva licenza demo
                            </>
                          )}
                        </Button>
                        <div className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-xs text-slate-100">
                          <div className="font-medium text-white">Licenza completa</div>
                          <div className="mt-1">Presto disponibile.</div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {/* OAuth Providers */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleOAuthSignIn('google')}
                  disabled={isLoading || activationLoading || desktopStatusPending || requiresActivation || !availableProviders.google}
                  className="w-full border-slate-700 bg-slate-900/70 text-slate-100 hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500"
                >
                  <Chrome className="h-4 w-4 mr-2" />
                  Google
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleOAuthSignIn('azure-ad')}
                  disabled={isLoading || activationLoading || desktopStatusPending || requiresActivation || !availableProviders['azure-ad']}
                  className="w-full border-slate-700 bg-slate-900/70 text-slate-100 hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500"
                >
                  <Building className="h-4 w-4 mr-2" />
                  Microsoft
                </Button>
              </div>

              {(!availableProviders.google || !availableProviders['azure-ad']) && (
                <p className="text-center text-xs text-slate-300">
                  I provider social si attivano automaticamente dopo la configurazione delle credenziali OAuth nel file ambiente.
                </p>
              )}

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-950 px-2 text-slate-300">o continua con</span>
                </div>
              </div>

              {/* Credentials Form */}
              <form onSubmit={handleCredentialsSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-200">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="nome@azienda.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="border-slate-700 bg-slate-900 pl-10 text-white placeholder:text-slate-400 focus-visible:ring-cyan-400"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-200">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-slate-700 bg-slate-900 pl-10 pr-10 text-white placeholder:text-slate-400 focus-visible:ring-cyan-400"
                      required
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 text-slate-300 hover:bg-transparent hover:text-white"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-slate-300" />
                      ) : (
                        <Eye className="h-4 w-4 text-slate-300" />
                      )}
                    </Button>
                  </div>
                </div>

                {showCompanyCodeField ? (
                  <div className="space-y-2">
                    <Label htmlFor="tenantCode" className="text-slate-200">{companyCodeLabel}</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-3 h-4 w-4 text-slate-300" />
                      <Input
                        id="tenantCode"
                        type="text"
                        placeholder={companyCodePlaceholder}
                        value={tenantCode}
                        onChange={(e) => setTenantCode(e.target.value)}
                        className="border-slate-700 bg-slate-900 pl-10 text-white placeholder:text-slate-400 focus-visible:ring-cyan-400"
                      />
                    </div>
                  </div>
                ) : null}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                    />
                    <Label htmlFor="remember" className="text-sm text-slate-100">
                      Ricordami
                    </Label>
                  </div>
                  <span className="text-sm text-slate-200">Recupero password disponibile tramite amministratore</span>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-cyan-500 via-blue-600 to-fuchsia-600 text-white shadow-[0_16px_35px_rgba(37,99,235,0.35)] hover:from-cyan-400 hover:via-blue-500 hover:to-fuchsia-500"
                    disabled={isLoading || activationLoading || desktopStatusPending || requiresActivation}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Accesso in corso...
                      </>
                    ) : (
                      <>
                        <LogIn className="h-4 w-4 mr-2" />
                        Accedi al sistema
                      </>
                    )}
                  </Button>
                  <Button asChild type="button" variant="outline" className="w-full border-slate-700 bg-slate-900 text-white hover:bg-slate-800 hover:text-white">
                    <Link href="/">
                      <Zap className="h-4 w-4 mr-2" />
                      Scopri di più
                    </Link>
                  </Button>
                </div>

                {requiresActivation ? (
                  <p className="text-xs text-center text-amber-300">
                    Attiva prima la licenza demo per accedere al gestionale.
                  </p>
                ) : null}
              </form>

              {/* Biometric Authentication */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-950 px-2 text-slate-300">o</span>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={handleBiometricAuth}
                disabled={desktopStatusPending || requiresActivation}
                className="w-full border-slate-700 bg-slate-900 text-white hover:bg-slate-800 hover:text-white"
              >
                <Fingerprint className="h-4 w-4 mr-2" />
                Autenticazione Biometrica
              </Button>

              {/* Sign Up Link */}
              <div className="text-center text-sm">
                <span className="text-slate-200">Non hai un account? </span>
                <Link
                  href="/auth/signup"
                  className="font-medium text-cyan-300 hover:text-cyan-200"
                >
                  Registrati gratuitamente
                </Link>
              </div>

              {/* Terms */}
              <p className="text-xs text-slate-200 text-center">
                Accedendo accetti i nostri Termini di Servizio e l&apos;Informativa Privacy.
              </p>

              <div className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-center text-xs text-slate-200">
                NEXORA è un progetto ideato e sviluppato da <span className="font-semibold text-white">Gaetano Meli</span>.
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
