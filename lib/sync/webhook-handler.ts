// ============================================================
// Plomberie commune des webhooks de synchro : auth par clé API,
// vérification de signature (déléguée à l'adaptateur), parsing et
// dispatch vers le cœur. Réutilisé par chaque route plateforme.
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import {
  getServiceClient,
  upsertProduct,
  deleteProduct,
  createOrder,
  updateOrder,
} from './core'
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

  // 2. Réglages + secret de webhook (partagé entre plateformes du tenant)
  const { data: settings } = await supabase
    .from('user_settings')
    .select('wc_webhook_secret, auto_invoice, stock_alerts')
    .eq('user_id', userId)
    .maybeSingle()
  const secret = settings?.wc_webhook_secret ?? null

  // 3. Vérification de signature (propre à la plateforme)
  if (!adapter.verifySignature(rawBody, req.headers, secret)) {
    return err('Signature invalide', 401)
  }

  // 4. Parsing
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

  // 5. Dispatch vers le cœur
  switch (action.kind) {
    case 'ping':
      return ok('ping')
    case 'ignore':
      return ok(`ignoré (${action.reason})`)
    case 'product.upsert': {
      const r = await upsertProduct(supabase, userId, src, action.product)
      return ok(`product ${r} — ${src}#${action.product.externalId}`)
    }
    case 'product.delete':
      await deleteProduct(supabase, userId, src, { externalId: action.externalId, sku: action.sku })
      return ok(`product deleted — ${src}`)
    case 'order.created':
      await createOrder(supabase, userId, src, action.order, settings)
      return ok(`order created — ${src}#${action.order.externalId}`)
    case 'order.updated':
      await updateOrder(supabase, userId, src, action.order, settings)
      return ok(`order updated — ${src}#${action.order.externalId}`)
    default:
      return ok('ignoré')
  }
}
