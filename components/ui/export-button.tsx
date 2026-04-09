import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, FileText, FileSpreadsheet, File } from 'lucide-react'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { exportData, ExportColumn, ExportFormat } from '@/lib/export'

interface ExportButtonProps {
  data: any[]
  columns: ExportColumn[]
  filename: string
  title?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  className?: string
}

export function ExportButton({ data, columns, filename, title, variant = "outline", className }: ExportButtonProps) {
  const handleExport = (format: ExportFormat) => {
    exportData(data, columns, filename, format, title)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size="sm" className={className}>
          <Download className="h-4 w-4 mr-2" />
          Esporta
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('csv')} className="cursor-pointer">
          <FileText className="h-4 w-4 mr-2 text-gray-600" />
          Esporta come CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('xlsx')} className="cursor-pointer">
          <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
          Esporta come Excel (XLSX)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('pdf')} className="cursor-pointer">
          <File className="h-4 w-4 mr-2 text-red-600" />
          Esporta come PDF
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
