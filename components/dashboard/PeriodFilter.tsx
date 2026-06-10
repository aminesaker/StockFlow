'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const OPTIONS = [
  { key: '7', label: '7 j' },
  { key: '30', label: '30 j' },
  { key: '90', label: '90 j' },
  { key: '365', label: '12 mois' },
]

export default function PeriodFilter({ current }: { current: string }) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  function select(key: string) {
    const next = new URLSearchParams(params.toString())
    next.set('period', key)
    router.push(`${pathname}?${next.toString()}`)
  }

  return (
    <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
      {OPTIONS.map((o) => (
        <button
          key={o.key}
          onClick={() => select(o.key)}
          className={cn(
            'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
            current === o.key
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
