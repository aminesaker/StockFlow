// ============================================================
// Journal de synchronisation : enregistre chaque event de webhook
// (succès ou erreur) dans la table sync_events pour le hub d'intégration.
// Best-effort : n'interrompt jamais le traitement du webhook.
// ============================================================
import type { SupabaseClient } from '@supabase/supabase-js'

export async function logSyncEvent(
  supabase: SupabaseClient,
  e: { userId: string; source: string; action: string; status: 'ok' | 'error'; detail?: string },
) {
  try {
    await supabase.from('sync_events').insert({
      user_id: e.userId,
      source: e.source,
      action: e.action,
      status: e.status,
      detail: e.detail ? e.detail.slice(0, 500) : null,
    })
  } catch (err) {
    console.error('[sync-log] insertion sync_events échouée', err)
  }
}
