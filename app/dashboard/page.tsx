import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import RevenueChart from '@/components/dashboard/RevenueChart'
import TopProductsChart from '@/components/dashboard/TopProductsChart'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc']

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { count: productsCount },
    { count: ordersCount },
    { count: customersCount },
    { count: invoicesCount },
    { data: allInvoices },
    { data: lowStock },
    { data: recentOrders },
    { data: orderItems },
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('customers').select('*', { count: 'exact', head: true }),
    supabase.from('invoices').select('*', { count: 'exact', head: true }),
    supabase.from('invoices').select('status, amount, created_at'),
    supabase.from('products').select('id, name, stock_quantity, low_stock_threshold').lte('stock_quantity', 5).order('stock_quantity').limit(5),
    supabase.from('orders').select('id, total_amount, status, created_at, customer:customers(full_name)').order('created_at', { ascending: false }).limit(5),
    supabase.from('order_items').select('quantity, product:products(name)').order('quantity', { ascending: false }),
  ])

  const paid = allInvoices?.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0) ?? 0
  const pending = allInvoices?.filter((i) => ['sent', 'draft'].includes(i.status)).reduce((s, i) => s + i.amount, 0) ?? 0
  const overdue = allInvoices?.filter((i) => i.status === 'overdue').reduce((s, i) => s + i.amount, 0) ?? 0
  const totalRev = paid + pending + overdue
  const recoveryRate = totalRev > 0 ? Math.round((paid / totalRev) * 100) : 0

  const now = new Date()
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const monthInvoices = allInvoices?.filter((inv) => inv.created_at.startsWith(key)) ?? []
    return {
      month: MONTHS_FR[d.getMonth()],
      paid: monthInvoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0),
      pending: monthInvoices.filter((i) => ['sent', 'draft', 'overdue'].includes(i.status)).reduce((s, i) => s + i.amount, 0),
    }
  })

  const productTotals: Record<string, number> = {}
  orderItems?.forEach((item) => {
    const product = Array.isArray(item.product) ? item.product[0] : item.product
    const name = (product as { name: string } | null)?.name ?? 'Inconnu'
    const truncated = name.length > 18 ? name.slice(0, 18) + '…' : name
    productTotals[truncated] = (productTotals[truncated] ?? 0) + item.quantity
  })
  const topProducts = Object.entries(productTotals).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, quantity]) => ({ name, quantity }))

  const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

  const kpis = [
    { label: 'Produits', value: productsCount ?? 0, icon: '📦', href: '/dashboard/stocks' },
    { label: 'Commandes', value: ordersCount ?? 0, icon: '🛒', href: '/dashboard/orders' },
    { label: 'Clients', value: customersCount ?? 0, icon: '👥', href: '/dashboard/customers' },
    { label: 'Factures', value: invoicesCount ?? 0, icon: '🧾', href: '/dashboard/invoices' },
  ]
  const revenue = [
    { label: 'Encaissé', value: fmt(paid), color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'En attente', value: fmt(pending), color: 'text-blue-600 dark:text-blue-400' },
    { label: 'En retard', value: fmt(overdue), color: 'text-red-600 dark:text-red-400' },
    { label: 'Taux de recouvrement', value: `${recoveryRate}%`, color: recoveryRate >= 80 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="Vue d'ensemble" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((s) => (
          <Link key={s.label} href={s.href} className="transition-transform hover:-translate-y-0.5">
            <Card className="py-0">
              <CardContent className="p-5">
                <div className="mb-2 text-2xl">{s.icon}</div>
                <div className="text-3xl font-bold text-foreground">{s.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {revenue.map((r) => (
          <Card key={r.label} className="py-0">
            <CardContent className="p-5">
              <div className={cn('text-2xl font-bold', r.color)}>{r.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{r.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="gap-4">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-sm">Revenus 6 derniers mois</CardTitle>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-blue-600" />Encaissé</span>
              <span className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-amber-400" />En attente</span>
            </div>
          </CardHeader>
          <CardContent><RevenueChart data={monthlyData} /></CardContent>
        </Card>

        <Card className="gap-4">
          <CardHeader><CardTitle className="text-sm">Top 5 produits vendus</CardTitle></CardHeader>
          <CardContent><TopProductsChart data={topProducts} /></CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="gap-0 py-0">
          <CardHeader className="flex-row items-center justify-between border-b py-4">
            <CardTitle className="text-sm">Commandes récentes</CardTitle>
            <Link href="/dashboard/orders" className="text-xs text-primary hover:underline">Voir tout →</Link>
          </CardHeader>
          <div className="divide-y">
            {recentOrders?.length ? recentOrders.map((o) => (
              <div key={o.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {((Array.isArray(o.customer) ? o.customer[0] : o.customer) as { full_name: string } | null)?.full_name ?? '—'}
                  </p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={o.status} />
                  <span className="text-sm font-semibold text-foreground">{o.total_amount.toFixed(2)} €</span>
                </div>
              </div>
            )) : <p className="px-6 py-4 text-sm text-muted-foreground">Aucune commande</p>}
          </div>
        </Card>

        <Card className="gap-0 py-0">
          <CardHeader className="flex-row items-center justify-between border-b py-4">
            <CardTitle className="text-sm">⚠️ Alertes stock</CardTitle>
            <Link href="/dashboard/stocks" className="text-xs text-primary hover:underline">Gérer →</Link>
          </CardHeader>
          <div className="divide-y">
            {lowStock?.length ? lowStock.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-6 py-3">
                <p className="text-sm font-medium text-foreground">{p.name}</p>
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-500/15 dark:text-red-400">
                  {p.stock_quantity} restant{p.stock_quantity !== 1 ? 's' : ''}
                </span>
              </div>
            )) : <p className="px-6 py-4 text-sm text-muted-foreground">Tous les stocks sont OK ✓</p>}
          </div>
        </Card>
      </div>
    </div>
  )
}
