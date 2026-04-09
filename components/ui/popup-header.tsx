import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

import { getModuleTheme, type ModuleThemeName } from '@/components/layout/module-theme'
import { cn } from '@/lib/utils'

interface PopupHeaderProps {
  theme: ModuleThemeName
  title: string
  description?: string
  icon?: LucideIcon
  actions?: ReactNode
  className?: string
}

export function PopupHeader({
  theme,
  title,
  description,
  icon,
  actions,
  className,
}: PopupHeaderProps) {
  const resolvedTheme = getModuleTheme(theme)
  const Icon = icon || resolvedTheme.icon

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-t-3xl bg-gradient-to-r px-6 py-5 text-white',
        resolvedTheme.gradient,
        resolvedTheme.shadow,
        className,
      )}
    >
      <Icon className={cn('pointer-events-none absolute -right-3 top-1/2 hidden h-20 w-20 -translate-y-1/2 md:block', resolvedTheme.watermark)} />
      <div className="relative flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/20 shadow-sm backdrop-blur-sm">
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold tracking-tight text-white">{title}</h2>
            {description ? <p className="mt-1 text-sm font-medium text-white/90">{description}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  )
}
