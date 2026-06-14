'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export default function GoogleSheetsSection({ serviceEmail }: { serviceEmail: string | null }) {
  const t = useTranslations('settings.sheets')
  const [copied, setCopied] = useState(false)

  function copyEmail() {
    if (!serviceEmail) return
    navigator.clipboard?.writeText(serviceEmail)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="px-6 py-5 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-lg">📊</div>
        <div>
          <h3 className="font-semibold text-foreground">Google Sheets</h3>
          <p className="text-xs text-muted-foreground">{t('subtitle')}</p>
        </div>
        <span className="ml-auto text-xs bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400 px-2.5 py-1 rounded-full font-medium">{t('available')}</span>
      </div>

      <div className="px-6 py-5 space-y-5">
        <div className="rounded-lg border bg-muted/40 p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">{t('guideTitle')}</p>
          <ol className="space-y-2 text-sm text-muted-foreground">
            {(['step1', 'step2', 'step3', 'step4'] as const).map((s, i) => (
              <li key={s} className="flex gap-2">
                <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-bold">{i + 1}</span>
                {t(s)}
              </li>
            ))}
          </ol>
        </div>

        {serviceEmail ? (
          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">{t('serviceLabel')}</label>
            <div className="flex gap-2">
              <code className="flex-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs text-foreground break-all">{serviceEmail}</code>
              <button type="button" onClick={copyEmail} className="px-3 py-2 border border-border text-muted-foreground text-xs rounded-lg hover:bg-muted/40 transition-colors whitespace-nowrap">{copied ? '✓' : t('copy')}</button>
            </div>
          </div>
        ) : (
          <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-foreground">{t('needsConfig')}</p>
        )}

        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">{t('columnsTitle')}</p>
          <p className="text-xs text-muted-foreground"><code className="bg-muted px-1 rounded">name</code> <code className="bg-muted px-1 rounded">sku</code> <code className="bg-muted px-1 rounded">price</code> <code className="bg-muted px-1 rounded">stock</code> <code className="bg-muted px-1 rounded">category</code> <code className="bg-muted px-1 rounded">image_url</code> — {t('columnsHelp')}</p>
        </div>

        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm text-foreground">
          <p className="mb-2">{t('configureNote')}</p>
          <Link href="/dashboard/stores" className="font-medium text-primary hover:underline">{t('storesLink')} →</Link>
        </div>
      </div>
    </div>
  )
}
