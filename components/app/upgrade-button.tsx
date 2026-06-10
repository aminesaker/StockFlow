'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function UpgradeButton({ plan, label, variant }: { plan: string; label: string; variant?: 'default' | 'outline' | 'secondary' }) {
  const [pending, start] = useTransition()
  function go() {
    start(async () => {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else toast.error(data.error ?? 'Erreur')
    })
  }
  return (
    <Button variant={variant} onClick={go} disabled={pending} className="w-full">
      {pending ? '…' : label}
    </Button>
  )
}
