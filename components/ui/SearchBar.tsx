'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useTransition, useCallback } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { cn } from '@/lib/utils'

type Props = { placeholder?: string; paramName?: string }

export default function SearchBar({ placeholder = 'Rechercher…', paramName = 'q' }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const createQueryString = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(paramName, value)
      else params.delete(paramName)
      params.delete('page')
      return params.toString()
    },
    [searchParams, paramName]
  )

  const handleChange = useDebouncedCallback((value: string) => {
    startTransition(() => router.replace(`${pathname}?${createQueryString(value)}`))
  }, 300)

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        <svg className={cn('h-4 w-4', isPending ? 'animate-spin text-primary' : 'text-muted-foreground')} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {isPending ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          )}
        </svg>
      </div>
      <input
        type="text"
        defaultValue={searchParams.get(paramName) ?? ''}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-input bg-background py-2 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
      />
    </div>
  )
}
