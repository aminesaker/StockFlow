'use client'

import { useRef, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import type { Product } from '@/types'
import { createProduct, updateProduct } from '@/app/dashboard/stocks/actions'

type Props = { product?: Product; onClose: () => void }

export default function ProductForm({ product, onClose }: Props) {
  const t = useTranslations('stocks.form')
  const tc = useTranslations('common')
  const formRef = useRef<HTMLFormElement>(null)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = product ? await updateProduct(product.id, formData) : await createProduct(formData)
      if (result.error) setErrors(result.error as Record<string, string[]>)
      else onClose()
    })
  }

  const field = (name: string) => ({
    name,
    defaultValue: product ? String(product[name as keyof Product] ?? '') : '',
    className: `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 ${errors[name] ? 'border-red-400' : 'border-input'}`,
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-2xl w-full max-w-xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">{product ? t('editTitle') : t('addTitle')}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-muted-foreground text-xl leading-none">×</button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('name')}</label>
              <input type="text" {...field('name')} required />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name[0]}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('sku')}</label>
              <input type="text" {...field('sku')} required />
              {errors.sku && <p className="text-xs text-red-500 mt-1">{errors.sku[0]}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t('description')}</label>
            <textarea {...field('description')} rows={2} className={field('description').className} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('price')}</label>
              <input type="number" step="0.01" min="0" {...field('price')} required />
              {errors.price && <p className="text-xs text-red-500 mt-1">{errors.price[0]}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('cost')}</label>
              <input type="number" step="0.01" min="0" {...field('cost')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('quantity')}</label>
              <input type="number" min="0" {...field('stock_quantity')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('threshold')}</label>
              <input type="number" min="0" {...field('low_stock_threshold')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('category')}</label>
              <input type="text" {...field('category')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('imageUrl')}</label>
              <input type="url" {...field('image_url')} />
            </div>
          </div>

          {errors._root && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{errors._root[0]}</p>}
        </form>

        <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">{tc('cancel')}</button>
          <button type="submit" onClick={() => formRef.current?.requestSubmit()} disabled={isPending}
            className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors">
            {isPending ? tc('saving') : product ? tc('update') : tc('create')}
          </button>
        </div>
      </div>
    </div>
  )
}
