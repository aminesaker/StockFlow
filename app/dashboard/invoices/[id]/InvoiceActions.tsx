'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { updateInvoiceStatus, deleteInvoice } from '../actions'

const NEXT_STATUS: Record<string, { status: string; labelKey: string; toastKey: string }> = {
  draft:   { status: 'sent', labelKey: 'markSent', toastKey: 'toastSent' },
  sent:    { status: 'paid', labelKey: 'markPaid', toastKey: 'toastPaid' },
  overdue: { status: 'paid', labelKey: 'markPaid', toastKey: 'toastPaid' },
}

type Props = {
  invoiceId: string
  status: string
  isPayable: boolean
}

export default function InvoiceActions({ invoiceId, status, isPayable }: Props) {
  const t = useTranslations('invoiceDetail')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const next = NEXT_STATUS[status]

  function handleStatus(newStatus: string, toastMsg: string) {
    startTransition(async () => {
      const r = await updateInvoiceStatus(invoiceId, newStatus as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled')
      if (r.error) toast.error(r.error)
      else { toast.success(toastMsg); router.refresh() }
    })
  }

  function handleDelete() {
    if (!confirm(t('confirmDelete'))) return
    startTransition(async () => {
      const r = await deleteInvoice(invoiceId)
      if (r.error) toast.error(r.error)
      else router.push('/dashboard/invoices')
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Avancer le statut */}
      {next && (
        <button
          onClick={() => handleStatus(next.status, t(next.toastKey))}
          disabled={isPending}
          className="px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {t(next.labelKey)}
        </button>
      )}

      {/* Payer via Stripe */}
      {isPayable && (
        <Link
          href={`/dashboard/invoices?pay=${invoiceId}`}
          className="px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
        >
          {t('pay')}
        </Link>
      )}

      {/* PDF */}
      <a
        href={`/api/invoices/${invoiceId}/pdf`}
        target="_blank"
        rel="noopener noreferrer"
        className="px-3 py-1.5 border border-border text-muted-foreground text-sm rounded-lg hover:bg-muted/40 transition-colors"
      >
        {t('pdf')}
      </a>

      {/* Annuler si pas payée / annulée */}
      {!['paid', 'cancelled'].includes(status) && (
        <button
          onClick={() => handleStatus('cancelled', t('toastCancelled'))}
          disabled={isPending}
          className="px-3 py-1.5 border border-red-200 text-red-600 text-sm rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          {t('cancel')}
        </button>
      )}

      {/* Supprimer */}
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="px-3 py-1.5 border border-border text-muted-foreground text-sm rounded-lg hover:bg-muted/40 disabled:opacity-50 transition-colors"
      >
        {t('delete')}
      </button>
    </div>
  )
}
