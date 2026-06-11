'use client'

import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'

type Variant = 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'muted' | 'outline'

const VARIANT: Record<string, Variant> = {
  pending: 'warning', confirmed: 'default', shipped: 'default', delivered: 'success', cancelled: 'danger',
  draft: 'muted', sent: 'default', paid: 'success', overdue: 'danger',
  rupture: 'danger', critique: 'warning', a_commander: 'warning', ok: 'success', sans_ventes: 'muted',
}
const KNOWN = Object.keys(VARIANT)

export function StatusBadge({ status }: { status: string }) {
  const t = useTranslations('statuses')
  const variant = VARIANT[status] ?? 'secondary'
  const label = KNOWN.includes(status) ? t(status) : status
  return <Badge variant={variant}>{label}</Badge>
}
