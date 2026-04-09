const SETTINGS_STORAGE_KEY = 'softshop-v4-settings'

export function buildPrintUrl(type: string, id: string, format: 'html' | 'pdf' = 'html') {
  const params = new URLSearchParams({ type, id, format })

  if (typeof window !== 'undefined') {
    try {
      const rawSettings = window.localStorage.getItem('softshop-v4-settings')
      if (rawSettings) {
        const parsed = JSON.parse(rawSettings)
        const logo = parsed?.company?.logo
        if (logo && (!String(logo).startsWith('data:') || String(logo).length < 1500)) {
          params.set('logo', logo)
        }
      }
    } catch {
    }
  }

  return `/api/print?${params.toString()}`
}

export async function openPrintDocument(type: string, id: string) {
  if (typeof window !== 'undefined') {
    const printWindow = window.open('', '_blank')

    try {
      const rawSettings = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (rawSettings) {
        const parsed = JSON.parse(rawSettings)
        if (parsed?.company) {
          await fetch('/api/settings/company', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed.company)
          })
        }
      }
    } catch {
    }

    const targetUrl = buildPrintUrl(type, id, 'html')
    if (printWindow) {
      printWindow.location.href = targetUrl
    } else {
      window.open(targetUrl, '_blank')
    }
  }
}

export async function downloadPrintDocument(type: string, id: string) {
  if (typeof window !== 'undefined') {
    try {
      const rawSettings = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (rawSettings) {
        const parsed = JSON.parse(rawSettings)
        if (parsed?.company) {
          await fetch('/api/settings/company', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(parsed.company)
          })
        }
      }
    } catch {
    }

    window.open(buildPrintUrl(type, id, 'pdf'), '_blank')
  }
}
