'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

export default function PeriodFilter({ current }: { current: string }) {
  const t = useTranslations('periodFilter')
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const OPTIONS = [{ key: '7', label: t('p7') }, { key: '30', label: t('p30') }, { key: '90', label: t('p90') }, { key: '365', label: t('p365') }]

  function select(key: string) {
    const next = new URLSearchParams(params.toString())
    next.set('period', key)
    router.push(`${pathname}?${next.toString()}`)
  }

  return (
    <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
      {OPTIONS.map((o) => (
        <button key={o.key} onClick={() => select(o.key)}
          className={cn('rounded-md px-3 py-1.5 text-sm font-medium transition-colors', current === o.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
          {o.label}
        </button>
      ))}
    </div>
  )
}
