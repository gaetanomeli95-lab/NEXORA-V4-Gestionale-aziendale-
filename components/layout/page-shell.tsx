import { Loader2, type LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { moduleThemeClasses, type ModuleThemeName } from "@/components/layout/module-theme"
import { cn } from "@/lib/utils"

const pageShellColorClasses = {
  blue: "from-blue-600 to-violet-600",
  violet: "from-violet-600 to-purple-600",
  orange: "from-amber-500 to-orange-600",
  emerald: "from-emerald-600 to-green-600",
  rose: "from-rose-600 to-pink-600",
  indigo: "from-indigo-600 to-violet-600",
  slate: "from-slate-900 to-indigo-900",
} as const

type PageShellColor = keyof typeof pageShellColorClasses
type PageShellTheme = ModuleThemeName

interface PageShellProps {
  title: string
  description?: string
  icon: LucideIcon
  theme?: PageShellTheme
  themeColor?: string
  color?: PageShellColor
  actions?: ReactNode
  children: ReactNode
  className?: string
  contentClassName?: string
  headerClassName?: string
}

interface PageShellLoadingProps {
  label?: string
  className?: string
  theme?: PageShellTheme
  themeColor?: string
}

export function PageShell({
  title,
  description,
  icon: Icon,
  theme,
  themeColor,
  color = "blue",
  actions,
  children,
  className,
  contentClassName,
  headerClassName,
}: PageShellProps) {
  const resolvedTheme = theme ? moduleThemeClasses[theme] : null

  return (
    <div className={cn("min-h-screen bg-slate-50", className)}>
      <div
        className={cn(
          "relative overflow-hidden bg-gradient-to-r text-white shadow-md",
          resolvedTheme?.gradient ?? pageShellColorClasses[color],
          resolvedTheme?.shadow,
          themeColor,
          headerClassName
        )}
      >
        <Icon className={cn("pointer-events-none absolute -right-4 top-1/2 hidden h-32 w-32 -translate-y-1/2 lg:block", resolvedTheme?.watermark ?? "text-white/10")} />

        <div className="relative mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/15 shadow-sm backdrop-blur-sm">
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold tracking-tight text-white">{title}</h1>
              {description ? <p className="mt-1 text-sm text-slate-100/90">{description}</p> : null}
            </div>
          </div>

          {actions ? (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          ) : null}
        </div>
      </div>

      <div className={cn("mx-auto max-w-7xl space-y-6 px-4 py-6 md:px-6", contentClassName)}>
        {children}
      </div>
    </div>
  )
}

export function PageShellLoading({ label = "Caricamento in corso...", className, theme, themeColor }: PageShellLoadingProps) {
  const resolvedTheme = theme ? moduleThemeClasses[theme] : null

  return (
    <div className={cn("flex min-h-[220px] items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm", className)}>
      <div className="flex flex-col items-center gap-3 text-center">
        <Loader2 className={cn("h-8 w-8 animate-spin", resolvedTheme?.loader ?? "text-blue-600", themeColor)} />
        <p className="text-sm font-medium text-slate-600">{label}</p>
      </div>
    </div>
  )
}
