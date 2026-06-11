'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import type { Product } from '@/types'
import { createVariant, updateVariant, deleteProduct } from '@/app/dashboard/stocks/actions'
import { Badge } from '@/components/ui/badge'

export function attrsLabel(a: Record<string, string> | null | undefined): string {
  if (!a) return '—'
  const parts = Object.entries(a).map(([k, v]) => `${k}: ${v}`)
  return parts.length ? parts.join(' · ') : '—'
}
function attrsToString(a: Record<string, string> | null | undefined): string {
  if (!a) return ''
  return Object.entries(a).map(([k, v]) => `${k}: ${v}`).join(', ')
}

const input = 'w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50'
const inputSm = 'w-full rounded border border-input px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50'

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
  const tc = useTranslations('common')
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [pending, start] = useTransition()
  const [editing, setEditing] = useState<string | null>(null)

  function errMsg(e: unknown): string {
    const rec = e as Record<string, string[]> | undefined
    return rec?._root?.[0] ?? (rec ? Object.values(rec)[0]?.[0] : undefined) ?? 'Error'
  }

  function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    start(async () => {
      const r = await createVariant(parent.id, fd)
      if (r.error) toast.error(errMsg(r.error))
      else { toast.success(t('addedToast')); formRef.current?.reset(); router.refresh() }
    })
  }

  function handleSaveEdit(id: string, e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    start(async () => {
      const r = await updateVariant(id, fd)
      if (r.error) toast.error(errMsg(r.error))
      else { toast.success(t('savedToast')); setEditing(null); router.refresh() }
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

        <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
          {variants.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('none')}</p>
          ) : (
            <div className="space-y-2">
              {variants.map((v) => editing === v.id ? (
                <form key={v.id} onSubmit={(e) => handleSaveEdit(v.id, e)} className="rounded-lg border border-border p-3 space-y-2">
                  <input name="attributes" defaultValue={attrsToString(v.variant_attributes)} placeholder={t('attributesHint')} className={inputSm} />
                  <div className="grid grid-cols-3 gap-2">
                    <input name="price" type="number" step="0.01" min="0" defaultValue={String(v.price)} aria-label={t('price')} className={inputSm} />
                    <input name="stock_quantity" type="number" min="0" defaultValue={String(v.stock_quantity)} aria-label={t('stock')} className={inputSm} />
                    <input name="low_stock_threshold" type="number" min="0" defaultValue={String(v.low_stock_threshold)} aria-label={t('threshold')} className={inputSm} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setEditing(null)} className="rounded border border-border px-3 py-1 text-xs">{tc('cancel')}</button>
                    <button type="submit" disabled={pending} className="rounded bg-primary px-3 py-1 text-xs font-medium text-primary-foreground disabled:opacity-50">{pending ? tc('saving') : tc('save')}</button>
                  </div>
                </form>
              ) : (
                <div key={v.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="truncate text-foreground">{attrsLabel(v.variant_attributes)}</p>
                    <p className="text-xs text-muted-foreground">{v.sku} · {v.price.toFixed(2)} €</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="tabular-nums">{v.stock_quantity}</span>
                    {v.stock_quantity <= v.low_stock_threshold && <Badge variant="danger">{tl('statusLow')}</Badge>}
                    <button onClick={() => setEditing(v.id)} className="text-xs text-primary hover:underline">{tc('edit')}</button>
                    <button onClick={() => handleDelete(v.id)} disabled={pending} className="text-xs text-red-500 hover:underline disabled:opacity-50">{t('delete')}</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form ref={formRef} onSubmit={handleAdd} className="space-y-3 rounded-lg border border-border p-4">
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
