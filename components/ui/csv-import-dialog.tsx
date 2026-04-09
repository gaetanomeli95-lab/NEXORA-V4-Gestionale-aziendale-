"use client"

import { useState, useRef } from 'react'
import { Upload, FileText, CheckCircle, AlertCircle, X, Download } from 'lucide-react'
import { type ModuleThemeName, getPopupDialogContentClassName, getPopupPrimaryButtonClassName } from '@/components/layout/module-theme'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PopupHeader } from '@/components/ui/popup-header'
import { useToast } from '@/hooks/use-toast'

interface CsvImportDialogProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
  apiUrl: string
  entityName: string
  theme?: ModuleThemeName
  columns: { key: string; label: string; required?: boolean }[]
  sampleRows?: Record<string, string>[]
}

interface ImportResult {
  success: number
  errors: { row: number; error: string }[]
}

export function CsvImportDialog({
  open,
  onClose,
  onSuccess,
  apiUrl,
  entityName,
  theme = 'products',
  columns,
  sampleRows,
}: CsvImportDialogProps) {
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<Record<string, string>[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload')

  const reset = () => {
    setFile(null)
    setPreview([])
    setHeaders([])
    setResult(null)
    setStep('upload')
    if (fileRef.current) fileRef.current.value = ''
  }

  const handleClose = () => { reset(); onClose() }

  const parseCsv = (text: string): Record<string, string>[] => {
    const lines = text.split(/\r?\n/).filter(l => l.trim())
    if (lines.length < 2) return []
    const hdrs = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    setHeaders(hdrs)
    return lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''))
      const row: Record<string, string> = {}
      hdrs.forEach((h, i) => { row[h] = vals[i] || '' })
      return row
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!f.name.endsWith('.csv')) {
      toast({ title: 'Formato non valido', description: 'Seleziona un file CSV', variant: 'destructive' })
      return
    }
    setFile(f)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const rows = parseCsv(ev.target?.result as string)
      setPreview(rows.slice(0, 5))
      setStep('preview')
    }
    reader.readAsText(f)
  }

  const handleImport = async () => {
    if (!file) return
    setImporting(true)
    try {
      const text = await file.text()
      const rows = parseCsv(text)
      const success_count = { n: 0 }
      const errors: { row: number; error: string }[] = []

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        const payload: Record<string, string> = {}
        columns.forEach(col => {
          const val = row[col.key] || row[col.label] || ''
          if (val) payload[col.key] = val
        })
        try {
          const res = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          })
          const result = await res.json()
          if (result.success) success_count.n++
          else errors.push({ row: i + 2, error: result.error || 'Errore sconosciuto' })
        } catch {
          errors.push({ row: i + 2, error: 'Errore di rete' })
        }
      }

      setResult({ success: success_count.n, errors })
      setStep('done')
      if (success_count.n > 0) onSuccess?.()
    } catch {
      toast({ title: 'Errore', description: 'Errore durante l\'importazione', variant: 'destructive' })
    } finally {
      setImporting(false)
    }
  }

  const downloadSample = () => {
    const rows = sampleRows || [Object.fromEntries(columns.map(c => [c.key, c.required ? `Esempio ${c.label}` : '']))]
    const header = columns.map(c => c.key).join(',')
    const body = rows.map(r => columns.map(c => `"${r[c.key] || ''}"`).join(',')).join('\n')
    const blob = new Blob([header + '\n' + body], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `template_${entityName.toLowerCase()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={getPopupDialogContentClassName("max-w-2xl")}>
        <PopupHeader
          theme={theme}
          title={`Importa ${entityName} da CSV`}
          description={`Carica un file CSV per importare ${entityName.toLowerCase()} in blocco`}
          icon={Upload}
        />

        <div className="p-6">

        {step === 'upload' && (
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-blue-300 rounded-xl p-10 text-center cursor-pointer hover:bg-blue-50 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-10 w-10 mx-auto text-blue-400 mb-3" />
              <p className="font-semibold text-slate-700">Clicca per caricare un file CSV</p>
              <p className="mt-1 text-sm text-slate-400">oppure trascina il file qui</p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
            </div>

            <div className="rounded-lg bg-slate-50 p-4">
              <p className="mb-2 text-sm font-medium text-slate-700">Colonne attese nel CSV:</p>
              <div className="flex flex-wrap gap-1.5">
                {columns.map(c => (
                  <span key={c.key} className={`text-xs px-2 py-0.5 rounded-full font-mono ${c.required ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>
                    {c.key}{c.required ? ' *' : ''}
                  </span>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-400">* obbligatori</p>
            </div>

            <Button variant="outline" size="sm" onClick={downloadSample} className="w-full">
              <Download className="h-4 w-4 mr-2" />Scarica Template CSV di Esempio
            </Button>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-slate-600">
              <FileText className="h-4 w-4 text-blue-600 shrink-0" />
              <span><strong>{file?.name}</strong> — anteprima prime 5 righe</span>
            </div>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>{headers.map(h => <th key={h} className="border-b px-3 py-2 text-left font-medium text-slate-600">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y">
                  {preview.map((row, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      {headers.map(h => <td key={h} className="px-3 py-1.5 text-slate-700">{row[h] || <span className="text-slate-300">—</span>}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={reset} className="flex-1">
                <X className="h-4 w-4 mr-2" />Cambia file
              </Button>
              <Button onClick={handleImport} disabled={importing} className={getPopupPrimaryButtonClassName(theme, 'flex-1')}>
                {importing ? (
                  <><span className="animate-spin mr-2">⟳</span>Importazione in corso...</>
                ) : (
                  <><Upload className="h-4 w-4 mr-2" />Importa ora</>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'done' && result && (
          <div className="space-y-4">
            <div className={`rounded-xl p-5 text-center ${result.success > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {result.success > 0 ? (
                <CheckCircle className="h-10 w-10 text-green-500 mx-auto mb-2" />
              ) : (
                <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
              )}
              <p className="text-2xl font-bold text-slate-900">{result.success}</p>
              <p className="text-slate-600">{entityName.toLowerCase()} importati con successo</p>
              {result.errors.length > 0 && (
                <p className="text-sm text-orange-600 mt-1">{result.errors.length} righe con errori</p>
              )}
            </div>
            {result.errors.length > 0 && (
              <div className="max-h-40 overflow-y-auto border rounded-lg divide-y">
                {result.errors.slice(0, 10).map((e, i) => (
                  <div key={i} className="px-3 py-2 text-xs flex gap-2">
                    <span className="font-semibold text-red-600 shrink-0">Riga {e.row}:</span>
                    <span className="text-slate-600">{e.error}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={reset} className="flex-1">Importa altro file</Button>
              <Button onClick={handleClose} className={getPopupPrimaryButtonClassName(theme, 'flex-1')}>Chiudi</Button>
            </div>
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
