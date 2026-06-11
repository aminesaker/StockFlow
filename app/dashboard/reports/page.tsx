import { createClient } from '@/lib/supabase/server'
import { getStoreFilter } from '@/lib/store-filter'
import { getTranslations, getLocale } from 'next-intl/server'
import { PageHeader } from '@/components/shared/page-header'
import { StatCard } from '@/components/shared/stat-card'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ReportsRevenueChart from '@/components/dashboard/ReportsRevenueChart'
import PeriodFilter from '@/components/dashboard/PeriodFilter'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

type Report = {
  period_days: number
  bucket: 'day' | 'month'
  revenue: { total: number; prev_total: number; series: { bucket: string; amount: number }[] }
  top_products: { id: string; name: string; sku: string; qty: number; revenue: number }[]
  stock: { cost_value: number; retail_value: number; skus: number; out_of_stock: number; critical: number }
  customers: { new: number; avg_order: number; top: { id: string; name: string; revenue: number; orders: number }[] }
}

const ALLOWED = [7, 30, 90, 365]

function Delta({ current, previous }: { current: number; previous: number }) {
  if (previous <= 0) {
    return current > 0 ? <span className="text-emerald-500">+100%</span> : <span className="text-muted-foreground">—</span>
  }
  const pct = Math.round(((current - previous) / previous) * 100)
  const up = pct >= 0
  return (
    <span className={up ? 'text-emerald-500' : 'text-red-500'}>
      {up ? '▲' : '▼'} {Math.abs(pct)}%
    </span>
  )
}

type Props = { searchParams: Promise<{ period?: string }> }

export default async function ReportsPage({ searchParams }: Props) {
  const t = await getTranslations('reports')
  const locale = await getLocale()
  const eur = (n: number) =>
    new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n || 0)

  const { period = '30' } = await searchParams
  const days = ALLOWED.includes(Number(period)) ? Number(period) : 30
  const periodKey = String(days)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let r: Report | null = null
  if (user) {
    const storeId = await getStoreFilter()
    const { data } = await supabase.rpc('reports_overview', { p_user_id: user.id, p_days: days, p_store_id: storeId ?? undefined })
    r = (data as Report | null) ?? null
  }

  const rev = r?.revenue ?? { total: 0, prev_total: 0, series: [] }
  const stock = r?.stock ?? { cost_value: 0, retail_value: 0, skus: 0, out_of_stock: 0, critical: 0 }
  const cust = r?.customers ?? { new: 0, avg_order: 0, top: [] }
  const top = r?.top_products ?? []
  const maxRev = top.length ? Math.max(...top.map((p) => p.revenue)) : 0

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('desc')}
        actions={<PeriodFilter current={periodKey} />}
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">{t('exportLabel')}</span>
        <Button asChild variant="outline" size="sm"><a href={`/api/export/report-revenue?days=${days}`}>{t('exportRevenue')}</a></Button>
        <Button asChild variant="outline" size="sm"><a href={`/api/export/report-products?days=${days}`}>{t('exportProducts')}</a></Button>
        <Button asChild variant="outline" size="sm"><a href={`/api/export/report-customers?days=${days}`}>{t('exportCustomers')}</a></Button>
      </div>

      {/* KPIs */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t('kpiRevenue')} value={eur(rev.total)} hint={t('hintVsPrev')} />
        <StatCard label={t('kpiAvgOrder')} value={eur(cust.avg_order)} hint={t('hintPerOrder')} />
        <StatCard label={t('kpiNewCustomers')} value={cust.new} hint={t('hintOnPeriod')} />
        <StatCard label={t('kpiStockValue')} value={eur(stock.retail_value)} hint={t('hintRefs', { count: stock.skus })} />
      </div>

      {/* CA dans le temps */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('revenueTitle')}</CardTitle>
          <div className="text-sm text-muted-foreground">
            {eur(rev.total)} <Delta current={rev.total} previous={rev.prev_total} />
          </div>
        </CardHeader>
        <CardContent>
          <ReportsRevenueChart data={rev.series} granularity={r?.bucket ?? 'day'} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top produits */}
        <Card>
          <CardHeader><CardTitle>{t('topProducts')}</CardTitle></CardHeader>
          <CardContent>
            {top.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">{t('noSales')}</p>
            ) : (
              <ul className="space-y-3">
                {top.map((p) => (
                  <li key={p.id}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                      <span className="truncate font-medium text-foreground">{p.name}</span>
                      <span className="shrink-0 text-muted-foreground">{eur(p.revenue)} · {p.qty} {t('units')}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${maxRev ? (p.revenue / maxRev) * 100 : 0}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Meilleurs clients + stock */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>{t('bestCustomers')}</CardTitle></CardHeader>
            <CardContent>
              {cust.top.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">{t('noCustomers')}</p>
              ) : (
                <ul className="divide-y divide-border">
                  {cust.top.map((c) => (
                    <li key={c.id} className="flex items-center justify-between py-2.5 text-sm">
                      <span className="truncate font-medium text-foreground">{c.name}</span>
                      <span className="shrink-0 text-muted-foreground">{eur(c.revenue)} · {c.orders} {t('ordersAbbr')}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t('stockTitle')}</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">{t('stockRetail')}</dt>
                  <dd className="mt-0.5 text-lg font-semibold text-foreground">{eur(stock.retail_value)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t('stockCost')}</dt>
                  <dd className="mt-0.5 text-lg font-semibold text-foreground">{eur(stock.cost_value)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t('stockOut')}</dt>
                  <dd className="mt-0.5 text-lg font-semibold text-red-500">{stock.out_of_stock}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t('stockCritical')}</dt>
                  <dd className="mt-0.5 text-lg font-semibold text-amber-500">{stock.critical}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
