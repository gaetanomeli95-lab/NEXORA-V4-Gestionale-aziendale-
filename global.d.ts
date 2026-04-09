declare module '*.css'

interface Window {
  softshopDesktop?: {
    platform?: string
    isDesktop?: boolean
    runtime?: 'electron'
    buildMode?: 'demo' | 'full'
    getTrialStatus?: () => Promise<unknown>
    refreshTrialStatus?: () => Promise<unknown>
    activateDemoLicense?: () => Promise<unknown>
    activateFullLicense?: (code: string) => Promise<unknown>
  }
}
