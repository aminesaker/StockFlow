'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import { cn } from '@/lib/utils'

type Props = { page: number; totalPages: number }

export default function Pagination({ page, totalPages }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const goTo = useCallback(
    (p: number) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', String(p))
      startTransition(() => router.replace(`${pathname}?${params.toString()}`))
    },
    [searchParams, pathname, router]
  )

  if (totalPages <= 1) return null

  const pages: (number | '…')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) pages.push(i)
    else if (pages[pages.length - 1] !== '…') pages.push('…')
  }

  const base = 'rounded-lg px-3 py-1.5 text-sm transition-colors'

  return (
    <div className="mt-6 flex items-center justify-center gap-1">
      <button onClick={() => goTo(page - 1)} disabled={page <= 1} className={cn(base, 'border text-muted-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40')}>←</button>
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e-${i}`} className="px-2 text-sm text-muted-foreground">…</span>
        ) : (
          <button key={p} onClick={() => goTo(p as number)} className={cn(base, p === page ? 'bg-primary text-primary-foreground' : 'border text-muted-foreground hover:bg-accent')}>{p}</button>
        )
      )}
      <button onClick={() => goTo(page + 1)} disabled={page >= totalPages} className={cn(base, 'border text-muted-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40')}>→</button>
      <span className="ml-2 text-xs text-muted-foreground">Page {page}/{totalPages}</span>
    </div>
  )
}
