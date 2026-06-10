import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

type Movement = {
  id: string
  delta: number
  reason: string
  balance_after: number | null
  reference: string | null
  created_at: string
  product: { name: string; sku: string } | { name: string; sku: string }[] | null
}

const REASONS: Record<string, { label: string; variant: 'success' | 'danger' | 'warning' | 'muted' | 'secondary' }> = {
  sale:         { label: 'Vente',         variant: 'danger' },
  restock:      { label: 'Réapprovisionnement', variant: 'success' },
  cancellation: { label: 'Annulation',    variant: 'warning' },
  initial:      { label: 'Stock initial', variant: 'secondary' },
  adjustment:   { label: 'Ajustement',    variant: 'muted' },
  import:       { label: 'Import',        variant: 'muted' },
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

type Props = { searchParams: Promise<{ product?: string }> }

export default async function StockMovementsPage({ searchParams }: Props) {
  const { product } = await searchParams
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
        title="Mouvements de stock"
        description={productName ? `Historique pour « ${productName} »` : 'Historique de toutes les variations de stock'}
        actions={<Link href="/dashboard/stocks" className="text-sm text-primary hover:underline">← Retour aux stocks</Link>}
      />

      <Card>
        <CardContent className="p-0">
          {movements.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-muted-foreground">
              Aucun mouvement enregistré. Les ventes, réapprovisionnements et ajustements apparaîtront ici.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-5 py-2.5 font-medium">Date</th>
                    <th className="px-5 py-2.5 font-medium">Produit</th>
                    <th className="px-5 py-2.5 font-medium">Type</th>
                    <th className="px-5 py-2.5 text-right font-medium">Variation</th>
                    <th className="px-5 py-2.5 text-right font-medium">Solde après</th>
                    <th className="px-5 py-2.5 font-medium">Référence</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => {
                    const p = Array.isArray(m.product) ? m.product[0] : m.product
                    const r = REASONS[m.reason] ?? { label: m.reason, variant: 'muted' as const }
                    return (
                      <tr key={m.id} className="border-b border-border last:border-0">
                        <td className="whitespace-nowrap px-5 py-2.5 text-muted-foreground">{fmtDate(m.created_at)}</td>
                        <td className="px-5 py-2.5">
                          <span className="font-medium text-foreground">{p?.name ?? '—'}</span>
                          {p?.sku && <span className="ml-1.5 text-xs text-muted-foreground">{p.sku}</span>}
                        </td>
                        <td className="px-5 py-2.5"><Badge variant={r.variant}>{r.label}</Badge></td>
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
