'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getUserPlan } from '@/lib/entitlements'
import { PLANS } from '@/lib/plans'

const ALLOWED = ['auto_invoice', 'stock_alerts', 'overdue_reminders', 'weekly_report'] as const
export type AutomationKey = (typeof ALLOWED)[number]

export async function setAutomation(key: AutomationKey, enabled: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }
  if (!ALLOWED.includes(key)) return { error: 'Automatisation inconnue' }

  // Gating : les automatisations nécessitent un plan avec la feature
  const plan = await getUserPlan(supabase, user.id)
  if (!PLANS[plan].features.automations) {
    return { error: 'Les automatisations sont réservées au plan Pro ou supérieur.' }
  }

  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: user.id, [key]: enabled }, { onConflict: 'user_id' })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/automations')
  return { success: true }
}
