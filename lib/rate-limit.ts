// ============================================================
// Rate limiting anti-abus (fenêtre fixe, stocké dans Supabase).
// Fail-open : si le limiteur échoue, on autorise (ne jamais casser le service).
// ============================================================
import type { SupabaseClient } from '@supabase/supabase-js'

export const RATE_LIMITS = {
  // 600 requêtes / minute par tenant sur les webhooks (large pour du trafic réel)
  webhook: { limit: 600, windowSeconds: 60 },
  // 120 requêtes / minute par tenant sur l'API publique
  api: { limit: 120, windowSeconds: 60 },
}

export async function checkRateLimit(
  supabase: SupabaseClient,
  bucket: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_bucket: bucket,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  })
  if (error) {
    console.error('[rate-limit] erreur (fail-open):', error)
    return true
  }
  return data === true
}
