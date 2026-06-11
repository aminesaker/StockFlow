'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { loadDemoData, removeDemoData } from './demo-actions'

export default function DemoDataCard({ loaded }: { loaded: boolean }) {
  const t = useTranslations('onboarding.demo')
  const [pending, start] = useTransition()
  const router = useRouter()

  function handleLoad() {
    start(async () => {
      const r = await loadDemoData()
      if (r.error) toast.error(r.error)
      else { toast.success(t('loadedToast')); router.refresh() }
    })
  }

  function handleRemove() {
    if (!confirm(t('removeConfirm'))) return
    start(async () => {
      const r = await removeDemoData()
      if (r.error) toast.error(r.error)
      else { toast.success(t('removedToast')); router.refresh() }
    })
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-start gap-3">
        <span className="text-2xl">🧪</span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{t('title')}</h3>
            {loaded && (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">
                {t('loadedBadge')}
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{t('desc')}</p>

          <div className="mt-4">
            {loaded ? (
              <button onClick={handleRemove} disabled={pending}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50">
                {pending ? t('removing') : t('remove')}
              </button>
            ) : (
              <button onClick={handleLoad} disabled={pending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
                {pending ? t('loading') : t('load')}
              </button>
            )}
          </div>
          {loaded && <p className="mt-2 text-xs text-muted-foreground">{t('hint')}</p>}
        </div>
      </div>
    </div>
  )
}
