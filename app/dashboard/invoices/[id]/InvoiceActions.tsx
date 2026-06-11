'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { updateInvoiceStatus, deleteInvoice, createCreditNote } from '../actions'
import CreditNoteModal, { type ReturnLine } from './CreditNoteModal'

const NEXT_STATUS: Record<string, { status: string; labelKey: string; toastKey: string }> = {
  draft:   { status: 'sent', labelKey: 'markSent', toastKey: 'toastSent' },
  sent:    { status: 'paid', labelKey: 'markPaid', toastKey: 'toastPaid' },
  overdue: { status: 'paid', labelKey: 'markPaid', toastKey: 'toastPaid' },
}

type Props = {
  invoiceId: string
  status: string
  isPayable: boolean
  returnLines?: ReturnLine[]
  canCredit?: boolean
}

export default function InvoiceActions({ invoiceId, status, isPayable, returnLines = [], canCredit = false }: Props) {
  const t = useTranslations('invoiceDetail')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showCredit, setShowCredit] = useState(false)

  const next = NEXT_STATUS[status]

  function handleStatus(newStatus: string, toastMsg: string) {
    startTransition(async () => {
      const r = await updateInvoiceStatus(invoiceId, newStatus as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled')
      if (r.error) toast.error(r.error)
      else { toast.success(toastMsg); router.refresh() }
    })
  }

  function openCredit() {
    if (returnLines.length > 0) { setShowCredit(true); return }
    // Facture manuelle sans lignes : avoir total direct
    if (!confirm(t('creditConfirm'))) return
    startTransition(async () => {
      const r = await createCreditNote(invoiceId)
      if (r.error) toast.error(r.error)
      else { toast.success(t('creditCreatedToast', { number: r.creditNumber ?? '' })); router.refresh() }
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
      {next && (
        <button onClick={() => handleStatus(next.status, t(next.toastKey))} disabled={isPending}
          className="px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {t(next.labelKey)}
        </button>
      )}

      {isPayable && (
        <Link href={`/dashboard/invoices?pay=${invoiceId}`}
          className="px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors">
          {t('pay')}
        </Link>
      )}

      <a href={`/api/invoices/${invoiceId}/pdf`} target="_blank" rel="noopener noreferrer"
        className="px-3 py-1.5 border border-border text-muted-foreground text-sm rounded-lg hover:bg-muted/40 transition-colors">
        {t('pdf')}
      </a>

      {!['paid', 'cancelled'].includes(status) && (
        <button onClick={() => handleStatus('cancelled', t('toastCancelled'))} disabled={isPending}
          className="px-3 py-1.5 border border-red-200 text-red-600 text-sm rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors">
          {t('cancel')}
        </button>
      )}

      {canCredit && status !== 'cancelled' && (
        <button onClick={openCredit} disabled={isPending}
          className="px-3 py-1.5 border border-amber-300 text-amber-700 text-sm rounded-lg hover:bg-amber-50 disabled:opacity-50 transition-colors">
          {t('creditCreate')}
        </button>
      )}

      <button onClick={handleDelete} disabled={isPending}
        className="px-3 py-1.5 border border-border text-muted-foreground text-sm rounded-lg hover:bg-muted/40 disabled:opacity-50 transition-colors">
        {t('delete')}
      </button>

      {showCredit && <CreditNoteModal invoiceId={invoiceId} lines={returnLines} onClose={() => setShowCredit(false)} />}
    </div>
  )
}
