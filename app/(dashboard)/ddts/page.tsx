"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, Plus, Download, Edit, Trash2, Eye, Truck, 
  MoreHorizontal, RefreshCw, Printer, Copy, Receipt, User, Calendar
} from 'lucide-react'
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/ui/empty-state'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { DdtForm } from '@/components/forms/ddt-form'
import { getPopupDialogContentClassName, getPopupPrimaryButtonClassName } from '@/components/layout/module-theme'
import { downloadPrintDocument, openPrintDocument } from '@/lib/print-url'
import { formatDateTime } from '@/lib/utils'
import { PageShell, PageShellLoading } from '@/components/layout/page-shell'
import { PopupHeader } from '@/components/ui/popup-header'

interface DdtCustomer {
  id: string
  name: string
  email?: string
  phone?: string
  address?: string
  city?: string
}

interface DdtItem {
  description: string
  quantity: number
  unit?: string
  code?: string
  notes?: string
}

interface Ddt {
  id: string
  number: string
  customerId?: string
  customer?: DdtCustomer | null
  estimateId?: string
  estimate?: { id: string; number: string } | null
  invoiceId?: string
  invoice?: { id: string; number: string } | null
  issueDate: string
  transportMethod?: string
  referenceNumber?: string
  items: DdtItem[]
  notes?: string
  createdAt: string
  updatedAt: string
}

