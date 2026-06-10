'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { updateInvoiceStatus, deleteInvoice } from '../actions'

const NEXT_STATUS: Record<string, { status: string; label: string }> = {
  draft:   { status: 'sent',      label: '→ Marquer envoyée' },
  sent:    { status: 'paid',      label: '→ Marquer payée' },
  overdue: { status: 'paid',      label: '→ Marquer payée' },
}

type Props = {
  invoiceId: string
  status: string
  isPayable: boolean
}

export default function InvoiceActions({ invoiceId, status, isPayable }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const next = NEXT_STATUS[status]

  function handleStatus(newStatus: string, label: string) {
    startTransition(async () => {
      const r = await updateInvoiceStatus(invoiceId, newStatus as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled')
      if (r.error) toast.error(r.error)
      else { toast.success(label); router.refresh() }
    })
  }

  function handleDelete() {
    if (!confirm('Supprimer cette facture ?')) return
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
          onClick={() => handleStatus(next.status, next.label)}
          disabled={isPending}
          className="px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {next.label}
        </button>
      )}

      {/* Payer via Stripe */}
      {isPayable && (
        <Link
          href={`/dashboard/invoices?pay=${invoiceId}`}
          className="px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
        >
          💳 Payer
        </Link>
      )}

      {/* PDF */}
      <a
        href={`/api/invoices/${invoiceId}/pdf`}
        target="_blank"
        rel="noopener noreferrer"
        className="px-3 py-1.5 border border-border text-muted-foreground text-sm rounded-lg hover:bg-muted/40 transition-colors"
      >
        ⬇ PDF
      </a>

      {/* Annuler si pas payée / annulée */}
      {!['paid', 'cancelled'].includes(status) && (
        <button
          onClick={() => handleStatus('cancelled', 'Facture annulée')}
          disabled={isPending}
          className="px-3 py-1.5 border border-red-200 text-red-600 text-sm rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          Annuler
        </button>
      )}

      {/* Supprimer */}
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="px-3 py-1.5 border border-border text-muted-foreground text-sm rounded-lg hover:bg-muted/40 disabled:opacity-50 transition-colors"
      >
        Supprimer
      </button>
    </div>
  )
}
