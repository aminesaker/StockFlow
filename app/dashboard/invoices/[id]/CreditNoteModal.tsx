'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { createCreditNote } from '../actions'

export type ReturnLine = { product_id: string; name: string; ordered: number; returnable: number; unit_price: number }

export default function CreditNoteModal({
  invoiceId, lines, onClose,
}: { invoiceId: string; lines: ReturnLine[]; onClose: () => void }) {
  const t = useTranslations('invoiceDetail')
  const router = useRouter()
  const [pending, start] = useTransition()
  const [qty, setQty] = useState<Record<string, number>>(() => Object.fromEntries(lines.map((l) => [l.product_id, l.returnable])))

  const total = lines.reduce((s, l) => s + (qty[l.product_id] ?? 0) * l.unit_price, 0)

  function submit() {
    const items = lines
      .map((l) => ({ product_id: l.product_id, quantity: qty[l.product_id] ?? 0 }))
      .filter((i) => i.quantity > 0)
    start(async () => {
      const r = await createCreditNote(invoiceId, items)
      if (r.error) toast.error(r.error)
      else { toast.success(t('creditCreatedToast', { number: r.creditNumber ?? '' })); router.refresh(); onClose() }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-background shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="font-semibold text-foreground">{t('creditModalTitle')}</h2>
          <button onClick={onClose} className="text-xl leading-none text-muted-foreground hover:text-foreground">×</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-muted-foreground">{t('creditItemsHint')}</p>
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 text-left text-xs text-muted-foreground">
                  <th className="px-3 py-2 font-medium">{t('colProduct')}</th>
                  <th className="px-3 py-2 text-right font-medium">{t('creditReturnable')}</th>
                  <th className="px-3 py-2 text-right font-medium">{t('creditQty')}</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.product_id} className="border-t border-border">
                    <td className="px-3 py-2 text-foreground">{l.name}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground tabular-nums">{l.returnable}</td>
                    <td className="px-3 py-2 text-right">
                      <input
                        type="number" min={0} max={l.returnable}
                        value={qty[l.product_id] ?? 0}
                        onChange={(e) => {
                          const v = Math.min(l.returnable, Math.max(0, Math.floor(Number(e.target.value) || 0)))
                          setQty((q) => ({ ...q, [l.product_id]: v }))
                        }}
                        className="w-20 rounded border border-input px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-right text-sm font-medium text-foreground">{t('totalIncl')} : {total.toFixed(2)} €</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-6 py-3">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/40">{t('cancel')}</button>
          <button onClick={submit} disabled={pending || total <= 0} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{t('creditSubmit')}</button>
        </div>
      </div>
    </div>
  )
}
