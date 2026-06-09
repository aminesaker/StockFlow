import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import RevenueChart from '@/components/dashboard/RevenueChart'
import TopProductsChart from '@/components/dashboard/TopProductsChart'

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
    supabase
      .from('products')
      .select('id, name, stock_quantity, low_stock_threshold')
      .lte('stock_quantity', 5)
      .order('stock_quantity')
      .limit(5),
    supabase
      .from('orders')
      .select('id, total_amount, status, created_at, customer:customers(full_name)')
      .order('created_at', { ascending: false })
      .limit(5),
    // Top produits vendus (6 derniers mois)
    supabase
      .from('order_items')
      .select('quantity, product:products(name)')
      .order('quantity', { ascending: false }),
  ])

  // ── Revenus globaux ────────────────────────────────────────
  const paid = allInvoices?.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0) ?? 0
  const pending = allInvoices?.filter((i) => ['sent', 'draft'].includes(i.status)).reduce((s, i) => s + i.amount, 0) ?? 0
  const overdue = allInvoices?.filter((i) => i.status === 'overdue').reduce((s, i) => s + i.amount, 0) ?? 0
  const total = paid + pending + overdue
  const recoveryRate = total > 0 ? Math.round((paid / total) * 100) : 0

  // ── Graphique revenus 6 derniers mois ──────────────────────
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

  // ── Top 5 produits vendus ──────────────────────────────────
  const productTotals: Record<string, number> = {}
  orderItems?.forEach((item) => {
    const product = Array.isArray(item.product) ? item.product[0] : item.product
    const name = (product as { name: string } | null)?.name ?? 'Inconnu'
    const truncated = name.length > 18 ? name.slice(0, 18) + '…' : name
    productTotals[truncated] = (productTotals[truncated] ?? 0) + item.quantity
  })
  const topProducts = Object.entries(productTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, quantity]) => ({ name, quantity }))

  const fmt = (n: number) =>
    n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-blue-100 text-blue-700',
    shipped: 'bg-purple-100 text-purple-700', delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  }
  const statusLabels: Record<string, string> = {
    pending: 'En attente', confirmed: 'Confirmée', shipped: 'Expédiée',
    delivered: 'Livrée', cancelled: 'Annulée',
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Vue d&apos;ensemble</h2>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Produits', value: productsCount ?? 0, icon: '📦', href: '/dashboard/stocks' },
          { label: 'Commandes', value: ordersCount ?? 0, icon: '🛒', href: '/dashboard/orders' },
          { label: 'Clients', value: customersCount ?? 0, icon: '👥', href: '/dashboard/customers' },
          { label: 'Factures', value: invoicesCount ?? 0, icon: '🧾', href: '/dashboard/invoices' },
        ].map((s) => (
          <Link key={s.label} href={s.href}
            className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
            <div className="text-2xl mb-2">{s.icon}</div>
            <div className="text-3xl font-bold text-gray-900">{s.value}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Revenus */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Encaissé', value: fmt(paid), color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
          { label: 'En attente', value: fmt(pending), color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
          { label: 'En retard', value: fmt(overdue), color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
          { label: 'Taux recouvrement', value: `${recoveryRate}%`, color: recoveryRate >= 80 ? 'text-green-600' : 'text-amber-600', bg: 'bg-white border-gray-200' },
        ].map((r) => (
          <div key={r.label} className={`rounded-xl border ${r.bg} p-5`}>
            <div className={`text-2xl font-bold ${r.color}`}>{r.value}</div>
            <div className="text-sm text-gray-500 mt-1">{r.label}</div>
          </div>
        ))}
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800 text-sm">Revenus 6 derniers mois</h3>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />Encaissé</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />En attente</span>
            </div>
          </div>
          <RevenueChart data={monthlyData} />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-800 text-sm mb-4">Top 5 produits vendus</h3>
          <TopProductsChart data={topProducts} />
        </div>
      </div>

      {/* Commandes récentes + Alertes stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 text-sm">Commandes récentes</h3>
            <Link href="/dashboard/orders" className="text-xs text-blue-600 hover:underline">Voir tout →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentOrders?.length ? recentOrders.map((o) => (
              <div key={o.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {((Array.isArray(o.customer) ? o.customer[0] : o.customer) as { full_name: string } | null)?.full_name ?? '—'}
                  </p>
                  <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[o.status] ?? ''}`}>
                    {statusLabels[o.status] ?? o.status}
                  </span>
                  <span className="text-sm font-semibold text-gray-900">{o.total_amount.toFixed(2)} €</span>
                </div>
              </div>
            )) : <p className="px-5 py-4 text-sm text-gray-400">Aucune commande</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800 text-sm">⚠️ Alertes stock</h3>
            <Link href="/dashboard/stocks" className="text-xs text-blue-600 hover:underline">Gérer →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {lowStock?.length ? lowStock.map((p) => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                <p className="text-sm font-medium text-gray-900">{p.name}</p>
                <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                  {p.stock_quantity} restant{p.stock_quantity !== 1 ? 's' : ''}
                </span>
              </div>
            )) : <p className="px-5 py-4 text-sm text-gray-400">Tous les stocks sont OK ✓</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
