"use client"

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { useDesktopRuntime } from '@/components/desktop/desktop-runtime-provider'

const SETTINGS_STORAGE_KEY = 'softshop-v4-settings'

export default function DemoDataBadge() {
  const { buildFlavor } = useDesktopRuntime()
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (buildFlavor === 'full') {
      setEnabled(false)
      return
    }

    try {
      const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY)
      if (!raw) return
      const parsed = JSON.parse(raw)
      setEnabled(Boolean(parsed?.demo?.enabled))
    } catch {
      setEnabled(false)
    }
  }, [buildFlavor])

  if (!enabled) return null

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50">
      <Badge className="border border-fuchsia-200 bg-fuchsia-600 px-3 py-2 text-xs font-bold tracking-[0.18em] text-white shadow-lg shadow-fuchsia-900/25">
        DEMO DATA
      </Badge>
    </div>
  )
}
