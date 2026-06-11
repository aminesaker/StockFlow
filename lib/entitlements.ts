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

// ── Gating boutiques (multi-stores) ────────────────────────────────────────

export type StoreCheck = { allowed: boolean; limit: number | null; current: number }

/**
 * Vérifie si la plateforme `source` peut être utilisée par ce tenant sans
 * dépasser la limite de boutiques du plan. Une boutique déjà connectée passe
 * toujours ; seules les NOUVELLES boutiques au-delà de la limite sont bloquées.
 */
export async function canUseStore(
  supabase: SupabaseClient,
  userId: string,
  source: string,
): Promise<StoreCheck> {
  const plan = await getUserPlan(supabase, userId)
  const limit = PLANS[plan].limits.stores
  if (limit === null) return { allowed: true, limit: null, current: 0 }

  const { data: stores } = await supabase.from('stores').select('id, platform').eq('user_id', userId)
  const list = (stores ?? []) as { id: string; platform: string }[]
  // Une boutique de cette plateforme existe déjà → autorisée.
  if (list.some((s) => s.platform === source)) return { allowed: true, limit, current: list.length }
  return { allowed: list.length < limit, limit, current: list.length }
}

/** Peut-on ajouter une NOUVELLE boutique sans dépasser la limite du plan ? */
export async function canAddStore(
  supabase: SupabaseClient,
  userId: string,
): Promise<StoreCheck> {
  const plan = await getUserPlan(supabase, userId)
  const limit = PLANS[plan].limits.stores
  const { count } = await supabase.from('stores').select('*', { count: 'exact', head: true }).eq('user_id', userId)
  const current = count ?? 0
  if (limit === null) return { allowed: true, limit: null, current }
  return { allowed: current < limit, limit, current }
}

// ── Gating exécution des automatisations ───────────────────────────────────

/** True si le plan du tenant inclut les automatisations (Pro+). */
export async function hasAutomations(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const plan = await getUserPlan(supabase, userId)
  return PLANS[plan].features.automations
}

/** Sous-ensemble des userIds dont le plan inclut les automatisations (pour les crons). */
export async function usersWithAutomations(supabase: SupabaseClient, userIds: string[]): Promise<Set<string>> {
  const set = new Set<string>()
  if (!userIds.length) return set
  const { data } = await supabase
    .from('user_subscriptions')
    .select('user_id, plan, status')
    .in('user_id', userIds)
  for (const r of data ?? []) {
    const row = r as { user_id: string; plan: string; status: string }
    const plan = (row.status === 'active' ? row.plan : 'starter') as PlanId
    if (plan in PLANS && PLANS[plan].features.automations) set.add(row.user_id)
  }
  return set
}
