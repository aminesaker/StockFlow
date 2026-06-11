import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import { PageHeader } from '@/components/shared/page-header'
import { getUserPlan } from '@/lib/entitlements'
import { PLANS } from '@/lib/plans'
import AutomationsClient from './AutomationsClient'

export const dynamic = 'force-dynamic'

export default async function AutomationsPage() {
  const t = await getTranslations('automations')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: settings }, plan] = await Promise.all([
    supabase.from('user_settings').select('auto_invoice, stock_alerts, overdue_reminders, weekly_report').eq('user_id', user.id).maybeSingle(),
    getUserPlan(supabase, user.id),
  ])

  const initial = {
    auto_invoice:      settings?.auto_invoice      ?? true,
    stock_alerts:      settings?.stock_alerts       ?? true,
    overdue_reminders: settings?.overdue_reminders  ?? true,
    weekly_report:     settings?.weekly_report      ?? true,
  }

  const locked = !PLANS[plan].features.automations

  return (
    <div>
      <PageHeader title={t('title')} description={t('desc')} />
      <AutomationsClient initial={initial} locked={locked} planName={PLANS[plan].name} />
    </div>
  )
}
