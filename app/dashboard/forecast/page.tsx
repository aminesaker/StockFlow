import { createClient } from '@/lib/supabase/server'

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

const HISTORY = 30
const LEAD = 7
const COVER = 30

const STATUS: Record<string, { label: string; cls: string }> = {
  rupture: { label: 'Rupture', cls: 'bg-red-100 text-red-700' },
  critique: { label: 'Critique', cls: 'bg-orange-100 text-orange-700' },
  a_commander: { label: 'À commander', cls: 'bg-amber-100 text-amber-700' },
  ok: { label: 'OK', cls: 'bg-emerald-100 text-emerald-700' },
  sans_ventes: { label: 'Sans ventes', cls: 'bg-gray-100 text-gray-500' },
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function ForecastPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data, error } = await supabase.rpc('forecast_stock', {
    p_user_id: user?.id,
    p_history_days: HISTORY,
    p_lead_time_days: LEAD,
    p_cover_days: COVER,
  })

  const rows = (error ? [] : (data as Row[])) ?? []
  const counts = {
    rupture: rows.filter((r) => r.status === 'rupture').length,
    critique: rows.filter((r) => r.status === 'critique').length,
    a_commander: rows.filter((r) => r.status === 'a_commander').length,
  }
  const hasSales = rows.some((r) => r.units_sold > 0)

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Prévisions de stock</h1>
        <p className="text-sm text-gray-500 mt-1">
          Basé sur les ventes des {HISTORY} derniers jours · délai de réappro {LEAD} j · couverture cible {COVER} j
        </p>
      </div>

      {/* Alertes de réappro */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          ['Ruptures', counts.rupture, 'text-red-600 bg-red-50 border-red-100'],
          ['Critiques (<7 j)', counts.critique, 'text-orange-600 bg-orange-50 border-orange-100'],
          ['À commander', counts.a_commander, 'text-amber-600 bg-amber-50 border-amber-100'],
        ].map(([label, val, cls]) => (
          <div key={label as string} className={`rounded-xl border p-4 ${cls}`}>
            <p className="text-3xl font-bold">{val as number}</p>
            <p className="text-xs font-medium mt-1 opacity-80">{label as string}</p>
          </div>
        ))}
      </div>

      {!hasSales ? (
        <div className="rounded-xl border border-gray-200 bg-white p-10 text-center">
          <p className="text-4xl mb-3">📈</p>
          <h3 className="font-semibold text-gray-900">Pas encore assez de ventes</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            Les prévisions apparaîtront dès que des commandes auront été enregistrées sur les {HISTORY} derniers jours.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3 font-medium">Produit</th>
                  <th className="px-4 py-3 font-medium text-right">Stock</th>
                  <th className="px-4 py-3 font-medium text-right">Ventes/j</th>
                  <th className="px-4 py-3 font-medium text-right">Couverture</th>
                  <th className="px-4 py-3 font-medium">Rupture estimée</th>
                  <th className="px-4 py-3 font-medium text-right">À commander</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const st = STATUS[r.status] ?? STATUS.ok
                  return (
                    <tr key={r.product_id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{r.name}</p>
                        <p className="text-xs text-gray-400">{r.sku}</p>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-700">{r.stock_quantity}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-500">{r.daily_velocity}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                        {r.days_of_cover != null ? `${r.days_of_cover} j` : '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{fmtDate(r.stockout_date)}</td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold text-gray-900">
                        {r.suggested_reorder > 0 ? `+${r.suggested_reorder}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${st.cls}`}>{st.label}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
