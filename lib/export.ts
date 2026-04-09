import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

export type ExportFormat = 'csv' | 'xlsx' | 'pdf'

export interface ExportColumn {
  header: string
  key: string
  format?: 'date' | 'currency' | 'number' | 'boolean'
}

export function exportData(
  data: any[],
  columns: ExportColumn[],
  filename: string,
  format: ExportFormat = 'csv',
  title?: string
) {
  switch (format) {
    case 'csv':
      exportToCSV(data, columns, filename)
      break
    case 'xlsx':
      exportToExcel(data, columns, filename)
      break
    case 'pdf':
      exportToPDF(data, columns, filename, title || filename)
      break
  }
}

function exportToCSV(data: any[], columns: ExportColumn[], filename: string) {
  const rows = [
    columns.map(c => c.header),
    ...data.map(item => columns.map(c => item[c.key] ?? ''))
  ]
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  downloadFile(blob, `${filename}.csv`)
}

function exportToExcel(data: any[], columns: ExportColumn[], filename: string) {
  const exportData = data.map(item => {
    const row: any = {}
    columns.forEach(c => {
      row[c.header] = item[c.key]
    })
    return row
  })

  const worksheet = XLSX.utils.json_to_sheet(exportData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Dati')
  
  XLSX.writeFile(workbook, `${filename}.xlsx`)
}

function exportToPDF(data: any[], columns: ExportColumn[], filename: string, title: string) {
  const doc = new jsPDF()
  
  doc.setFontSize(16)
  doc.text(title, 14, 20)
  
  const headers = columns.map(c => c.header)
  const rows = data.map(item => columns.map(c => item[c.key] ?? ''))

  autoTable(doc, {
    startY: 30,
    head: [headers],
    body: rows,
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] } // Blue-500
  })

  doc.save(`${filename}.pdf`)
}

function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
