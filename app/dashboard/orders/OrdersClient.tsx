'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useTranslations, useLocale } from 'next-intl'
import type { Customer, Order, Product } from '@/types'
import OrderForm from '@/components/orders/OrderForm'
import { deleteOrder, updateOrderStatus } from './actions'
import { createInvoiceFromOrder } from '@/app/dashboard/invoices/actions'

const STATUS_COLORS: Record<Order['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
  confirmed: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  shipped: 'bg-primary/10 text-purple-700 dark:bg-purple-500/15 dark:text-purple-400',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
}
const STATUS_FLOW: Order['status'][] = ['pending', 'confirmed', 'shipped', 'delivered']

type Props = {
  orders: (Order & { customer: { full_name: string; email: string } | null })[]
  customers: Customer[]
  products: Product[]
}

export default function OrdersClient({ orders, customers, products }: Props) {
  const t = useTranslations('orders')
  const ts = useTranslations('orderStatus')
  const tc = useTranslations('common')
  const locale = useLocale()
  const [showCreate, setShowCreate] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string) {
    if (!confirm(t('confirmDelete'))) return
    startTransition(async () => {
      const result = await deleteOrder(id)
      if (result.error) toast.error(result.error)
      else toast.success(t('toastDeleted'))
    })
  }
  function handleGenerateInvoice(orderId: string) {
    startTransition(async () => {
      const result = await createInvoiceFromOrder(orderId)
      if (result.error) toast.error(result.error)
      else toast.success(t('toastInvoice', { number: result.invoiceNumber ?? '' }))
    })
  }
  function handleNextStatus(order: Order) {
    const idx = STATUS_FLOW.indexOf(order.status as Order['status'])
    if (idx === -1 || idx === STATUS_FLOW.length - 1) return
    const next = STATUS_FLOW[idx + 1]
    startTransition(() => { void updateOrderStatus(order.id, next) })
  }

  return (
    <div>
      <div className="flex items-center justify-end gap-2 mb-4">
        <a href="/api/export/orders" className="rounded-lg border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent">{t('exportCsv')}</a>
        <button onClick={() => setShowCreate(true)} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">{t('newOrder')}</button>
      </div>
      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('colId')}</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('colCustomer')}</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t('colTotal')}</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('colStatus')}</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('colDate')}</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">{tc('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const statusIdx = STATUS_FLOW.indexOf(order.status as Order['status'])
              const canAdvance = statusIdx !== -1 && statusIdx < STATUS_FLOW.length - 1
              return (
                <tr key={order.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3 font-mono text-xs"><Link href={`/dashboard/orders/${order.id}`} className="text-primary hover:underline">{order.id.slice(0, 8)}…</Link></td>
                  <td className="px-4 py-3 text-foreground">{order.customer?.full_name ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-medium">{order.total_amount.toFixed(2)} €</td>
                  <td className="px-4 py-3"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status as Order['status']]}`}>{ts(order.status)}</span></td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(order.created_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR')}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {canAdvance && <button onClick={() => handleNextStatus(order)} disabled={isPending} className="text-xs text-primary hover:underline disabled:opacity-50">→ {ts(STATUS_FLOW[statusIdx + 1])}</button>}
                      <button onClick={() => handleGenerateInvoice(order.id)} disabled={isPending} className="text-xs text-primary hover:underline disabled:opacity-50">{t('invoiceBtn')}</button>
                      <button onClick={() => handleDelete(order.id)} disabled={isPending} className="text-xs text-destructive hover:underline disabled:opacity-50">{t('deleteBtn')}</button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {orders.length === 0 && (<tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">{t('empty')}</td></tr>)}
          </tbody>
        </table>
      </div>
      {showCreate && <OrderForm customers={customers} products={products} onClose={() => setShowCreate(false)} />}
    </div>
  )
}
