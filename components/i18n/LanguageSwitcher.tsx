'use client'

import { useTransition } from 'react'
import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { locales, localeFlags, type Locale } from '@/i18n/locales'
import { setLocalePreference } from '@/app/actions/locale'
import { cn } from '@/lib/utils'

export default function LanguageSwitcher({ className }: { className?: string }) {
  const active = useLocale() as Locale
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function switchTo(locale: Locale) {
    if (locale === active) return
    document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000;samesite=lax`
    startTransition(async () => {
      try { await setLocalePreference(locale) } catch { /* invité : cookie seul */ }
      router.refresh()
    })
  }

  return (
    <div className={cn('inline-flex items-center gap-0.5 rounded-lg border border-border p-0.5', className)} role="group" aria-label="Language">
      {locales.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => switchTo(l)}
          disabled={isPending}
          aria-pressed={active === l}
          className={cn(
            'rounded-md px-2 py-1 text-xs font-semibold uppercase transition-colors disabled:opacity-50',
            active === l ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
        >
          <span className="mr-1">{localeFlags[l]}</span>{l}
        </button>
      ))}
    </div>
  )
}
