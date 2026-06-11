import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { getOnboardingState } from '@/lib/onboarding'
import { OnboardingClient } from '@/components/app/onboarding-client'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export default async function OnboardingPage() {
  const t = await getTranslations('onboarding')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const state = await getOnboardingState(supabase, user.id)
  const h = await headers()
  const host = h.get('host') ?? 'localhost:3000'
  const proto = host.includes('localhost') ? 'http' : 'https'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? `${proto}://${host}`

  const steps = [
    { done: state.hasApiKey, title: t('step1Title'), desc: t('step1Desc') },
    { done: state.hasSync, title: t('step2Title'), desc: t('step2Desc') },
  ]
  const done = steps.filter((s) => s.done).length

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title={t('title')} description={t('progress', { done, total: steps.length })} />

      {state.complete ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="mb-2 text-3xl">🎉</p>
            <h3 className="font-semibold text-foreground">{t('completeTitle')}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{t('completeDesc', { count: state.syncedProducts })}</p>
            <Link href="/dashboard" className="mt-5 inline-block text-sm font-medium text-primary hover:underline">{t('gotoDashboard')}</Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-5 p-6">
              {steps.map((s, i) => (
                <div key={i} className="flex gap-3">
                  <div className={cn(
                    'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold',
                    s.done ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400' : 'border text-muted-foreground'
                  )}>
                    {s.done ? '✓' : i + 1}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{s.title}</p>
                    <p className="text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <OnboardingClient appUrl={appUrl} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
