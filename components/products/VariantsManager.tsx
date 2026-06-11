'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import type { Product } from '@/types'
import { createVariant, deleteProduct } from '@/app/dashboard/stocks/actions'
import { Badge } from '@/components/ui/badge'

export function attrsLabel(a: Record<string, string> | null | undefined): string {
  if (!a) return '—'
  const parts = Object.entries(a).map(([k, v]) => `${k}: ${v}`)
  return parts.length ? parts.join(' · ') : '—'
}

export default function VariantsManager({
  parent,
  variants,
  onClose,
}: {
  parent: Product
  variants: Product[]
  onClose: () => void
}) {
  const t = useTranslations('stocks.variants')
  const tl = useTranslations('stocks')
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, start] = useTransition()

  const input = 'w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50'

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    start(async () => {
      const r = await createVariant(parent.id, fd)
      if (r.error) {
        const msg = (r.error as unknown as Record<string, string[]>)._root?.[0]
          ?? Object.values(r.error as unknown as Record<string, string[]>)[0]?.[0]
          ?? 'Error'
        toast.error(msg)
      } else {
        toast.success(t('addedToast'))
        formRef.current?.reset()
        router.refresh()
      }
    })
  }

  function handleDelete(id: string) {
    if (!confirm(t('confirmDelete'))) return
    start(async () => {
      const r = await deleteProduct(id)
      if (r.error) toast.error(r.error)
      else { toast.success(t('deletedToast')); router.refresh() }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-background shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-semibold text-foreground">{t('title', { name: parent.name })}</h2>
          <button onClick={onClose} className="text-xl leading-none text-muted-foreground hover:text-foreground">×</button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-6 py-5 space-y-5">
          {/* Liste */}
          {variants.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('none')}</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 text-left text-xs text-muted-foreground">
                    <th className="px-3 py-2 font-medium">{t('colAttrs')}</th>
                    <th className="px-3 py-2 font-medium">{t('sku')}</th>
                    <th className="px-3 py-2 text-right font-medium">{t('price')}</th>
                    <th className="px-3 py-2 text-right font-medium">{t('stock')}</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v) => {
                    const low = v.stock_quantity <= v.low_stock_threshold
                    return (
                      <tr key={v.id} className="border-t border-border">
                        <td className="px-3 py-2 text-foreground">{attrsLabel(v.variant_attributes)}</td>
                        <td className="px-3 py-2 text-muted-foreground">{v.sku}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{v.price.toFixed(2)} €</td>
                        <td className="px-3 py-2 text-right">
                          <span className="mr-2 tabular-nums">{v.stock_quantity}</span>
                          {low && <Badge variant="danger">{tl('statusLow')}</Badge>}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button onClick={() => handleDelete(v.id)} disabled={pending} className="text-xs text-red-500 hover:underline disabled:opacity-50">{t('delete')}</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Ajout */}
          <form ref={formRef} onSubmit={handleAdd} className="rounded-lg border border-border p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">{t('addTitle')}</p>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">{t('attributes')}</label>
              <input name="attributes" placeholder={t('attributesHint')} className={input} />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">{t('sku')}</label>
                <input name="sku" required className={input} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">{t('price')}</label>
                <input name="price" type="number" step="0.01" min="0" defaultValue={String(parent.price ?? 0)} className={input} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">{t('stock')}</label>
                <input name="stock_quantity" type="number" min="0" defaultValue="0" className={input} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">{t('threshold')}</label>
                <input name="low_stock_threshold" type="number" min="0" defaultValue="5" className={input} />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={pending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
                {pending ? t('adding') : t('add')}
              </button>
            </div>
          </form>
        </div>

        <div className="flex justify-end border-t border-border px-6 py-3">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/40">{t('close')}</button>
        </div>
      </div>
    </div>
  )
}
