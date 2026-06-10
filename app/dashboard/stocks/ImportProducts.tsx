'use client'

import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { importProductsCsv } from './actions'

const TEMPLATE_CSV = 'name,sku,description,price,stock_quantity,low_stock_threshold,category,image_url\nProduit exemple,SKU-001,Description optionnelle,19.99,100,10,Catégorie,'

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'template_produits.csv'; a.click()
  URL.revokeObjectURL(url)
}

export default function ImportProducts() {
  const t = useTranslations('stocks.import')
  const tc = useTranslations('common')
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    if (!file.name.endsWith('.csv')) { toast.error(t('onlyCsv')); return }
    setSelectedFile(file)
  }

  function handleSubmit() {
    if (!selectedFile) return
    const fd = new FormData()
    fd.append('file', selectedFile)
    startTransition(async () => {
      const r = await importProductsCsv(fd)
      if (r.error) toast.error(r.error)
      else { toast.success(t('success', { count: r.total ?? 0 })); setOpen(false); setSelectedFile(null) }
    })
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="px-3 py-2 border border-border text-muted-foreground text-sm rounded-lg hover:bg-muted/40 transition-colors">{t('btn')}</button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="rounded-xl bg-card shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">{t('title')}</h2>
          <button onClick={() => { setOpen(false); setSelectedFile(null) }} className="text-muted-foreground hover:text-muted-foreground text-lg">✕</button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          {t('intro')}{' '}<code className="bg-muted px-1 rounded text-xs">name, sku, price, stock_quantity</code> {t('required')}
        </p>
        <button onClick={downloadTemplate} className="text-xs text-primary hover:underline mb-4 flex items-center gap-1">{t('template')}</button>
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-border hover:border-input hover:bg-muted/40'}`}>
          <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          {selectedFile ? (
            <div>
              <p className="text-sm font-medium text-foreground">📄 {selectedFile.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground">{t('dropHere')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('orClick')}</p>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={() => { setOpen(false); setSelectedFile(null) }} className="px-4 py-2 text-sm text-muted-foreground border border-border rounded-lg hover:bg-muted/40">{tc('cancel')}</button>
          <button onClick={handleSubmit} disabled={!selectedFile || isPending} className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
            {isPending ? t('importing') : t('import')}
          </button>
        </div>
      </div>
    </div>
  )
}
