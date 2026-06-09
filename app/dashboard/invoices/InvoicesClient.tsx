'use client'

import { useState, useTransition } from 'react'
import type { Customer, Invoice, Order } from '@/types'
import InvoiceForm from '@/components/invoices/InvoiceForm'
import { deleteInvoice, updateInvoiceStatus } from './actions'

async function redirectToCheckout(invoiceId: string) {
  const res = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ invoiceId }),
  })
  const data = await res.json()
  if (data.url) {
    window.location.href = data.url
  } else {
    alert(data.error ?? 'Erreur lors de la création du paiement')
  }
}

const STATUS_LABELS: Record<Invoice['status'], string> = {
  draft: 'Brouillon',
  sent: 'Envoyée',
  paid: 'Payée',
  overdue: 'En retard',
  cancelled: 'Annulée',
}

const STATUS_COLORS: Record<Invoice['status'], string> = {
  draft: 'bg-gray-100 text-gray-600',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-400',
}

// Transitions de statut possibles
const STATUS_NEXT: Partial<Record<Invoice['status'], Invoice['status']>> = {
  draft: 'sent',
  sent: 'paid',
}
const STATUS_NEXT_LABEL: Partial<Record<Invoice['status'], string>> = {
  draft: 'Marquer envoyée',
  sent: 'Marquer payée',
}

type InvoiceRow = Invoice & { customer: { full_name: string } | null }

type Props = {
  invoices: InvoiceRow[]
  customers: Customer[]
  orders: Order[]
}

export default function InvoicesClient({ invoices, customers, orders }: Props) {
  const [showCreate, setShowCreate] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string) {
    if (!confirm('Supprimer cette facture ?')) return
    startTransition(() => {
  void deleteInvoice(id)
})
  }

  function handleStatusChange(id: string, status: Invoice['status']) {
    startTransition(() => {
  void updateInvoiceStatus(id, status)
})
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nouvelle facture
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-600">N° Facture</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Client</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Montant</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Échéance</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Statut</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => {
              const nextStatus = STATUS_NEXT[inv.status as Invoice['status']]
              const nextLabel = STATUS_NEXT_LABEL[inv.status as Invoice['status']]
              return (
                <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{inv.invoice_number}</td>
                  <td className="px-4 py-3 text-gray-500">{inv.customer?.full_name ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-medium">{inv.amount.toFixed(2)} €</td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(inv.due_date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[inv.status as Invoice['status']]}`}>
                      {STATUS_LABELS[inv.status as Invoice['status']]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {/* Payer via Stripe — visible si sent ou overdue */}
                      {(inv.status === 'sent' || inv.status === 'overdue') && (
                        <button
                          onClick={() => redirectToCheckout(inv.id)}
                          disabled={isPending}
                          className="text-xs text-green-600 font-medium hover:underline disabled:opacity-50"
                        >
                          💳 Payer
                        </button>
                      )}
                      {/* Avancer le statut */}
                      {nextStatus && (
                        <button
                          onClick={() => handleStatusChange(inv.id, nextStatus)}
                          disabled={isPending}
                          className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                        >
                          {nextLabel}
                        </button>
                      )}
                      {/* Télécharger PDF */}
                      <a
                        href={`/api/invoices/${inv.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-600 hover:text-gray-900 hover:underline"
                      >
                        ⬇ PDF
                      </a>
                      {/* Supprimer */}
                      <button
                        onClick={() => handleDelete(inv.id)}
                        disabled={isPending}
                        className="text-xs text-red-500 hover:underline disabled:opacity-50"
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Aucune facture — créez-en une ou générez-en depuis une commande
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <InvoiceForm
          customers={customers}
          orders={orders}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}
