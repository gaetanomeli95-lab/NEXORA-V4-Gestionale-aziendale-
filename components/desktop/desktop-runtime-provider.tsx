'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { SessionProvider } from 'next-auth/react'

type DesktopRuntimeType = 'web' | 'electron'

interface StorageHealth {
  file_present: boolean
  registry_present: boolean
  restored_file: boolean
  restored_registry: boolean
  hidden_counter_detected: boolean
}

interface TrialStatus {
  build_flavor: 'demo' | 'full'
  trial_enforced: boolean
  trial_expired: boolean
  activation_required: boolean
  activation_valid: boolean
  activation_holder: string | null
  activation_expires_at: string | null
  device_fingerprint: string | null
  first_run_timestamp: string | null
  expires_at: string | null
  hours_remaining: number
  watermark_label: string | null
  restricted_features: string[]
  integrity_flags: string[]
  storage_health: StorageHealth
  message: string | null
}

interface DesktopRuntimeContextValue {
  isDesktopRuntime: boolean
  runtimeType: DesktopRuntimeType
  buildFlavor: 'demo' | 'full' | null
  trialStatus: TrialStatus | null
  isRestrictedFeature: (feature: string) => boolean
  refreshStatus: () => Promise<TrialStatus | null>
  activateDemoLicense: () => Promise<TrialStatus | null>
  activateLicense: (code: string) => Promise<TrialStatus | null>
}

const DesktopRuntimeContext = createContext<DesktopRuntimeContextValue>({
  isDesktopRuntime: false,
  runtimeType: 'web',
  buildFlavor: null,
  trialStatus: null,
  isRestrictedFeature: () => false,
  refreshStatus: async () => null,
  activateDemoLicense: async () => null,
  activateLicense: async () => null,
})

const isElectronRuntime = () => typeof window !== 'undefined' && Boolean(window.softshopDesktop?.isDesktop)

const getElectronBuildFlavor = (): 'demo' | 'full' | null => {
  if (typeof window === 'undefined') {
    return null
  }

  return window.softshopDesktop?.buildMode ?? null
}

async function invokeElectronTrialStatus(command: 'get' | 'refresh'): Promise<TrialStatus | null> {
  if (!isElectronRuntime()) {
    return null
  }

  if (command === 'get') {
    return (await window.softshopDesktop?.getTrialStatus?.()) as TrialStatus | null
  }

  return (await window.softshopDesktop?.refreshTrialStatus?.()) as TrialStatus | null
}

async function invokeTrialStatus(command: 'get_trial_status' | 'refresh_trial_status'): Promise<TrialStatus | null> {
  if (isElectronRuntime()) {
    return invokeElectronTrialStatus(command === 'get_trial_status' ? 'get' : 'refresh')
  }

  return null
}

async function loadTrialStatus(): Promise<TrialStatus | null> {
  return invokeTrialStatus('get_trial_status')
}

async function refreshTrialStatus(): Promise<TrialStatus | null> {
  return invokeTrialStatus('refresh_trial_status')
}

async function activateDemoLicense(): Promise<TrialStatus | null> {
  if (isElectronRuntime()) {
    return (await window.softshopDesktop?.activateDemoLicense?.()) as TrialStatus | null
  }

  return null
}

async function activateFullLicense(code: string): Promise<TrialStatus | null> {
  if (isElectronRuntime()) {
    return (await window.softshopDesktop?.activateFullLicense?.(code)) as TrialStatus | null
  }

  return null
}

