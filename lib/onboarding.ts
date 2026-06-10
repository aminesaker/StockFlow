import type { SupabaseClient } from '@supabase/supabase-js'

export type OnboardingState = {
  hasApiKey: boolean
  hasSync: boolean
  syncedProducts: number
  syncedOrders: number
  complete: boolean
}

export async function getOnboardingState(
  supabase: SupabaseClient,
  userId: string
): Promise<OnboardingState> {
  const [{ count: keys }, { count: prods }, { count: ords }] = await Promise.all([
    supabase.from('api_keys').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('user_id', userId).not('external_source', 'is', null),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('user_id', userId).not('external_source', 'is', null),
  ])
  const hasApiKey = (keys ?? 0) > 0
  const syncedProducts = prods ?? 0
  const syncedOrders = ords ?? 0
  const hasSync = syncedProducts > 0 || syncedOrders > 0
  return { hasApiKey, hasSync, syncedProducts, syncedOrders, complete: hasApiKey && hasSync }
}
