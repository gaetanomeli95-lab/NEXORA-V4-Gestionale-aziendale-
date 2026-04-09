"use client"

import { useState, useEffect, useRef } from 'react'
import { Search, UserPlus, Phone, Mail, MapPin, X } from 'lucide-react'
import { type ModuleThemeName, getPopupDialogContentClassName, getPopupPrimaryButtonClassName } from '@/components/layout/module-theme'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PopupHeader } from '@/components/ui/popup-header'

export interface ContactItem {
  id: string
  name: string
  email?: string
  phone?: string
  vatNumber?: string
  city?: string
  code?: string
  type?: string
}

interface ContactPickerDialogProps {
  open: boolean
  onClose: () => void
  onSelect: (contact: ContactItem) => void
  apiUrl: string
  theme?: ModuleThemeName
  title?: string
  placeholder?: string
  onCreateNew?: (name: string) => void
}

export function ContactPickerDialog({
  open,
  onClose,
  onSelect,
  apiUrl,
  theme = 'customers',
  title = 'Seleziona Contatto',
  placeholder = 'Cerca per nome, email, telefono...',
  onCreateNew,
}: ContactPickerDialogProps) {
  const [contacts, setContacts] = useState<ContactItem[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setSearch('')
      fetchContacts()
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, apiUrl])

  const fetchContacts = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${apiUrl}?limit=500`)
      const result = await res.json()
      if (result.success) {
        const data = result.data?.customers || result.data?.suppliers || result.data || []
        setContacts(Array.isArray(data) ? data : data.customers || data.suppliers || [])
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  const filtered = contacts.filter(c => {
    if (!search.trim()) return true
    const s = search.toLowerCase()
    return (
      c.name?.toLowerCase().includes(s) ||
      c.email?.toLowerCase().includes(s) ||
      c.phone?.toLowerCase().includes(s) ||
      c.vatNumber?.toLowerCase().includes(s) ||
      c.city?.toLowerCase().includes(s) ||
      c.code?.toLowerCase().includes(s)
    )
  })

  const handleSelect = (contact: ContactItem) => {
    onSelect(contact)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={getPopupDialogContentClassName("max-w-2xl max-h-[85vh] flex flex-col")}>
        <PopupHeader theme={theme} title={title} description="Ricerca e selezione rapida dalla rubrica del modulo" />
        <div className="border-b px-5 pb-3 pt-4">
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              ref={inputRef}
              placeholder={placeholder}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10 h-10 text-base"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">{loading ? 'Caricamento...' : `${filtered.length} ${filtered.length === 1 ? 'contatto' : 'contatti'}`}</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <span className="animate-spin mr-2">⟳</span> Caricamento rubrica...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <p className="font-medium text-slate-700">Nessun risultato per "{search}"</p>
              {onCreateNew && (
                <Button variant="outline" size="sm" className="mt-3" onClick={() => { onCreateNew(search); onClose() }}>
                  <UserPlus className="h-4 w-4 mr-2" />Crea "{search}"
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map(contact => (
                <button
                  key={contact.id}
                  onClick={() => handleSelect(contact)}
                  className="w-full text-left px-5 py-3.5 transition-colors group hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-semibold text-slate-900">
                          {contact.name}
                        </span>
                        {contact.code && (
                          <Badge variant="outline" className="text-xs shrink-0">{contact.code}</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5">
                        {contact.phone && (
                          <span className="flex items-center gap-1 text-sm text-slate-500">
                            <Phone className="h-3 w-3" />{contact.phone}
                          </span>
                        )}
                        {contact.email && (
                          <span className="flex items-center gap-1 text-sm text-slate-500">
                            <Mail className="h-3 w-3" />{contact.email}
                          </span>
                        )}
                        {contact.city && (
                          <span className="flex items-center gap-1 text-sm text-slate-500">
                            <MapPin className="h-3 w-3" />{contact.city}
                          </span>
                        )}
                      </div>
                    </div>
                    {contact.vatNumber && (
                      <span className="shrink-0 font-mono text-xs text-slate-400">{contact.vatNumber}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {onCreateNew && (
          <div className="border-t bg-slate-50 px-5 py-3">
            <Button size="sm" className={getPopupPrimaryButtonClassName(theme, 'w-full')} onClick={() => { onCreateNew(search); onClose() }}>
              <UserPlus className="h-4 w-4 mr-2" />Crea nuovo contatto{search ? ` "${search}"` : ''}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
