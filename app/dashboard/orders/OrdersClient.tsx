'use client'

import { useState, useTransition } from 'react'
import type { Customer, Order, Product } from '@/types'
import OrderForm from '@/components/orders/OrderForm'
import { deleteOrder, updateOrderStatus } from './actions'
import { createInvoiceFromOrder } from '@/app/dashboard/invoices/actions'

const STATUS_LABELS: Record<Order['status'], string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
}

const STATUS_COLORS: Record<Order['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const STATUS_FLOW: Order['status'][] = ['pending', 'confirmed', 'shipped', 'delivered']

type Props = {
  orders: (Order & { customer: { full_name: string; email: string } | null })[]
  customers: Customer[]
  products: Product[]
}

export default function OrdersClient({ orders, customers, products }: Props) {
  const [showCreate, setShowCreate] = useState(false)
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string) {
    if (!confirm('Supprimer cette commande ?')) return
    startTransition(() => {
  void deleteOrder(id)
})
  }

  function handleGenerateInvoice(orderId: string) {
    startTransition(async () => {
      const result = await createInvoiceFromOrder(orderId)
      if (result.error) alert(result.error)
      else alert(`Facture ${result.invoiceNumber} créée !`)
    })
  }

  function handleNextStatus(order: Order) {
    const idx = STATUS_FLOW.indexOf(order.status as Order['status'])
    if (idx === -1 || idx === STATUS_FLOW.length - 1) return
    const next = STATUS_FLOW[idx + 1]
    startTransition(() => {
  void updateOrderStatus(order.id, next)
})
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nouvelle commande
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-600">ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Client</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Total</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Statut</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const statusIdx = STATUS_FLOW.indexOf(order.status as Order['status'])
              const canAdvance = statusIdx !== -1 && statusIdx < STATUS_FLOW.length - 1
              return (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-gray-500 text-xs">
                    {order.id.slice(0, 8)}...
                  </td>
                  <td className="px-4 py-3 text-gray-900">{order.customer?.full_name ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-medium">{order.total_amount.toFixed(2)} €</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status as Order['status']]}`}>
                      {STATUS_LABELS[order.status as Order['status']]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {canAdvance && (
                        <button
                          onClick={() => handleNextStatus(order)}
                          disabled={isPending}
                          className="text-xs text-blue-600 hover:underline disabled:opacity-50"
                        >
                          → {STATUS_LABELS[STATUS_FLOW[statusIdx + 1]]}
                        </button>
                      )}
                      <button
                        onClick={() => handleGenerateInvoice(order.id)}
                        disabled={isPending}
                        className="text-xs text-purple-600 hover:underline disabled:opacity-50"
                      >
                        🧾 Facturer
                      </button>
                      <button
                        onClick={() => handleDelete(order.id)}
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
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Aucune commande — créez-en une !
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <OrderForm
          customers={customers}
          products={products}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  )
}
