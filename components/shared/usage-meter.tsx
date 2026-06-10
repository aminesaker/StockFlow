import { cn } from '@/lib/utils'
import { fmtLimit } from '@/lib/plans'

export function UsageMeter({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const pct = limit === null ? 0 : Math.min(100, Math.round((used / Math.max(1, limit)) * 100))
  const over = limit !== null && used >= limit
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">{used.toLocaleString('fr-FR')} / {fmtLimit(limit)}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn('h-full rounded-full transition-all', over ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-primary')}
          style={{ width: `${limit === null ? 8 : pct}%` }}
        />
      </div>
    </div>
  )
}
