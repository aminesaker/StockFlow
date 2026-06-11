import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { getUserPlan, getUsage } from '@/lib/entitlements'
import { PLANS, PLAN_ORDER } from '@/lib/plans'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UsageMeter } from '@/components/shared/usage-meter'
import { UpgradeButton } from '@/components/app/upgrade-button'
import { cn } from '@/lib/utils'

export default async function BillingPage() {
  const t = await getTranslations('billing')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [plan, usage] = await Promise.all([
    getUserPlan(supabase, user.id),
    getUsage(supabase, user.id),
  ])
  const current = PLANS[plan]

  const priceLabel = (pid: string) =>
    pid === 'starter' ? t('free') : pid === 'pro' ? t('priceMonthly', { price: 29 }) : t('priceMonthly', { price: 99 })

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={t('title')} description={t('desc')} />

      <Card className="mb-6">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>{t('currentPlan', { name: current.name })}</CardTitle>
          <Badge>{priceLabel(plan)}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <UsageMeter label={t('meterProducts')} used={usage.products} limit={current.limits.products} />
          <UsageMeter label={t('meterOrders')} used={usage.orders} limit={current.limits.orders} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {PLAN_ORDER.map((pid) => {
          const p = PLANS[pid]
          const isCurrent = pid === plan
          const highlights = t.raw(`highlights.${pid}`) as string[]
          return (
            <Card key={pid} className={cn(isCurrent && 'border-primary ring-1 ring-primary')}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {p.name}
                  {isCurrent && <Badge variant="success">{t('currentBadge')}</Badge>}
                </CardTitle>
                <p className="text-2xl font-bold text-foreground">{priceLabel(pid)}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {highlights.map((h) => (
                    <li key={h} className="flex gap-2"><span className="text-emerald-500">✓</span>{h}</li>
                  ))}
                </ul>
                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>{t('currentBtn')}</Button>
                ) : pid === 'starter' ? (
                  <Button variant="outline" className="w-full" disabled>{t('includedFree')}</Button>
                ) : (
                  <UpgradeButton plan={pid} label={t('upgradeTo', { name: p.name })} />
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">{t('securePayment')}</p>
    </div>
  )
}
