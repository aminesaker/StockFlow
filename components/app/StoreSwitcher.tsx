'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

export default function StoreSwitcher({ stores, current }: { stores: { id: string; name: string }[]; current: string }) {
  const t = useTranslations('stores')
  const router = useRouter()
  const [pending, start] = useTransition()

  function change(v: string) {
    document.cookie = `NEXT_STORE=${v};path=/;max-age=31536000;samesite=lax`
    start(() => router.refresh())
  }

  return (
    <Select value={current} onValueChange={change} disabled={pending}>
      <SelectTrigger aria-label={t('switcherLabel')} className="h-9 w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t('all')}</SelectItem>
        {stores.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}
