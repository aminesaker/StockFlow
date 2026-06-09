// ============================================================
// Observabilité légère : journalise les erreurs applicatives dans
// Supabase (table error_logs) + console, sans dépendance externe.
// ============================================================
import type { SupabaseClient } from '@supabase/supabase-js'

type ErrorEntry = {
  userId?: string | null
  source?: string
  context?: string
  message: unknown
  details?: unknown
}

export async function logError(supabase: SupabaseClient, e: ErrorEntry) {
  const message =
    e.message instanceof Error ? e.message.message : String(e.message)
  console.error(`[${e.source ?? 'app'}/${e.context ?? '-'}]`, message, e.details ?? '')
  try {
    await supabase.from('error_logs').insert({
      user_id: e.userId ?? null,
      source: e.source ?? null,
      context: e.context ?? null,
      message: message.slice(0, 2000),
      details: e.details ? (e.details as object) : null,
    })
  } catch (err) {
    console.error('[observability] insertion error_logs échouée', err)
  }
}
