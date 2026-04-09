'use client'

import { useDesktopRuntime } from './desktop-runtime-provider'

export function DesktopFeatureGuard({
  feature,
  children,
  fallback = null,
}: {
  feature: string
  children: React.ReactNode
  fallback?: React.ReactNode
}) {
  const { isRestrictedFeature } = useDesktopRuntime()

  if (isRestrictedFeature(feature)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