export default function DdtsPage() {
  const { toast } = useToast()
  const [ddts, setDdts] = useState<Ddt[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalDdts, setTotalDdts] = useState(0)
  const [selectedDdt, setSelectedDdt] = useState<Ddt | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingDdt, setEditingDdt] = useState<Ddt | null>(null)

  const handleCreateDdt = () => { setEditingDdt(null); setShowForm(true) }
  const handleEditDdt = (d: Ddt) => { setEditingDdt(d); setShowForm(true) }
  const handleFormSuccess = () => { setShowForm(false); setEditingDdt(null); fetchDdts() }

  const handleDelete = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo DDT?')) return
    try {
      const res = await fetch(`/api/ddts/${id}`, { method: 'DELETE' })
      const result = await res.json()
      if (result.success) {
        setShowDetails(false)
        setSelectedDdt(null)
        fetchDdts()
      } else {
        toast({
          title: "Errore",
          description: result.error || 'Errore eliminazione',
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Errore",
        description: "Errore di rete",
        variant: "destructive",
      })
    }
  }

  const handleDuplicate = async (id: string) => {
    if (!confirm('Vuoi duplicare questo DDT?')) return
    try {
      const res = await fetch(`/api/duplicate/${id}?type=ddt`, { method: 'POST' })
      const result = await res.json()
      if (result.success) {
        toast({
          title: "Duplicato",
          description: 'DDT duplicato con successo!',
        })
        fetchDdts()
      } else {
        toast({
          title: "Errore",
          description: result.error || 'Errore duplicazione',
          variant: "destructive",
        })
      }
    } catch {
      toast({
        title: "Errore",
        description: "Errore di rete",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchDdts()
  }, [searchQuery, currentPage])

  const fetchDdts = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      })
      if (searchQuery) params.set('search', searchQuery)

      const response = await fetch(`/api/ddts?${params}`)
      const result = await response.json()
      
      if (result.success) {
        setDdts(result.data.ddts || [])
        setTotalPages(result.data.pagination?.pages || 1)
        setTotalDdts(result.data.pagination?.total || 0)
      }
    } catch (error) {
      console.error('Error fetching DDTs:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return formatDateTime(dateString)
  }

  if (loading && ddts.length === 0) {
    return (
      <PageShell title="Documenti di Trasporto" description="Gestione DDT e consegne" icon={Truck} theme="ddts">
        <PageShellLoading label="Caricamento DDT..." theme="ddts" />
      </PageShell>
    )
  }

  return (
    <PageShell
      title="Documenti di Trasporto"
      description="Gestione DDT e consegne"
      icon={Truck}
      theme="ddts"
      actions={
        <>
          <Button variant="outline" size="sm" onClick={fetchDdts} className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <RefreshCw className="h-4 w-4 mr-2" />
            Aggiorna
          </Button>
          <Button variant="outline" size="sm" className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <Download className="h-4 w-4 mr-2" />
            Esporta
          </Button>
          <Button size="sm" onClick={handleCreateDdt} className="border border-sky-400/40 bg-sky-500 text-white hover:bg-sky-600 font-semibold shadow-[0_14px_30px_-18px_rgba(14,165,233,0.75)]">
            <Plus className="h-4 w-4 mr-2" />
            Nuovo DDT
          </Button>
        </>
      }
    >
      <div className="space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
            <Card className="kpi-surface">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.02em] text-slate-500">Totale DDT</p>
                    <p className="metric-value mt-2 text-3xl font-bold text-slate-800">{totalDdts}</p>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-3">
                    <Truck className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
            <Card className="kpi-surface">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.02em] text-slate-500">Questo Mese</p>
                    <p className="metric-value mt-2 text-3xl font-bold text-slate-800">
                      {ddts.filter(d => {
                        const date = new Date(d.issueDate)
                        const now = new Date()
                        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
                      }).length}
                    </p>
                  </div>
                  <div className="rounded-xl bg-green-50 p-3">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
            <Card className="kpi-surface">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.02em] text-slate-500">Con Fattura</p>
                    <p className="metric-value mt-2 text-3xl font-bold text-slate-800">
                      {ddts.filter(d => d.invoiceId).length}
                    </p>
                  </div>
                  <div className="rounded-xl bg-purple-50 p-3">
                    <Receipt className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Cerca DDT per numero, cliente, riferimento..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* DDT Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista DDT ({ddts.length})</CardTitle>
            <CardDescription>Tutti i documenti di trasporto</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° DDT</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Trasporto</TableHead>
                  <TableHead>Rif. Documento</TableHead>
                  <TableHead>Righe</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ddts.map((ddt) => (
                  <TableRow
                    key={ddt.id}
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => { setSelectedDdt(ddt); setShowDetails(true) }}
                  >
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Truck className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">{ddt.number}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900">{ddt.customer?.name || 'N/A'}</div>
                      {ddt.customer?.city && (
                        <div className="text-sm text-gray-500">{ddt.customer.city}</div>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(ddt.issueDate)}</TableCell>
                    <TableCell>
                      {ddt.transportMethod ? (
                        <Badge variant="outline">{ddt.transportMethod}</Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {ddt.estimate && (
                          <div className="text-sm"><span className="text-gray-500">Prev:</span> {ddt.estimate.number}</div>
                        )}
                        {ddt.invoice && (
                          <div className="text-sm"><span className="text-gray-500">Fatt:</span> {ddt.invoice.number}</div>
                        )}
                        {ddt.referenceNumber && !ddt.estimate && !ddt.invoice && (
                          <div className="text-sm text-gray-500">{ddt.referenceNumber}</div>
                        )}
                        {!ddt.estimate && !ddt.invoice && !ddt.referenceNumber && '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{ddt.items?.length || 0} righe</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><Eye className="h-4 w-4 mr-2" />Dettagli</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditDdt(ddt)}><Edit className="h-4 w-4 mr-2" />Modifica</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openPrintDocument('ddt', ddt.id)}><Printer className="h-4 w-4 mr-2" />Stampa</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => downloadPrintDocument('ddt', ddt.id)}><Download className="h-4 w-4 mr-2" />Scarica PDF</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(ddt.id)}><Copy className="h-4 w-4 mr-2" />Duplica</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(ddt.id)}><Trash2 className="h-4 w-4 mr-2" />Elimina</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {ddts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8">
                      <EmptyState
                        icon={Truck}
                        title="Nessun dato disponibile"
                        description="Non ci sono documenti di trasporto da mostrare al momento."
                        actionLabel="Crea il primo DDT"
                        onAction={handleCreateDdt}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-6">
                <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}>Precedente</Button>
                <span className="text-sm text-gray-600">Pagina {currentPage} di {totalPages}</span>
                <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setCurrentPage(p => p + 1)}>Successiva</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* DDT Details Dialog */}
        <Dialog open={showDetails} onOpenChange={setShowDetails}>
          <DialogContent className={getPopupDialogContentClassName("max-w-3xl max-h-[90vh] overflow-y-auto")}>
            <PopupHeader
              theme="ddts"
              title={`DDT ${selectedDdt?.number || ''}`}
              description="Dettagli documento di trasporto"
            />
            
            {selectedDdt && (
              <div className="space-y-6 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader><CardTitle className="text-lg">Informazioni DDT</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between"><span className="text-sm text-gray-600">Numero</span><span className="font-medium">{selectedDdt.number}</span></div>
                      <div className="flex justify-between"><span className="text-sm text-gray-600">Data</span><span>{formatDate(selectedDdt.issueDate)}</span></div>
                      {selectedDdt.transportMethod && (
                        <div className="flex justify-between"><span className="text-sm text-gray-600">Trasporto</span><Badge variant="outline">{selectedDdt.transportMethod}</Badge></div>
                      )}
                      {selectedDdt.referenceNumber && (
                        <div className="flex justify-between"><span className="text-sm text-gray-600">Riferimento</span><span>{selectedDdt.referenceNumber}</span></div>
                      )}
                      {selectedDdt.estimate && (
                        <div className="flex justify-between"><span className="text-sm text-gray-600">Preventivo</span><span>{selectedDdt.estimate.number}</span></div>
                      )}
                      {selectedDdt.invoice && (
                        <div className="flex justify-between"><span className="text-sm text-gray-600">Fattura</span><span>{selectedDdt.invoice.number}</span></div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-lg">Destinatario</CardTitle></CardHeader>
                    <CardContent className="space-y-3">
                      {selectedDdt.customer ? (
                        <>
                          <div className="flex items-center space-x-3">
                            <User className="h-10 w-10 text-gray-400 p-2 bg-gray-100 rounded-lg" />
                            <div>
                              <div className="font-medium">{selectedDdt.customer.name}</div>
                              {selectedDdt.customer.email && <div className="text-sm text-gray-500">{selectedDdt.customer.email}</div>}
                              {selectedDdt.customer.phone && <div className="text-sm text-gray-500">{selectedDdt.customer.phone}</div>}
                            </div>
                          </div>
                          {selectedDdt.customer.address && (
                            <div className="text-sm text-gray-600">{selectedDdt.customer.address}{selectedDdt.customer.city ? `, ${selectedDdt.customer.city}` : ''}</div>
                          )}
                        </>
                      ) : (
                        <p className="text-sm text-gray-500">Nessun destinatario specificato</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader><CardTitle className="text-lg">Merce Trasportata</CardTitle></CardHeader>
                  <CardContent>
                    {selectedDdt.items && selectedDdt.items.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Codice</TableHead>
                            <TableHead>Descrizione</TableHead>
                            <TableHead className="text-right">Quantità</TableHead>
                            <TableHead>U.M.</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedDdt.items.map((item, idx) => (
                            <TableRow key={idx}>
                              <TableCell>{item.code || '-'}</TableCell>
                              <TableCell className="font-medium">{item.description}</TableCell>
                              <TableCell className="text-right">{item.quantity}</TableCell>
                              <TableCell>{item.unit || 'pz'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <p className="text-sm text-gray-500 py-4 text-center">Nessuna riga presente</p>
                    )}
                  </CardContent>
                </Card>

                {selectedDdt.notes && (
                  <Card>
                    <CardHeader><CardTitle className="text-lg">Note</CardTitle></CardHeader>
                    <CardContent><p className="text-sm">{selectedDdt.notes}</p></CardContent>
                  </Card>
                )}

                <div className="flex justify-end space-x-4">
                  <Button variant="outline" onClick={() => openPrintDocument('ddt', selectedDdt!.id)}><Printer className="h-4 w-4 mr-2" />Stampa</Button>
                  <Button variant="outline" onClick={() => downloadPrintDocument('ddt', selectedDdt!.id)}><Download className="h-4 w-4 mr-2" />Scarica PDF</Button>
                  <Button className={getPopupPrimaryButtonClassName('ddts')} onClick={() => { setShowDetails(false); handleEditDdt(selectedDdt!) }}><Edit className="h-4 w-4 mr-2" />Modifica</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <DdtForm
          open={showForm}
          onClose={() => setShowForm(false)}
          onSuccess={handleFormSuccess}
          ddt={editingDdt}
        />
      </div>
    </PageShell>
  )
}

