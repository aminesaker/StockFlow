// ============================================================
// Plomberie commune des webhooks de synchro : auth par clé API,
// rate limiting, vérification de signature (déléguée à l'adaptateur),
// parsing, dispatch vers le cœur, et capture d'erreurs (observabilité).
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import {
  getServiceClient,
  upsertProduct,
  deleteProduct,
  createOrder,
  updateOrder,
  deleteOrder,
  upsertCustomer,
} from './core'
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { logError } from '@/lib/observability'
import { logSyncEvent } from './sync-log'
import type { PlatformAdapter } from './types'

function ok(message: string) {
  return NextResponse.json({ ok: true, message })
}
function err(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status })
}

export async function handleSyncWebhook(req: NextRequest, adapter: PlatformAdapter) {
  const rawBody = Buffer.from(await req.arrayBuffer())
  if (!rawBody.length) {
    return NextResponse.json({ ok: true, message: `${adapter.source} webhook reachable` })
  }

  // 1. Auth tenant via clé API
  const apiKey = req.nextUrl.searchParams.get('api_key')
  if (!apiKey?.startsWith('sf_live_')) return err('api_key manquant ou invalide', 401)
  const keyHash = createHash('sha256').update(apiKey).digest('hex')
  const supabase = getServiceClient()
  const { data: keyRow } = await supabase
    .from('api_keys')
    .select('user_id')
    .eq('key_hash', keyHash)
    .single()
  if (!keyRow) return err('Clé API invalide', 401)
  const userId = keyRow.user_id

  // 2. Rate limiting par tenant (anti-abus)
  const allowed = await checkRateLimit(
    supabase,
    `wh:${userId}`,
    RATE_LIMITS.webhook.limit,
    RATE_LIMITS.webhook.windowSeconds
  )
  if (!allowed) return err('Trop de requêtes — réessayez dans un instant', 429)

  // 3. Réglages + secret de webhook (partagé entre plateformes du tenant)
  const { data: settings } = await supabase
    .from('user_settings')
    .select('wc_webhook_secret, auto_invoice, stock_alerts')
    .eq('user_id', userId)
    .maybeSingle()
  const secret = settings?.wc_webhook_secret ?? null

  // 4. Vérification de signature (propre à la plateforme)
  if (!adapter.verifySignature(rawBody, req.headers, secret)) {
    return err('Signature invalide', 401)
  }

  // 5. Parsing
  const bodyText = rawBody.toString('utf-8')
  if (!bodyText.trim()) return ok(`${adapter.source} webhook reachable`)
  let payload: unknown
  try {
    payload = JSON.parse(bodyText)
  } catch {
    return ok('payload non JSON ignoré')
  }

  const action = adapter.parse(req.headers, payload)
  const src = adapter.source

  // 6. Dispatch vers le cœur (avec capture d'erreurs + journal de synchro)
  let summary: string
  try {
    switch (action.kind) {
      case 'ping':
        return ok('ping')
      case 'ignore':
        return ok(`ignoré (${action.reason})`)
      case 'product.upsert': {
        const r = await upsertProduct(supabase, userId, src, action.product)
        summary = `produit ${r} — ${src}#${action.product.externalId}`
        break
      }
      case 'product.delete':
        await deleteProduct(supabase, userId, src, { externalId: action.externalId, sku: action.sku })
        summary = `produit supprimé — ${src}`
        break
      case 'order.created':
        await createOrder(supabase, userId, src, action.order, settings)
        summary = `commande créée — ${src}#${action.order.externalId}`
        break
      case 'order.updated':
        await updateOrder(supabase, userId, src, action.order, settings)
        summary = `commande mise à jour — ${src}#${action.order.externalId}`
        break
      case 'order.deleted':
        await deleteOrder(supabase, userId, src, action.externalId)
        summary = `commande supprimée — ${src}#${action.externalId}`
        break
      case 'customer.upsert':
        await upsertCustomer(supabase, userId, action.customer)
        summary = `client synchronisé — ${src}`
        break
      default:
        return ok('ignoré')
    }
  } catch (e) {
    await logError(supabase, {
      userId,
      source: src,
      context: action.kind,
      message: e,
    })
    await logSyncEvent(supabase, {
      userId,
      source: src,
      action: action.kind,
      status: 'error',
      detail: e instanceof Error ? e.message : String(e),
    })
    return err('Erreur interne de synchronisation', 500)
  }

  // Succès : enregistrer dans le journal de synchro
  await logSyncEvent(supabase, { userId, source: src, action: action.kind, status: 'ok', detail: summary })
  return ok(summary)
}
