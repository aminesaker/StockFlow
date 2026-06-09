'use client'

import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { importProductsCsv } from './actions'

const TEMPLATE_HEADERS = 'name,sku,description,price,stock_quantity,low_stock_threshold,category,image_url'
const TEMPLATE_EXAMPLE = 'Produit exemple,SKU-001,Description optionnelle,19.99,100,10,Catégorie,'
const TEMPLATE_CSV = `${TEMPLATE_HEADERS}\n${TEMPLATE_EXAMPLE}`

function downloadTemplate() {
  const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'template_produits.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export default function ImportProducts() {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [dragOver, setDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    if (!file.name.endsWith('.csv')) {
      toast.error('Seuls les fichiers .csv sont acceptés')
      return
    }
    setSelectedFile(file)
  }

  function handleSubmit() {
    if (!selectedFile) return
    const fd = new FormData()
    fd.append('file', selectedFile)
    startTransition(async () => {
      const r = await importProductsCsv(fd)
      if (r.error) {
        toast.error(r.error)
      } else {
        toast.success(`${r.total} produit(s) importé(s) / mis à jour`)
        setOpen(false)
        setSelectedFile(null)
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-2 border border-gray-200 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
      >
        ⬆ Importer CSV
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Importer des produits</h2>
          <button onClick={() => { setOpen(false); setSelectedFile(null) }} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Le fichier CSV doit contenir les colonnes :{' '}
          <code className="bg-gray-100 px-1 rounded text-xs">name, sku, price, stock_quantity</code> (obligatoires).
          Les produits existants (même SKU) seront mis à jour.
        </p>

        <button
          onClick={downloadTemplate}
          className="text-xs text-blue-600 hover:underline mb-4 flex items-center gap-1"
        >
          ⬇ Télécharger le template CSV
        </button>

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
          />
          {selectedFile ? (
            <div>
              <p className="text-sm font-medium text-gray-900">📄 {selectedFile.name}</p>
              <p className="text-xs text-gray-400 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500">Glissez un fichier CSV ici</p>
              <p className="text-xs text-gray-400 mt-1">ou cliquez pour sélectionner</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-5">
          <button
            onClick={() => { setOpen(false); setSelectedFile(null) }}
            className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedFile || isPending}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? 'Importation…' : 'Importer'}
          </button>
        </div>
      </div>
    </div>
  )
}
