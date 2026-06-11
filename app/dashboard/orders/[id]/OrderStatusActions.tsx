'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { updateOrderStatus, deleteOrder } from '../actions'

const STATUS_FLOW = ['pending', 'confirmed', 'shipped', 'delivered'] as const
const NEXT_LABEL_KEY: Record<string, string> = {
  pending: 'nextConfirm', confirmed: 'nextShip', shipped: 'nextDeliver',
}

type Props = { orderId: string; currentStatus: string; canCancel: boolean }

export default function OrderStatusActions({ orderId, currentStatus, canCancel }: Props) {
  const t = useTranslations('orderDetail')
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const idx = STATUS_FLOW.indexOf(currentStatus as typeof STATUS_FLOW[number])
  const nextStatus = idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null

  function handleNext() {
    if (!nextStatus) return
    startTransition(async () => {
      const r = await updateOrderStatus(orderId, nextStatus)
      if (r.error) toast.error(r.error)
      else { toast.success(t('toastStatus')); router.refresh() }
    })
  }

  function handleCancel() {
    if (!confirm(t('confirmCancel'))) return
    startTransition(async () => {
      const r = await updateOrderStatus(orderId, 'cancelled')
      if (r.error) toast.error(r.error)
      else { toast.success(t('toastCancelled')); router.refresh() }
    })
  }

  function handleDelete() {
    if (!confirm(t('confirmDelete'))) return
    startTransition(async () => {
      const r = await deleteOrder(orderId)
      if (r.error) toast.error(r.error)
      else router.push('/dashboard/orders')
    })
  }

  return (
    <div className="flex items-center gap-2">
      {nextStatus && NEXT_LABEL_KEY[currentStatus] && (
        <button
          onClick={handleNext}
          disabled={isPending}
          className="px-3 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {t(NEXT_LABEL_KEY[currentStatus])}
        </button>
      )}
      {canCancel && (
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="px-3 py-1.5 border border-red-200 text-red-600 text-sm rounded-lg hover:bg-red-50 disabled:opacity-50 transition-colors"
        >
          {t('cancel')}
        </button>
      )}
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
