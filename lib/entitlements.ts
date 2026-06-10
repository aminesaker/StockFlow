import type { SupabaseClient } from '@supabase/supabase-js'
import { PLANS, type PlanId } from './plans'

export async function getUserPlan(supabase: SupabaseClient, userId: string): Promise<PlanId> {
  const { data } = await supabase
    .from('user_subscriptions')
    .select('plan, status')
    .eq('user_id', userId)
    .maybeSingle()
  const plan = data?.plan as PlanId | undefined
  if (data && data.status === 'active' && plan && plan in PLANS) return plan
  return 'starter'
}

export async function getUsage(supabase: SupabaseClient, userId: string) {
  const [{ count: products }, { count: orders }] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('user_id', userId),
  ])
  return { products: products ?? 0, orders: orders ?? 0 }
}
