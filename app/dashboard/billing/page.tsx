import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [plan, usage] = await Promise.all([
    getUserPlan(supabase, user.id),
    getUsage(supabase, user.id),
  ])
  const current = PLANS[plan]

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Facturation" description="Votre plan, votre usage et vos options d'évolution." />

      <Card className="mb-6">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Plan actuel : {current.name}</CardTitle>
          <Badge>{current.priceLabel}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <UsageMeter label="Produits" used={usage.products} limit={current.limits.products} />
          <UsageMeter label="Commandes" used={usage.orders} limit={current.limits.orders} />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {PLAN_ORDER.map((pid) => {
          const p = PLANS[pid]
          const isCurrent = pid === plan
          return (
            <Card key={pid} className={cn(isCurrent && 'border-primary ring-1 ring-primary')}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {p.name}
                  {isCurrent && <Badge variant="success">Actuel</Badge>}
                </CardTitle>
                <p className="text-2xl font-bold text-foreground">{p.priceLabel}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {p.highlights.map((h) => (
                    <li key={h} className="flex gap-2"><span className="text-emerald-500">✓</span>{h}</li>
                  ))}
                </ul>
                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>Plan actuel</Button>
                ) : pid === 'starter' ? (
                  <Button variant="outline" className="w-full" disabled>Inclus gratuitement</Button>
                ) : (
                  <UpgradeButton plan={pid} label={`Passer à ${p.name}`} />
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Paiement sécurisé par Stripe · Résiliable à tout moment
      </p>
    </div>
  )
}
