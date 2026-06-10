import Link from 'next/link'
import { getTranslations, getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

type Movement = {
  id: string; delta: number; reason: string; balance_after: number | null; reference: string | null; created_at: string
  product: { name: string; sku: string } | { name: string; sku: string }[] | null
}

const KNOWN_REASONS = ['sale','restock','cancellation','initial','adjustment','import']
const VARIANT: Record<string, 'success' | 'danger' | 'warning' | 'muted' | 'secondary'> = {
  sale: 'danger', restock: 'success', cancellation: 'warning', initial: 'secondary', adjustment: 'muted', import: 'muted',
}

type Props = { searchParams: Promise<{ product?: string }> }

export default async function StockMovementsPage({ searchParams }: Props) {
  const { product } = await searchParams
  const t = await getTranslations('stocks.movements')
  const locale = await getLocale()
  const intlLocale = locale === 'en' ? 'en-US' : 'fr-FR'
  const fmtDate = (iso: string) => new Date(iso).toLocaleString(intlLocale, { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })

  const supabase = await createClient()
  let query = supabase
    .from('stock_movements')
    .select('id, delta, reason, balance_after, reference, created_at, product:products(name, sku)')
    .order('created_at', { ascending: false })
    .limit(150)
  if (product) query = query.eq('product_id', product)

  const { data } = await query
  const movements = (data as Movement[] | null) ?? []

  const productName = (() => {
    if (!product || !movements.length) return null
    const p = movements[0].product
    const row = Array.isArray(p) ? p[0] : p
    return row?.name ?? null
  })()

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={productName ? t('descFor', { name: productName }) : t('descAll')}
        actions={<Link href="/dashboard/stocks" className="text-sm text-primary hover:underline">{t('back')}</Link>}
      />

      <Card>
        <CardContent className="p-0">
          {movements.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-muted-foreground">{t('empty')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-5 py-2.5 font-medium">{t('colWhen')}</th>
                    <th className="px-5 py-2.5 font-medium">{t('colProduct')}</th>
                    <th className="px-5 py-2.5 font-medium">{t('colType')}</th>
                    <th className="px-5 py-2.5 text-right font-medium">{t('colChange')}</th>
                    <th className="px-5 py-2.5 text-right font-medium">{t('colBalance')}</th>
                    <th className="px-5 py-2.5 font-medium">{t('colRef')}</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => {
                    const p = Array.isArray(m.product) ? m.product[0] : m.product
                    const variant = VARIANT[m.reason] ?? 'muted'
                    const label = KNOWN_REASONS.includes(m.reason) ? t(`reasons.${m.reason}`) : m.reason
                    return (
                      <tr key={m.id} className="border-b border-border last:border-0">
                        <td className="whitespace-nowrap px-5 py-2.5 text-muted-foreground">{fmtDate(m.created_at)}</td>
                        <td className="px-5 py-2.5">
                          <span className="font-medium text-foreground">{p?.name ?? '—'}</span>
                          {p?.sku && <span className="ml-1.5 text-xs text-muted-foreground">{p.sku}</span>}
                        </td>
                        <td className="px-5 py-2.5"><Badge variant={variant}>{label}</Badge></td>
                        <td className={`px-5 py-2.5 text-right font-semibold ${m.delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                          {m.delta >= 0 ? `+${m.delta}` : m.delta}
                        </td>
                        <td className="px-5 py-2.5 text-right text-foreground">{m.balance_after ?? '—'}</td>
                        <td className="max-w-xs truncate px-5 py-2.5 text-muted-foreground">{m.reference ?? '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
