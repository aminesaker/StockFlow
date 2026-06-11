'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useTranslations, useLocale } from 'next-intl'
import type { Customer, Invoice, Order } from '@/types'
import InvoiceForm from '@/components/invoices/InvoiceForm'
import { deleteInvoice, updateInvoiceStatus } from './actions'

const STATUS_COLORS: Record<Invoice['status'], string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  paid: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
  overdue: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
  cancelled: 'bg-muted text-muted-foreground',
}
const STATUS_NEXT: Partial<Record<Invoice['status'], Invoice['status']>> = { draft: 'sent', sent: 'paid' }

type InvoiceRow = Invoice & { customer: { full_name: string } | null }
type Props = { invoices: InvoiceRow[]; customers: Customer[]; orders: Order[] }

export default function InvoicesClient({ invoices, customers, orders }: Props) {
  const t = useTranslations('invoices')
  const tis = useTranslations('invoiceStatus')
  const tc = useTranslations('common')
  const locale = useLocale()
  const [showCreate, setShowCreate] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function redirectToCheckout(invoiceId: string) {
    const res = await fetch('/api/stripe/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ invoiceId }) })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else alert(data.error ?? t('checkoutError'))
  }

  function handleDelete(id: string) {
    if (!confirm(t('confirmDelete'))) return
    startTransition(async () => {
      const r = await deleteInvoice(id)
      if (r.error) toast.error(r.error)
      else toast.success(t('toastDeleted'))
    })
  }
  function handleStatusChange(id: string, status: Invoice['status']) {
    startTransition(async () => {
      const r = await updateInvoiceStatus(id, status)
      if (r.error) toast.error(r.error)
      else toast.success(t('toastStatus', { status: tis(status) }))
    })
  }

  return (
    <div>
      <div className="flex items-center justify-end gap-2 mb-4">
        <a href="/api/export/invoices" className="rounded-lg border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent">{t('exportCsv')}</a>
        <button onClick={() => setShowCreate(true)} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">{t('newInvoice')}</button>
      </div>
      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('colNumber')}</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('colCustomer')}</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t('colAmount')}</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('colDue')}</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t('colStatus')}</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">{tc('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => {
              const nextStatus = STATUS_NEXT[inv.status as Invoice['status']]
              const nextLabel = inv.status === 'draft' ? t('markSent') : inv.status === 'sent' ? t('markPaid') : ''
              return (
                <tr key={inv.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium"><Link href={`/dashboard/invoices/${inv.id}`} className="text-primary hover:underline font-medium">{inv.invoice_number}</Link></td>
                  <td className="px-4 py-3 text-muted-foreground">{inv.customer?.full_name ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-medium">{inv.amount.toFixed(2)} €</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(inv.due_date).toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR')}</td>
                  <td className="px-4 py-3"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[inv.status as Invoice['status']]}`}>{tis(inv.status)}</span></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {(inv.status === 'sent' || inv.status === 'overdue') && (
                        <button onClick={() => redirectToCheckout(inv.id)} disabled={isPending} className="text-xs text-green-600 font-medium hover:underline disabled:opacity-50">{t('pay')}</button>
                      )}
                      {nextStatus && <button onClick={() => handleStatusChange(inv.id, nextStatus)} disabled={isPending} className="text-xs text-primary hover:underline disabled:opacity-50">{nextLabel}</button>}
                      <a href={`/api/invoices/${inv.id}/pdf`} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground hover:underline">{t('pdf')}</a>
                      <button onClick={() => handleDelete(inv.id)} disabled={isPending} className="text-xs text-destructive hover:underline disabled:opacity-50">{t('delete')}</button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {invoices.length === 0 && (<tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">{t('empty')}</td></tr>)}
          </tbody>
        </table>
      </div>
      {showCreate && <InvoiceForm customers={customers} orders={orders} onClose={() => setShowCreate(false)} />}
    </div>
  )
}
