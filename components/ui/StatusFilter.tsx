'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { cn } from '@/lib/utils'

type Option = { value: string; label: string }
type Props = { options: Option[]; paramName?: string; allLabel?: string }

export default function StatusFilter({ options, paramName = 'status', allLabel = 'Tous' }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()
  const current = searchParams.get(paramName) ?? ''

  const handle = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(paramName, value)
      else params.delete(paramName)
      params.delete('page')
      startTransition(() => router.replace(`${pathname}?${params.toString()}`))
    },
    [searchParams, paramName, pathname, router]
  )

  const cls = (active: boolean) =>
    cn(
      'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
      active ? 'bg-primary text-primary-foreground' : 'border bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
    )

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button onClick={() => handle('')} className={cls(!current)}>{allLabel}</button>
      {options.map((opt) => (
        <button key={opt.value} onClick={() => handle(opt.value)} className={cls(current === opt.value)}>{opt.label}</button>
      ))}
    </div>
  )
}
