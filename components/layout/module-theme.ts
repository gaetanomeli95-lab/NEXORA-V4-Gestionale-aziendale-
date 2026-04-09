import {
  BarChart3,
  Building2,
  Calculator,
  CreditCard,
  FileText,
  GitBranch,
  LayoutGrid,
  Package,
  PackageOpen,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
  Tag,
} from 'lucide-react'

import { cn } from '@/lib/utils'

export interface ModuleThemeConfig {
  gradient: string
  shadow: string
  watermark: string
  loader: string
  icon: LucideIcon
  primaryButton: string
}

export const moduleThemeClasses = {
  default: {
    gradient: 'from-blue-600 to-violet-600',
    shadow: 'shadow-[0_22px_50px_-26px_rgba(59,130,246,0.7)]',
    watermark: 'text-white/10',
    loader: 'text-blue-600',
    icon: LayoutGrid,
    primaryButton: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  warehouse: {
    gradient: 'from-orange-500 to-red-500',
    shadow: 'shadow-[0_24px_52px_-26px_rgba(249,115,22,0.72)]',
    watermark: 'text-white/10',
    loader: 'text-orange-500',
    icon: Package,
    primaryButton: 'bg-orange-500 hover:bg-orange-600 text-white',
  },
  ddts: {
    gradient: 'from-sky-500 to-blue-500',
    shadow: 'shadow-[0_24px_52px_-26px_rgba(14,165,233,0.72)]',
    watermark: 'text-white/10',
    loader: 'text-sky-500',
    icon: Truck,
    primaryButton: 'bg-sky-500 hover:bg-sky-600 text-white',
  },
  estimates: {
    gradient: 'from-violet-500 to-purple-500',
    shadow: 'shadow-[0_24px_52px_-26px_rgba(139,92,246,0.72)]',
    watermark: 'text-white/10',
    loader: 'text-violet-500',
    icon: Calculator,
    primaryButton: 'bg-violet-600 hover:bg-violet-700 text-white',
  },
  invoices: {
    gradient: 'from-blue-600 to-indigo-600',
    shadow: 'shadow-[0_24px_52px_-26px_rgba(37,99,235,0.72)]',
    watermark: 'text-white/10',
    loader: 'text-blue-600',
    icon: FileText,
    primaryButton: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  customers: {
    gradient: 'from-teal-500 to-cyan-500',
    shadow: 'shadow-[0_24px_52px_-26px_rgba(20,184,166,0.72)]',
    watermark: 'text-white/10',
    loader: 'text-teal-500',
    icon: Users,
    primaryButton: 'bg-teal-600 hover:bg-teal-700 text-white',
  },
  suppliers: {
    gradient: 'from-slate-600 to-gray-700',
    shadow: 'shadow-[0_24px_52px_-26px_rgba(71,85,105,0.72)]',
    watermark: 'text-white/10',
    loader: 'text-slate-600',
    icon: Building2,
    primaryButton: 'bg-slate-700 hover:bg-slate-800 text-white',
  },
  categories: {
    gradient: 'from-amber-500 to-orange-600',
    shadow: 'shadow-[0_24px_52px_-26px_rgba(245,158,11,0.72)]',
    watermark: 'text-white/10',
    loader: 'text-amber-500',
    icon: Tag,
    primaryButton: 'bg-orange-500 hover:bg-orange-600 text-white',
  },
  payments: {
    gradient: 'from-emerald-500 to-green-500',
    shadow: 'shadow-[0_24px_52px_-26px_rgba(16,185,129,0.72)]',
    watermark: 'text-white/10',
    loader: 'text-emerald-500',
    icon: CreditCard,
    primaryButton: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  cashBook: {
    gradient: 'from-teal-600 to-emerald-600',
    shadow: 'shadow-[0_24px_52px_-26px_rgba(13,148,136,0.72)]',
    watermark: 'text-white/10',
    loader: 'text-teal-600',
    icon: Wallet,
    primaryButton: 'bg-teal-600 hover:bg-teal-700 text-white',
  },
  repairs: {
    gradient: 'from-rose-500 to-pink-500',
    shadow: 'shadow-[0_24px_52px_-26px_rgba(244,63,94,0.72)]',
    watermark: 'text-white/10',
    loader: 'text-rose-500',
    icon: Wrench,
    primaryButton: 'bg-rose-600 hover:bg-rose-700 text-white',
  },
  orders: {
    gradient: 'from-orange-600 to-amber-600',
    shadow: 'shadow-[0_24px_52px_-26px_rgba(234,88,12,0.72)]',
    watermark: 'text-white/10',
    loader: 'text-orange-600',
    icon: ShoppingCart,
    primaryButton: 'bg-orange-600 hover:bg-orange-700 text-white',
  },
  supplierOrders: {
    gradient: 'from-amber-700 to-orange-700',
    shadow: 'shadow-[0_24px_52px_-26px_rgba(180,83,9,0.72)]',
    watermark: 'text-white/10',
    loader: 'text-amber-700',
    icon: PackageOpen,
    primaryButton: 'bg-amber-700 hover:bg-amber-800 text-white',
  },
  workflows: {
    gradient: 'from-indigo-500 to-purple-500',
    shadow: 'shadow-[0_24px_52px_-26px_rgba(99,102,241,0.72)]',
    watermark: 'text-white/10',
    loader: 'text-indigo-500',
    icon: GitBranch,
    primaryButton: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  },
  analytics: {
    gradient: 'from-purple-600 to-violet-600',
    shadow: 'shadow-[0_24px_52px_-26px_rgba(147,51,234,0.72)]',
    watermark: 'text-white/10',
    loader: 'text-purple-600',
    icon: BarChart3,
    primaryButton: 'bg-purple-600 hover:bg-purple-700 text-white',
  },
  reports: {
    gradient: 'from-violet-700 to-indigo-700',
    shadow: 'shadow-[0_24px_52px_-26px_rgba(109,40,217,0.72)]',
    watermark: 'text-white/10',
    loader: 'text-violet-700',
    icon: BarChart3,
    primaryButton: 'bg-violet-700 hover:bg-violet-800 text-white',
  },
  settings: {
    gradient: 'from-gray-600 to-slate-600',
    shadow: 'shadow-[0_24px_52px_-26px_rgba(75,85,99,0.72)]',
    watermark: 'text-white/10',
    loader: 'text-gray-600',
    icon: Settings,
    primaryButton: 'bg-gray-700 hover:bg-gray-800 text-white',
  },
  products: {
    gradient: 'from-amber-500 to-orange-500',
    shadow: 'shadow-[0_24px_52px_-26px_rgba(245,158,11,0.72)]',
    watermark: 'text-white/10',
    loader: 'text-amber-500',
    icon: Package,
    primaryButton: 'bg-orange-500 hover:bg-orange-600 text-white',
  },
} as const satisfies Record<string, ModuleThemeConfig>

export type ModuleThemeName = keyof typeof moduleThemeClasses

export function getModuleTheme(theme?: ModuleThemeName) {
  return moduleThemeClasses[theme || 'default']
}

export function getPopupDialogContentClassName(className?: string) {
  return cn(
    'overflow-hidden rounded-3xl border border-slate-200 bg-white p-0 gap-0 shadow-[0_32px_96px_-28px_rgba(15,23,42,0.36)]',
    className,
  )
}

export function getPopupPrimaryButtonClassName(theme: ModuleThemeName, className?: string) {
  return cn('shadow-sm', getModuleTheme(theme).primaryButton, className)
}
