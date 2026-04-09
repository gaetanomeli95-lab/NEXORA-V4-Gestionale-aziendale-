import DemoDataBadge from '@/components/demo-data-badge'
import NavigationMain from '@/components/navigation-main'

export default function LayoutWithNav({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <NavigationMain />
      <main className="min-w-0 flex-1">{children}</main>
      <DemoDataBadge />
    </div>
  )
}
