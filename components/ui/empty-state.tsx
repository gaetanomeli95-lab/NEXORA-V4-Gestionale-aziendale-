import { Inbox, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface EmptyStateProps {
  icon?: LucideIcon
  title?: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  actionClassName?: string
  className?: string
}

export function EmptyState({
  icon: Icon = Inbox,
  title = "Nessun dato disponibile",
  description = "Non ci sono elementi da mostrare in questa sezione.",
  actionLabel,
  onAction,
  actionClassName,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("empty-state-shell", className)}>
      <div className="empty-state-icon">
        <Icon className="h-7 w-7" />
      </div>
      <div className="space-y-1">
        <p className="empty-state-title">{title}</p>
        <p className="empty-state-description">{description}</p>
      </div>
      {actionLabel && onAction ? (
        <Button
          type="button"
          variant="outline"
          onClick={onAction}
          className={cn("border-slate-300 bg-white/90 text-slate-700 hover:bg-slate-50", actionClassName)}
        >
          {actionLabel}
        </Button>
      ) : null}
    </div>
  )
}
