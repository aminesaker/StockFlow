'use client'

import { useRef, useState, useTransition } from 'react'
import type { Customer, Order } from '@/types'
import { createInvoice } from '@/app/dashboard/invoices/actions'

type Props = {
  customers: Customer[]
  orders: Order[]
  onClose: () => void
}

export default function InvoiceForm({ customers, orders, onClose }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [isPending, startTransition] = useTransition()
  const [selectedCustomerId, setSelectedCustomerId] = useState('')

  // Filtre les commandes par client sélectionné
  const customerOrders = orders.filter((o) => o.customer_id === selectedCustomerId)

  // Date d'échéance par défaut : +30 jours
  const defaultDue = new Date()
  defaultDue.setDate(defaultDue.getDate() + 30)
  const defaultDueStr = defaultDue.toISOString().split('T')[0]

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = await createInvoice(formData)
      if (result.error) setErrors(result.error as Record<string, string[]>)
      else onClose()
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Nouvelle facture</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Client */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Client *</label>
            <select
              name="customer_id"
              required
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.customer_id ? 'border-red-400' : 'border-gray-300'}`}
            >
              <option value="">— Sélectionner —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name}</option>
              ))}
            </select>
            {errors.customer_id && <p className="text-xs text-red-500 mt-1">{errors.customer_id[0]}</p>}
          </div>

          {/* Commande liée (optionnel) */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Commande liée <span className="text-gray-400">(optionnel)</span>
            </label>
            <select
              name="order_id"
              disabled={!selectedCustomerId}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
            >
              <option value="">— Aucune —</option>
              {customerOrders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.id.slice(0, 8)}... — {o.total_amount.toFixed(2)} €
                </option>
              ))}
            </select>
          </div>

          {/* Montant */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Montant (€) *</label>
            <input
              type="number"
              name="amount"
              step="0.01"
              min="0"
              required
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.amount ? 'border-red-400' : 'border-gray-300'}`}
            />
            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount[0]}</p>}
          </div>

          {/* Échéance */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date d&apos;échéance *</label>
            <input
              type="date"
              name="due_date"
              required
              defaultValue={defaultDueStr}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.due_date ? 'border-red-400' : 'border-gray-300'}`}
            />
            {errors.due_date && <p className="text-xs text-red-500 mt-1">{errors.due_date[0]}</p>}
          </div>

          {/* Statut */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Statut</label>
            <select
              name="status"
              defaultValue="draft"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="draft">Brouillon</option>
              <option value="sent">Envoyée</option>
            </select>
          </div>

          {errors._root && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{errors._root[0]}</p>
          )}
        </form>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
            Annuler
          </button>
          <button
            onClick={() => formRef.current?.requestSubmit()}
            disabled={isPending}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {isPending ? 'Création...' : 'Créer la facture'}
          </button>
        </div>
      </div>
    </div>
  )
}
