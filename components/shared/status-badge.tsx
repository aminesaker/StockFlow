import { Badge } from '@/components/ui/badge'

type Variant = 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'muted' | 'outline'

const MAP: Record<string, { label: string; variant: Variant }> = {
  // Commandes
  pending: { label: 'En attente', variant: 'warning' },
  confirmed: { label: 'Confirmée', variant: 'default' },
  shipped: { label: 'Expédiée', variant: 'default' },
  delivered: { label: 'Livrée', variant: 'success' },
  cancelled: { label: 'Annulée', variant: 'danger' },
  // Factures
  draft: { label: 'Brouillon', variant: 'muted' },
  sent: { label: 'Envoyée', variant: 'default' },
  paid: { label: 'Payée', variant: 'success' },
  overdue: { label: 'En retard', variant: 'danger' },
  // Prévision
  rupture: { label: 'Rupture', variant: 'danger' },
  critique: { label: 'Critique', variant: 'warning' },
  a_commander: { label: 'À commander', variant: 'warning' },
  ok: { label: 'OK', variant: 'success' },
  sans_ventes: { label: 'Sans ventes', variant: 'muted' },
}

export function StatusBadge({ status }: { status: string }) {
  const m = MAP[status] ?? { label: status, variant: 'secondary' as Variant }
  return <Badge variant={m.variant}>{m.label}</Badge>
}
