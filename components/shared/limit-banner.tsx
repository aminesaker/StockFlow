import Link from 'next/link'
import type { LimitCheck } from '@/lib/entitlements'

/**
 * Bannière affichée en haut d'une page de liste quand l'usage approche ou
 * atteint la limite du plan. Ne rend rien si le plan est illimité ou si
 * l'usage est encore confortable (< 80 %).
 */
export function LimitBanner({
  check,
  resourceLabel,
}: {
  check: LimitCheck
  resourceLabel: string // ex. "produits", "commandes"
}) {
  if (check.limit === null) return null // plan illimité

  const reached = check.used >= check.limit
  const pct = Math.round((check.used / Math.max(1, check.limit)) * 100)
  if (!reached && pct < 80) return null

  return (
    <div
      className={
        reached
          ? 'mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm'
          : 'mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm'
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-foreground">
          {reached ? (
            <>
              <span className="font-medium">Limite atteinte.</span> Vous avez{' '}
              {check.used.toLocaleString('fr-FR')} / {check.limit.toLocaleString('fr-FR')}{' '}
              {resourceLabel}. La création de nouveaux {resourceLabel} est bloquée.
            </>
          ) : (
            <>
              <span className="font-medium">Bientôt à la limite.</span> Vous avez utilisé{' '}
              {pct}% de votre quota de {resourceLabel} ({check.used.toLocaleString('fr-FR')} /{' '}
              {check.limit.toLocaleString('fr-FR')}).
            </>
          )}
        </p>
        <Link
          href="/dashboard/billing"
          className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
        >
          Passer à un plan supérieur
        </Link>
      </div>
    </div>
  )
}
