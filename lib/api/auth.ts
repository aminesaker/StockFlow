import { createClient } from '@supabase/supabase-js'
import { createHash, randomBytes } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

// ── Service client (bypass RLS pour les lookups de clés) ──────────────────

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ── Format de clé : sf_live_<32 hex chars> ────────────────────────────────

export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const secret = randomBytes(32).toString('hex')
  const raw = `sf_live_${secret}`
  const hash = createHash('sha256').update(raw).digest('hex')
  const prefix = raw.slice(0, 15) // "sf_live_" + 7 chars
  return { raw, hash, prefix }
}

// ── Valider une clé depuis un header Authorization: Bearer ────────────────

export type ApiAuthResult =
  | { ok: true; userId: string; keyId: string }
  | { ok: false; error: string; status: number }

export async function validateApiKey(req: NextRequest): Promise<ApiAuthResult> {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer sf_live_')) {
    return { ok: false, error: 'Missing or invalid Authorization header. Expected: Bearer sf_live_...', status: 401 }
  }

  const token = auth.slice(7) // retire "Bearer "
  const hash = createHash('sha256').update(token).digest('hex')

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('api_keys')
    .select('id, user_id')
    .eq('key_hash', hash)
    .single()

  if (error || !data) {
    return { ok: false, error: 'Invalid API key.', status: 401 }
  }

  // Mise à jour last_used_at en arrière-plan (sans bloquer la réponse)
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)
    .then(() => {})

  return { ok: true, userId: data.user_id, keyId: data.id }
}

// ── Helper : réponse d'erreur JSON standardisée ───────────────────────────

export function apiError(message: string, status: number, details?: unknown) {
  return NextResponse.json(
    { error: message, ...(details ? { details } : {}) },
    { status }
  )
}

// ── Wrapper HOF pour les route handlers ───────────────────────────────────

type ApiHandler = (
  req: NextRequest,
  context: { userId: string; supabase: ReturnType<typeof getServiceClient> }
) => Promise<NextResponse>

export function withApiAuth(handler: ApiHandler) {
  return async (req: NextRequest) => {
    const auth = await validateApiKey(req)
    if (!auth.ok) return apiError(auth.error, auth.status)

    const supabase = getServiceClient()

    // Rate limiting par tenant (anti-abus)
    const allowed = await checkRateLimit(
      supabase,
      `api:${auth.userId}`,
      RATE_LIMITS.api.limit,
      RATE_LIMITS.api.windowSeconds
    )
    if (!allowed) return apiError('Trop de requêtes — réessayez dans un instant', 429)

    return handler(req, { userId: auth.userId, supabase })
  }
}
