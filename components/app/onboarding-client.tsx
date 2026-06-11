'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { createApiKey } from '@/app/dashboard/settings/api-keys-actions'
import { Button } from '@/components/ui/button'

export function OnboardingClient({ appUrl }: { appUrl: string }) {
  const t = useTranslations('onboarding')
  const [rawKey, setRawKey] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const router = useRouter()

  function generate() {
    start(async () => {
      const fd = new FormData()
      fd.set('name', t('keyName'))
      const r = await createApiKey(fd)
      if (r.error) toast.error(r.error)
      else if (r.rawKey) { setRawKey(r.rawKey); toast.success(t('generatedToast')) }
    })
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text)
    toast.success(t('copiedToast'))
  }

  const wooUrl = rawKey ? `${appUrl}/api/webhooks/woocommerce?api_key=${rawKey}` : ''

  return (
    <div className="space-y-4">
      {!rawKey ? (
        <Button onClick={generate} disabled={pending}>
          {pending ? t('generating') : t('generate')}
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">{t('webhookLabel')}</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto whitespace-nowrap rounded bg-background px-2 py-1.5 text-xs text-foreground">{wooUrl}</code>
              <Button size="sm" variant="outline" onClick={() => copy(wooUrl)}>{t('copy')}</Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t('wooInstructions')}</p>
          <Button variant="secondary" onClick={() => router.refresh()}>{t('verify')}</Button>
        </div>
      )}
    </div>
  )
}
