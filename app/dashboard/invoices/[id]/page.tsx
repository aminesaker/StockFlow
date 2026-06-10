import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import InvoiceActions from './InvoiceActions'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon', sent: 'Envoyée', paid: 'Payée', overdue: 'En retard', cancelled: 'Annulée',
}
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
        <Link href="/dashboard/invoices" className="hover:text-muted-foreground">Factures</Link>
        <span>/</span>
        <span className="text-foreground font-medium">{invoice.invoice_number}</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{invoice.invoice_number}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Émise le {new Date(invoice.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_COLORS[invoice.status]}`}>
            {STATUS_LABELS[invoice.status]}
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
                <h3 className="font-semibold text-foreground text-sm">Détail</h3>
                {order && (
                  <Link
                    href={`/dashboard/orders/${order.id}`}
                    className="text-xs text-primary hover:underline"
                  >
                    Voir la commande →
                  </Link>
                )}
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 border-b border-border">
                    <th className="px-5 py-3 text-left font-medium text-muted-foreground">Produit</th>
                    <th className="px-5 py-3 text-right font-medium text-muted-foreground">Qté</th>
                    <th className="px-5 py-3 text-right font-medium text-muted-foreground">Prix unit.</th>
                    <th className="px-5 py-3 text-right font-medium text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, i) => (
                    <tr key={i} className="border-b border-border">
                      <td className="px-5 py-3">
                        <p className="font-medium text-foreground">{item.product.name}</p>
                        <p className="text-xs text-muted-foreground">SKU : {item.product.sku}</p>
                      </td>
                      <td className="px-5 py-3 text-right">{item.quantity}</td>
                      <td className="px-5 py-3 text-right">{item.unit_price.toFixed(2)} €</td>
                      <td className="px-5 py-3 text-right font-semibold">{item.total_price.toFixed(2)} €</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold text-foreground mb-3 text-sm">Détail</h3>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Prestation</span>
                <span className="font-semibold">{invoice.amount.toFixed(2)} €</span>
              </div>
            </div>
          )}

          {/* Récapitulatif montant */}
          <div className="rounded-xl border bg-card p-5">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Sous-total HT</span>
                <span>{invoice.amount.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>TVA (0%)</span>
                <span>0,00 €</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-bold text-foreground text-base">
                <span>Total TTC</span>
                <span>{invoice.amount.toFixed(2)} €</span>
              </div>
              {invoice.paid_at && (
                <div className="flex justify-between text-green-600 font-medium pt-1">
                  <span>✓ Payée le</span>
                  <span>{new Date(invoice.paid_at).toLocaleDateString('fr-FR')}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-5">
            <h3 className="font-semibold text-foreground mb-3 text-sm">Facturé à</h3>
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
            <h3 className="font-semibold text-foreground mb-3 text-sm">Échéance</h3>
            <p className="text-base font-semibold text-foreground">
              {new Date(invoice.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            {new Date(invoice.due_date) < new Date() && invoice.status !== 'paid' && (
              <p className="text-xs text-red-600 mt-1 font-medium">⚠️ Échéance dépassée</p>
            )}
          </div>

          {invoice.stripe_payment_intent_id && (
            <div className="rounded-xl border bg-card p-5">
              <h3 className="font-semibold text-foreground mb-2 text-sm">Paiement Stripe</h3>
              <p className="text-xs text-muted-foreground font-mono break-all">{invoice.stripe_payment_intent_id}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
