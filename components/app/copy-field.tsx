'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

export default function CopyField({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard indisponible */
    }
  }

  return (
    <div className={cn('flex items-stretch gap-2', className)}>
      <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-md border border-border bg-muted px-3 py-2 text-xs text-foreground">
        {value}
      </code>
      <button
        onClick={copy}
        className="shrink-0 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
      >
        {copied ? 'Copié ✓' : 'Copier'}
      </button>
    </div>
  )
}
