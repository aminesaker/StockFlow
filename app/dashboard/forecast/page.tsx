import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { DataTable, type Column } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/shared/status-badge'
import { EmptyState } from '@/components/shared/empty-state'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

type Row = {
  product_id: string
  name: string
  sku: string
  stock_quantity: number
  units_sold: number
  daily_velocity: number
  days_of_cover: number | null
  stockout_date: string | null
  suggested_reorder: number
  status: string
}

const HISTORY = 30, LEAD = 7, COVER = 30

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function TrendIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18M7 14l4-4 3 3 5-6" /></svg>
}

export default async function ForecastPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data, error } = await supabase.rpc('forecast_stock', {
    p_user_id: user?.id ?? '', p_history_days: HISTORY, p_lead_time_days: LEAD, p_cover_days: COVER,
  })

  const rows = (error ? [] : (data as Row[])) ?? []
  const counts = {
    rupture: rows.filter((r) => r.status === 'rupture').length,
    critique: rows.filter((r) => r.status === 'critique').length,
    a_commander: rows.filter((r) => r.status === 'a_commander').length,
  }
  const hasSales = rows.some((r) => r.units_sold > 0)

  const alerts: [string, number, string][] = [
    ['Ruptures', counts.rupture, 'text-red-600 dark:text-red-400'],
    ['Critiques (< 7 j)', counts.critique, 'text-orange-600 dark:text-orange-400'],
    ['À commander', counts.a_commander, 'text-amber-600 dark:text-amber-400'],
  ]

  const columns: Column<Row>[] = [
    { key: 'name', header: 'Produit', render: (r) => (
      <div><p className="font-medium text-foreground">{r.name}</p><p className="text-xs text-muted-foreground">{r.sku}</p></div>
    ) },
    { key: 'stock', header: 'Stock', align: 'right', render: (r) => <span className="tabular-nums text-foreground">{r.stock_quantity}</span> },
    { key: 'velocity', header: 'Ventes/j', align: 'right', render: (r) => <span className="tabular-nums text-muted-foreground">{r.daily_velocity}</span> },
    { key: 'cover', header: 'Couverture', align: 'right', render: (r) => <span className="tabular-nums text-foreground">{r.days_of_cover != null ? `${r.days_of_cover} j` : '—'}</span> },
    { key: 'date', header: 'Rupture estimée', render: (r) => <span className="text-muted-foreground">{fmtDate(r.stockout_date)}</span> },
    { key: 'reorder', header: 'À commander', align: 'right', render: (r) => r.suggested_reorder > 0 ? <span className="font-semibold text-foreground">+{r.suggested_reorder}</span> : <span className="text-muted-foreground">—</span> },
    { key: 'status', header: 'Statut', render: (r) => <StatusBadge status={r.status} /> },
  ]

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Prévisions de stock"
        description={`Basé sur les ventes des ${HISTORY} derniers jours · délai de réappro ${LEAD} j · couverture cible ${COVER} j`}
      />

      <div className="mb-6 grid grid-cols-3 gap-4">
        {alerts.map(([label, val, color]) => (
          <Card key={label}>
            <CardContent className="p-5">
              <p className={cn('text-3xl font-bold', color)}>{val}</p>
              <p className="mt-1 text-xs font-medium text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {!hasSales ? (
        <EmptyState
          icon={TrendIcon}
          title="Pas encore assez de ventes"
          description={`Les prévisions apparaîtront dès que des commandes auront été enregistrées sur les ${HISTORY} derniers jours.`}
        />
      ) : (
        <DataTable rows={rows} getRowKey={(r) => r.product_id} columns={columns} />
      )}
    </div>
  )
}
