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

// ── Enforcement des limites ────────────────────────────────────────────────

export type LimitedResource = 'products' | 'orders'

export type LimitCheck = {
  allowed: boolean
  plan: PlanId
  limit: number | null // null = illimité
  used: number
  remaining: number | null // null = illimité
}

/**
 * Vérifie si l'utilisateur peut créer `qty` ressource(s) supplémentaire(s)
 * sans dépasser la limite de son plan. Les plans illimités (limit === null)
 * passent toujours.
 */
export async function canCreate(
  supabase: SupabaseClient,
  userId: string,
  resource: LimitedResource,
  qty = 1,
): Promise<LimitCheck> {
  const plan = await getUserPlan(supabase, userId)
  const limit = PLANS[plan].limits[resource]
  if (limit === null) return { allowed: true, plan, limit: null, used: 0, remaining: null }

  const { count } = await supabase
    .from(resource)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
  const used = count ?? 0

  return {
    allowed: used + qty <= limit,
    plan,
    limit,
    used,
    remaining: Math.max(0, limit - used),
  }
}

/** Message d'erreur utilisateur standard quand une limite est atteinte. */
export function limitMessage(resource: LimitedResource, check: LimitCheck): string {
  const label = resource === 'products' ? 'produits' : 'commandes'
  const planName = PLANS[check.plan].name
  return `Limite du plan ${planName} atteinte (${check.limit} ${label}). Passez à un plan supérieur pour en ajouter davantage.`
}
