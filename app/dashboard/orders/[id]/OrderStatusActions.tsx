'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { updateOrderStatus, deleteOrder } from '../actions'

const STATUS_FLOW = ['pending', 'confirmed', 'shipped', 'delivered'] as const
const STATUS_NEXT_LABEL: Record<string, string> = {
  pending: '→ Confirmer', confirmed: '→ Expédier', shipped: '→ Livrer',
}

type Props = { orderId: string; currentStatus: string; canCancel: boolean }

export default function OrderStatusActions({ orderId, currentStatus, canCancel }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const idx = STATUS_FLOW.indexOf(currentStatus as typeof STATUS_FLOW[number])
  const nextStatus = idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null

  function handleNext() {
    if (!nextStatus) return
    startTransition(async () => {
      const r = await updateOrderStatus(orderId, nextStatus)
      if (r.error) toast.error(r.error)
      else { toast.success('Statut mis à jour'); router.refresh() }
    })
  }

  function handleCancel() {
    if (!confirm('Annuler cette commande ?')) return
    startTransition(async () => {
      const r = await updateOrderStatus(orderId, 'cancelled')
      if (r.error) toast.error(r.error)
      else { toast.success('Commande annulée'); router.refresh() }
    })
  }

  function handleDelete() {
    if (!confirm('Supprimer définitivement cette commande ?')) return
    startTransition(async () => {
      const r = await deleteOrder(orderId)
      if (r.error) toast.error(r.error)
      else router.push('/dashboard/orders')
    })
  }

  return (
    <div className="flex items-center gap-2">
      {nextStatus && STATUS_NEXT_LABEL[currentStatus] && (
        <button
          onClick={handleNext}
          disabled={isPending}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {STATUS_NEXT_LABEL[currentStatus]}
        </button>
      )}
      {canCancel && (
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="px-3 py-1.5 border border-red-200 text-red-600 text-sm rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          Annuler
        </button>
      )}
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="px-3 py-1.5 border border-gray-200 text-gray-500 text-sm rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
      >
        Supprimer
      </button>
    </div>
  )
}
