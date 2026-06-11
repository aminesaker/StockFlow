'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { setAutomation, type AutomationKey } from './actions'

type Settings = Record<AutomationKey, boolean>

const KEYS: { key: AutomationKey; icon: string }[] = [
  { key: 'auto_invoice', icon: '🧾' },
  { key: 'stock_alerts', icon: '📦' },
  { key: 'overdue_reminders', icon: '🔔' },
  { key: 'weekly_report', icon: '📊' },
]

function Toggle({ checked, disabled, onChange }: { checked: boolean; disabled?: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors',
        checked ? 'bg-primary' : 'bg-muted',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
      )}
    >
      <span className={cn('absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-background shadow transition-transform', checked && 'translate-x-5')} />
    </button>
  )
}

export default function AutomationsClient({ initial, locked, planName }: { initial: Settings; locked: boolean; planName: string }) {
  const t = useTranslations('automations')
  const [state, setState] = useState<Settings>(initial)
  const [, startTransition] = useTransition()

  function toggle(key: AutomationKey, value: boolean) {
    const prev = state[key]
    setState((s) => ({ ...s, [key]: value })) // optimiste
    startTransition(async () => {
      const r = await setAutomation(key, value)
      if (r.error) {
        setState((s) => ({ ...s, [key]: prev })) // rollback
        toast.error(r.error)
      } else {
        toast.success(value ? t('enabledToast') : t('disabledToast'))
      }
    })
  }

  return (
    <div className="max-w-2xl">
      {locked && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm">
          <p className="text-foreground">
            <span className="font-medium">{t('lockedPlan', { plan: planName })}</span> {t('lockedHint')}
          </p>
          <Link href="/dashboard/billing" className="shrink-0 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90">
            {t('upgradePro')}
          </Link>
        </div>
      )}

      <div className="divide-y divide-border rounded-xl border border-border bg-card">
        {KEYS.map((a) => (
          <div key={a.key} className="flex items-start gap-4 px-6 py-5">
            <div className="flex-1">
              <div className="mb-0.5 flex items-center gap-2">
                <span className="text-xl">{a.icon}</span>
                <span className="text-sm font-medium text-foreground">{t(`items.${a.key}.title`)}</span>
              </div>
              <p className="ml-7 text-sm text-muted-foreground">{t(`items.${a.key}.desc`)}</p>
            </div>
            <div className="mt-0.5">
              <Toggle checked={!locked && state[a.key]} disabled={locked} onChange={(v) => toggle(a.key, v)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
