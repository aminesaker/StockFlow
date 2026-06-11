import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getTranslations, getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import InvoiceActions from './InvoiceActions'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground', sent: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  paid: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400', overdue: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  cancelled: 'bg-muted text-muted-foreground',
}

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const t = await getTranslations('invoiceDetail')
  const ts = await getTranslations('invoiceStatus')
  const locale = await getLocale()
  const dl = locale === 'en' ? 'en-US' : 'fr-FR'
  const eur = (n: number) => new Intl.NumberFormat(dl, { style: 'currency', currency: 'EUR' }).format(n || 0)

  const { id } = await params
  const supabase = await createClient()

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(`
      *,
      customer:customers(*),
      order:orders(
        id, status, total_amount,
        items:order_items(
          quantity, unit_price, total_price,
          product:products(name, sku)
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !invoice) notFound()

  const customer = invoice.customer as {
    full_name: string; email: string; phone?: string; address?: string; city?: string; country?: string
  }
  const order = invoice.order as {
    id: string; status: string; total_amount: number
    items: { quantity: number; unit_price: number; total_price: number; product: { name: string; sku: string } }[]
  } | null

  const isPayable = ['sent', 'overdue'].includes(invoice.status)

  return (
    <div className="max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/dashboard/invoices" className="hover:text-muted-foreground">{t('breadcrumb')}</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{invoice.invoice_number}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{invoice.invoice_number}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('issuedOn', { date: new Date(invoice.created_at).toLocaleDateString(dl, { day: 'numeric', month: 'long', year: 'numeric' }) })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_COLORS[invoice.status]}`}>
            {ts(invoice.status)}
          </span>
          <InvoiceActions invoiceId={invoice.id} status={invoice.status} isPayable={isPayable} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Corps facture */}
        <div className="lg:col-span-2 space-y-4">

          {/* Lignes articles (si commande liée) */}
          {order?.items?.length ? (
            <div className="overflow-hidden rounded-xl border bg-card">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h3 className="font-semibold text-foreground text-sm">{t('detail')}</h3>
                {order && (
                  <Link href={`/dashboard/orders/${order.id}`} className="text-xs text-primary hover:underline">
                    {t('viewOrder')}
                  </Link>
                )}
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
                  {order.items.map((item, i) => (
                    <tr key={i} className="border-b border-border">
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
              </table>
            </div>
          ) : (
            <div className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold text-foreground mb-3 text-sm">{t('detail')}</h3>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('service')}</span>
                <span className="font-semibold">{eur(invoice.amount)}</span>
              </div>
            </div>
          )}

          {/* Récapitulatif montant */}
          <div className="rounded-xl border bg-card p-5">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>{t('subtotal')}</span>
                <span>{eur(invoice.amount)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>{t('vat')}</span>
                <span>{eur(0)}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-bold text-foreground text-base">
                <span>{t('totalIncl')}</span>
                <span>{eur(invoice.amount)}</span>
              </div>
              {invoice.paid_at && (
                <div className="flex justify-between text-green-600 font-medium pt-1">
                  <span>{t('paidOn')}</span>
                  <span>{new Date(invoice.paid_at).toLocaleDateString(dl)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold text-foreground mb-3 text-sm">{t('billedTo')}</h3>
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
            <h3 className="font-semibold text-foreground mb-3 text-sm">{t('dueDate')}</h3>
            <p className="text-base font-semibold text-foreground">
              {new Date(invoice.due_date).toLocaleDateString(dl, { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            {new Date(invoice.due_date) < new Date() && invoice.status !== 'paid' && (
              <p className="text-xs text-red-600 mt-1 font-medium">{t('overdue')}</p>
            )}
          </div>

          {invoice.stripe_payment_intent_id && (
            <div className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold text-foreground mb-2 text-sm">{t('stripePayment')}</h3>
              <p className="text-xs text-muted-foreground font-mono break-all">{invoice.stripe_payment_intent_id}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
