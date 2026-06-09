import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import OrderStatusActions from './OrderStatusActions'

const STATUS_FLOW = ['pending', 'confirmed', 'shipped', 'delivered'] as const
const STATUS_LABELS: Record<string, string> = {
  pending: 'En attente', confirmed: 'Confirmée', shipped: 'Expédiée',
  delivered: 'Livrée', cancelled: 'Annulée',
}
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700', delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      customer:customers(*),
      items:order_items(
        id, quantity, unit_price, total_price,
        product:products(id, name, sku, image_url)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !order) notFound()

  const customer = order.customer as {
    full_name: string; email: string; phone?: string; address?: string; city?: string; country?: string
  }
  const items = (order.items ?? []) as {
    id: string; quantity: number; unit_price: number; total_price: number
    product: { id: string; name: string; sku: string; image_url?: string }
  }[]

  const statusIdx = STATUS_FLOW.indexOf(order.status as typeof STATUS_FLOW[number])
  const canCancel = !['delivered', 'cancelled'].includes(order.status)

  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/dashboard/orders" className="hover:text-gray-600">Commandes</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{order.id.slice(0, 8)}…</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Commande</h2>
          <p className="text-sm text-gray-400 mt-1">
            Créée le {new Date(order.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_COLORS[order.status]}`}>
            {STATUS_LABELS[order.status]}
          </span>
          <OrderStatusActions orderId={order.id} currentStatus={order.status} canCancel={canCancel} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Articles */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-800">Articles commandés</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-5 py-3 text-left font-medium text-gray-500">Produit</th>
                  <th className="px-5 py-3 text-right font-medium text-gray-500">Qté</th>
                  <th className="px-5 py-3 text-right font-medium text-gray-500">Prix unit.</th>
                  <th className="px-5 py-3 text-right font-medium text-gray-500">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <p className="font-medium text-gray-900">{item.product.name}</p>
                      <p className="text-xs text-gray-400">SKU : {item.product.sku}</p>
                    </td>
                    <td className="px-5 py-3 text-right">{item.quantity}</td>
                    <td className="px-5 py-3 text-right">{item.unit_price.toFixed(2)} €</td>
                    <td className="px-5 py-3 text-right font-semibold">{item.total_price.toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50">
                  <td colSpan={3} className="px-5 py-3 text-right font-semibold text-gray-700">Total</td>
                  <td className="px-5 py-3 text-right font-bold text-gray-900 text-base">
                    {order.total_amount.toFixed(2)} €
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-800 mb-2 text-sm">Notes</h3>
              <p className="text-sm text-gray-600">{order.notes}</p>
            </div>
          )}

          {/* Timeline statut */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-4 text-sm">Progression</h3>
            <div className="flex items-center gap-0">
              {STATUS_FLOW.map((s, i) => {
                const done = statusIdx >= i
                const current = statusIdx === i
                return (
                  <div key={s} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        done ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                      } ${current ? 'ring-2 ring-blue-300 ring-offset-1' : ''}`}>
                        {done ? '✓' : i + 1}
                      </div>
                      <span className={`text-xs mt-1.5 whitespace-nowrap ${done ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                        {STATUS_LABELS[s]}
                      </span>
                    </div>
                    {i < STATUS_FLOW.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1 mb-5 ${statusIdx > i ? 'bg-blue-600' : 'bg-gray-200'}`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Sidebar client */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-3 text-sm">Client</h3>
            <p className="font-medium text-gray-900">{customer.full_name}</p>
            <p className="text-sm text-gray-500 mt-1">{customer.email}</p>
            {customer.phone && <p className="text-sm text-gray-500">{customer.phone}</p>}
            {customer.address && (
              <p className="text-sm text-gray-500 mt-2">
                {customer.address}<br />
                {customer.city}{customer.country ? `, ${customer.country}` : ''}
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-800 mb-3 text-sm">Récapitulatif</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Articles</span>
                <span className="font-medium">{items.reduce((s, i) => s + i.quantity, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Lignes</span>
                <span className="font-medium">{items.length}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2">
                <span className="font-semibold text-gray-700">Total</span>
                <span className="font-bold text-gray-900">{order.total_amount.toFixed(2)} €</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
