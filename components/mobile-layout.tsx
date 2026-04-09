"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Menu, 
  X, 
  Home, 
  BarChart3, 
  Users, 
  Package, 
  ShoppingCart, 
  CreditCard, 
  FileText, 
  Zap, 
  Settings,
  Bell,
  Search,
  Plus,
  Filter,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { usePathname } from 'next/navigation'

interface MobileLayoutProps {
  children: React.ReactNode
  title?: string
  showSearch?: boolean
  showFilters?: boolean
  showAdd?: boolean
  showRefresh?: boolean
  onSearch?: (query: string) => void
  onRefresh?: () => void
  badgeCount?: number
}

const mobileNavigation = [
  { name: 'Dashboard', href: '/dashboard-real', icon: BarChart3 },
  { name: 'Clienti', href: '/customers', icon: Users },
  { name: 'Prodotti', href: '/products', icon: Package },
  { name: 'Ordini', href: '/orders', icon: ShoppingCart },
  { name: 'Pagamenti', href: '/payments', icon: CreditCard },
  { name: 'Reports', href: '/reports', icon: FileText },
  { name: 'Workflows', href: '/workflows', icon: Zap },
  { name: 'Impostazioni', href: '/settings', icon: Settings },
]

export default function MobileLayout({ 
  children, 
  title, 
  showSearch = false, 
  showFilters = false, 
  showAdd = false,
  showRefresh = false,
  onSearch,
  onRefresh,
  badgeCount = 0
}: MobileLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const pathname = usePathname()

  useEffect(() => {
    if (onSearch) {
      onSearch(searchQuery)
    }
  }, [searchQuery, onSearch])

  const currentPage = mobileNavigation.find(item => item.href === pathname)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Mobile Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <div className="flex flex-col h-full">
                  {/* Sidebar Header */}
                  <div className="flex items-center space-x-3 p-4 bg-blue-600 text-white">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="font-bold">NEXORA v4</span>
                  </div>
                  
                  {/* Navigation */}
                  <nav className="flex-1 overflow-y-auto p-4">
                    <div className="space-y-2">
                      {mobileNavigation.map((item) => {
                        const isActive = pathname === item.href
                        return (
                          <a
                            key={item.name}
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                              isActive
                                ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          >
                            <item.icon className="mr-3 h-5 w-5" />
                            {item.name}
                          </a>
                        )
                      })}
                    </div>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>

            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {title || currentPage?.name || 'NEXORA v4'}
              </h1>
              {badgeCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {badgeCount}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {showRefresh && onRefresh && (
              <Button variant="ghost" size="sm" onClick={onRefresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            
            {showAdd && (
              <Button size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            )}

            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              {badgeCount > 0 && (
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              )}
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        {showSearch && (
          <div className="px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cerca..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4"
              />
            </div>
          </div>
        )}

        {/* Filters Bar */}
        {showFilters && (
          <div className="px-4 pb-3 flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtri
            </Button>
            <Button variant="outline" size="sm">
              Ordina
            </Button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200">
        <div className="grid grid-cols-4 gap-1">
          {mobileNavigation.slice(0, 4).map((item) => {
            const isActive = pathname === item.href
            return (
              <a
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center py-2 px-1 transition-colors ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-xs mt-1">{item.name}</span>
              </a>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