export function DesktopRuntimeProvider({ children }: { children: React.ReactNode }) {
  const [trialStatus, setTrialStatus] = useState<TrialStatus | null>(null)
  const [isDesktopRuntime, setIsDesktopRuntime] = useState(false)
  const [runtimeType, setRuntimeType] = useState<DesktopRuntimeType>('web')
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    let active = true

    const bootstrap = async () => {
      const electron = isElectronRuntime()
      const desktop = electron
      const nextRuntimeType: DesktopRuntimeType = electron ? 'electron' : 'web'

      if (!active) return

      setRuntimeType(nextRuntimeType)
      setIsDesktopRuntime(desktop)
      if (!desktop) return

      try {
        const status = await refreshTrialStatus()
        if (active) {
          setTrialStatus(status)
        }
      } catch (error) {
        try {
          const status = await loadTrialStatus()
          if (active) {
            setTrialStatus(status)
          }
        } catch (fallbackError) {
          console.error('Failed to load desktop runtime status', error)
          console.error('Failed to read cached desktop runtime status', fallbackError)
        }
      }
    }

    bootstrap()

    return () => {
      active = false
    }
  }, [])

  const effectiveBuildFlavor = trialStatus?.build_flavor ?? (runtimeType === 'electron' ? getElectronBuildFlavor() : null)

  const value = useMemo<DesktopRuntimeContextValue>(() => ({
    isDesktopRuntime,
    runtimeType,
    buildFlavor: effectiveBuildFlavor,
    trialStatus,
    isRestrictedFeature: (feature: string) => {
      if (!trialStatus || trialStatus.build_flavor !== 'demo') {
        return false
      }

      return trialStatus.trial_expired && trialStatus.restricted_features.includes(feature)
    },
    refreshStatus: async () => {
      if (runtimeType === 'web') {
        return trialStatus
      }

      const status = await refreshTrialStatus()
      setTrialStatus(status)
      return status
    },
    activateDemoLicense: async () => {
      if (runtimeType === 'web') {
        return trialStatus
      }

      const status = await activateDemoLicense()
      setTrialStatus(status)
      return status
    },
    activateLicense: async (code: string) => {
      if (runtimeType === 'web') {
        return trialStatus
      }

      const status = await activateFullLicense(code)
      setTrialStatus(status)
      return status
    },
  }), [effectiveBuildFlavor, isDesktopRuntime, runtimeType, trialStatus])

  const requiresFullActivation =
    isDesktopRuntime &&
    trialStatus?.build_flavor === 'full' &&
    Boolean(trialStatus.activation_required) &&
    !trialStatus.activation_valid

  const isAuthRoute = pathname.startsWith('/auth')
  const shouldRedirectForActivation = requiresFullActivation && !isAuthRoute

  useEffect(() => {
    if (!shouldRedirectForActivation) {
      return
    }

    router.replace('/auth/signin?activationRequired=1')
  }, [router, shouldRedirectForActivation])

  return (
    <SessionProvider>
      <DesktopRuntimeContext.Provider value={value}>
        {shouldRedirectForActivation ? null : children}
        {shouldRedirectForActivation ? (
          <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/92 px-6 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl border border-amber-400/20 bg-slate-900 p-8 text-slate-100 shadow-2xl">
              <div className="mb-3 inline-flex rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
                Attivazione richiesta
              </div>
              <h2 className="text-3xl font-semibold">NEXORA V4 Enterprise non è ancora attivo</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Devi attivare questa installazione con un codice licenza valido prima di accedere al gestionale.
              </p>
              <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-950/70 p-4 text-sm text-slate-300">
                <div><span className="font-medium text-slate-100">Stato:</span> {trialStatus?.message ?? 'Attivazione richiesta'}</div>
                {trialStatus?.device_fingerprint ? (
                  <div className="mt-2 break-all"><span className="font-medium text-slate-100">ID dispositivo:</span> {trialStatus.device_fingerprint}</div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
        {trialStatus?.build_flavor === 'demo' && trialStatus.watermark_label ? (
          <div className="pointer-events-none fixed bottom-4 right-4 z-[90] max-w-[calc(100vw-2rem)] rounded-full border border-cyan-400/30 bg-slate-950/85 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300 shadow-2xl backdrop-blur sm:px-4 sm:text-xs">
            {trialStatus.watermark_label}
          </div>
        ) : null}
        {trialStatus?.build_flavor === 'demo' && trialStatus.trial_expired ? (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/88 px-6 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl border border-red-400/20 bg-slate-900 p-8 text-slate-100 shadow-2xl">
              <div className="mb-3 inline-flex rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-red-300">
                Trial scaduto
              </div>
              <h2 className="text-3xl font-semibold">La prova NEXORA è terminata</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Questo ambiente demo ha superato la finestra di 7 giorni oppure ha rilevato un’anomalia di reinstallazione.
              </p>
              <div className="mt-6 rounded-2xl border border-slate-700 bg-slate-950/70 p-4 text-sm text-slate-300">
                <div><span className="font-medium text-slate-100">Stato:</span> {trialStatus.message ?? 'Trial scaduto'}</div>
                <div className="mt-2"><span className="font-medium text-slate-100">Feature limitate:</span> {trialStatus.restricted_features.join(', ')}</div>
              </div>
            </div>
          </div>
        ) : null}
      </DesktopRuntimeContext.Provider>
    </SessionProvider>
  )
}

export function useDesktopRuntime() {
  return useContext(DesktopRuntimeContext)
}
