'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

export default function StoreSwitcher({ stores, current }: { stores: { id: string; name: string }[]; current: string }) {
  const t = useTranslations('stores')
  const router = useRouter()
  const [pending, start] = useTransition()

  function change(v: string) {
    document.cookie = `NEXT_STORE=${v};path=/;max-age=31536000;samesite=lax`
    start(() => router.refresh())
  }

  return (
    <select
      value={current}
      onChange={(e) => change(e.target.value)}
      disabled={pending}
      aria-label={t('switcherLabel')}
      className="w-full rounded-lg border border-sidebar-border bg-transparent px-2 py-1.5 text-sm text-sidebar-foreground focus:outline-none focus:ring-2 focus:ring-ring/40"
    >
      <option value="all">{t('all')}</option>
      {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
    </select>
  )
}
