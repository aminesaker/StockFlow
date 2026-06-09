'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'

type Option = { value: string; label: string }

type Props = {
  options: Option[]
  paramName?: string
  allLabel?: string
}

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

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button
        onClick={() => handle('')}
        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
          !current
            ? 'bg-gray-900 text-white'
            : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
        }`}
      >
        {allLabel}
      </button>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => handle(opt.value)}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            current === opt.value
              ? 'bg-gray-900 text-white'
              : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
