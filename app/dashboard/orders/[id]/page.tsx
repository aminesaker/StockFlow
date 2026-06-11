import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTranslations, getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import OrderStatusActions from './OrderStatusActions'

const STATUS_FLOW = ['pending', 'confirmed', 'shipped', 'delivered'] as const
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400', confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  shipped: 'bg-primary/10 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400', delivered: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const t = await getTranslations('orderDetail')
  const ts = await getTranslations('orderStatus')
  const locale = await getLocale()
  const dl = locale === 'en' ? 'en-US' : 'fr-FR'
  const eur = (n: number) => new Intl.NumberFormat(dl, { style: 'currency', currency: 'EUR' }).format(n || 0)

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
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/dashboard/orders" className="hover:text-muted-foreground">{t('breadcrumb')}</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{order.id.slice(0, 8)}…</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{t('title')}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('createdOn', { date: new Date(order.created_at).toLocaleDateString(dl, { day: 'numeric', month: 'long', year: 'numeric' }) })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_COLORS[order.status]}`}>
            {ts(order.status)}
          </span>
          <OrderStatusActions orderId={order.id} currentStatus={order.status} canCancel={canCancel} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Articles */}
        <div className="lg:col-span-2 space-y-4">
          <div className="overflow-hidden rounded-xl border bg-card">
            <div className="px-5 py-4 border-b border-border">
              <h3 className="font-semibold text-foreground">{t('itemsTitle')}</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/40 border-b border-border">
                  <th className="px-5 py-3 text-left font-medium text-muted-foreground">{t('colProduct')}</th>
                  <th className="px-5 py-3 text-right font-medium text-muted-foreground">{t('colQty')}</th>
                  <th className="px-5 py-3 text-right font-medium text-muted-foreground">{t('colUnit')}</th>
                  <th className="px-5 py-3 text-right font-medium text-muted-foreground">{t('colTotal')}</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-border hover:bg-muted/40">
                    <td className="px-5 py-3">
                      <p className="font-medium text-foreground">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">{t('sku', { sku: item.product.sku })}</p>
                    </td>
                    <td className="px-5 py-3 text-right">{item.quantity}</td>
                    <td className="px-5 py-3 text-right">{eur(item.unit_price)}</td>
                    <td className="px-5 py-3 text-right font-semibold">{eur(item.total_price)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/40">
                  <td colSpan={3} className="px-5 py-3 text-right font-semibold text-foreground">{t('total')}</td>
                  <td className="px-5 py-3 text-right font-bold text-foreground text-base">{eur(order.total_amount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold text-foreground mb-2 text-sm">{t('notes')}</h3>
              <p className="text-sm text-muted-foreground">{order.notes}</p>
            </div>
          )}

          {/* Timeline statut */}
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold text-foreground mb-4 text-sm">{t('progress')}</h3>
            <div className="flex items-center gap-0">
              {STATUS_FLOW.map((s, i) => {
                const done = statusIdx >= i
                const current = statusIdx === i
                return (
                  <div key={s} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        done ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                      } ${current ? 'ring-2 ring-blue-300 ring-offset-1' : ''}`}>
                        {done ? '✓' : i + 1}
                      </div>
                      <span className={`text-xs mt-1.5 whitespace-nowrap ${done ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                        {ts(s)}
                      </span>
                    </div>
                    {i < STATUS_FLOW.length - 1 && (
                      <div className={`flex-1 h-0.5 mx-1 mb-5 ${statusIdx > i ? 'bg-primary' : 'bg-muted'}`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Sidebar client */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold text-foreground mb-3 text-sm">{t('customer')}</h3>
            <p className="font-medium text-foreground">{customer.full_name}</p>
            <p className="text-sm text-muted-foreground mt-1">{customer.email}</p>
            {customer.phone && <p className="text-sm text-muted-foreground">{customer.phone}</p>}
            {customer.address && (
              <p className="text-sm text-muted-foreground mt-2">
                {customer.address}<br />
                {customer.city}{customer.country ? `, ${customer.country}` : ''}
              </p>
            )}
          </div>

          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold text-foreground mb-3 text-sm">{t('summary')}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('items')}</span>
                <span className="font-medium">{items.reduce((s, i) => s + i.quantity, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('lines')}</span>
                <span className="font-medium">{items.length}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2">
                <span className="font-semibold text-foreground">{t('total')}</span>
                <span className="font-bold text-foreground">{eur(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
