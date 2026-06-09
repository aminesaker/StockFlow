/**
 * Webhook WooCommerce
 *
 * URL à configurer dans WooCommerce :
 *   https://votreapp.vercel.app/api/webhooks/woocommerce?api_key=sf_live_xxxx
 *
 * Topics à activer dans WC :
 *   - Order created
 *   - Order updated
 *   - Product created
 *   - Product updated
 *   - Product deleted
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'
import {
  verifyWcSignature,
  parseWcTopic,
  mapWcCustomer,
  mapWcItems,
  mapWcStatus,
  WcOrderPayload,
  WcProductPayload,
} from '@/lib/webhooks/woocommerce'
import { sendInvoiceEmail, sendStockAlert } from '@/lib/email/send'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function ok(message: string) {
  return NextResponse.json({ ok: true, message })
}
function err(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status })
}

export async function POST(req: NextRequest) {
  const rawBody = Buffer.from(await req.arrayBuffer())

  if (!rawBody.length) {
    return NextResponse.json({
      ok: true,
      message: 'WooCommerce webhook reachable',
    })
  }

  // ── 1. Identifier l'utilisateur via api_key ─────────────────────────────
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

  // ── 2. Vérifier la signature WooCommerce (si secret configuré) ─────────
  const { data: settings } = await supabase
    .from('user_settings')
    .select('wc_webhook_secret, auto_invoice, stock_alerts')
    .eq('user_id', userId)
    .maybeSingle()

  const wcSecret = settings?.wc_webhook_secret
  const signature = req.headers.get('x-wc-webhook-signature')

  if (wcSecret) {
    if (!verifyWcSignature(rawBody, signature, wcSecret)) {
      return err('Signature invalide', 401)
    }
  }

  // ── 3. Parser le topic et le payload ───────────────────────────────────
  const topic = parseWcTopic(req.headers.get('x-wc-webhook-topic'))
  const bodyText = rawBody.toString('utf-8')

  if (!bodyText || bodyText.trim() === '') {
    return ok('Webhook WooCommerce accessible')
  }

  let payload: unknown = null
  try {
    payload = JSON.parse(bodyText)
  } catch {
    console.error('Payload WooCommerce invalide:', bodyText)
    return ok('Webhook WooCommerce accessible mais payload non JSON ignoré')
  }

  // ── 4. Dispatcher par topic ────────────────────────────────────────────

  if (topic === 'order.created' || topic === 'order.updated') {
    const wcOrder = payload as WcOrderPayload
    await handleOrder(supabase, userId, wcOrder, topic, settings)
    return ok(`Order ${topic} traité — WC#${wcOrder.id}`)
  }

  if (topic === 'product.created' || topic === 'product.updated') {
    const wcProduct = payload as WcProductPayload
    const result = await handleProduct(supabase, userId, wcProduct)
    return ok(`Product ${topic} — ${result} (WC#${wcProduct.id})`)
  }

  if (topic === 'product.deleted') {
    const wcProduct = payload as Partial<WcProductPayload>
    await handleProductDelete(supabase, userId, wcProduct)
    return ok(`Product deleted — WC#${wcProduct.id}`)
  }

  // Topic non géré — répondre 200 pour éviter les retries WC
  return ok(`Topic "${topic}" ignoré`)
}

// ── Handler commande ───────────────────────────────────────────────────────

async function handleOrder(
  supabase: ReturnType<typeof getServiceClient>,
  userId: string,
  wcOrder: WcOrderPayload,
  topic: string,
  settings: { auto_invoice?: boolean; stock_alerts?: boolean } | null
) {
  const externalId = String(wcOrder.id)
  const status = mapWcStatus(wcOrder.status)

  // ── order.updated : mettre à jour le statut si la commande existe ──────
  if (topic === 'order.updated') {
    const { data: existing } = await supabase
      .from('orders')
      .select('id, status')
      .eq('user_id', userId)
      .eq('external_source', 'woocommerce')
      .eq('external_id', externalId)
      .maybeSingle()

    if (existing && existing.status !== status) {
      await supabase.from('orders').update({ status }).eq('id', existing.id)

      // Restock si la commande passe en annulée/remboursée (mapWcStatus
      // mappe 'cancelled', 'refunded' et 'failed' vers 'cancelled').
      if (status === 'cancelled' && existing.status !== 'cancelled') {
        await restockOrder(supabase, existing.id)
      }

      // Auto-facturation si passage en "delivered"
      if (status === 'delivered' && settings?.auto_invoice !== false) {
        await triggerAutoInvoice(supabase, userId, existing.id)
      }
    }
    return
  }

  // ── order.created : créer le client, les produits manquants, la commande

  // 1. Upsert client
  const customerData = mapWcCustomer(wcOrder.billing)
  const { data: customer } = await supabase
    .from('customers')
    .upsert({ ...customerData, user_id: userId }, { onConflict: 'email' })
    .select('id')
    .single()

  if (!customer) return

  // 2. Résoudre les produits par SKU (créer si inexistant)
  const items = mapWcItems(wcOrder.line_items)
  const resolvedItems: { product_id: string; quantity: number; unit_price: number }[] = []
  const stockAlerts: { name: string; sku: string; stock_quantity: number; low_stock_threshold: number }[] = []

  for (const item of items) {
    let productId: string

    if (item.sku) {
      const { data: existing } = await supabase
        .from('products')
        .select('id, stock_quantity, low_stock_threshold')
        .eq('user_id', userId)
        .eq('sku', item.sku)
        .maybeSingle()

      if (existing) {
        productId = existing.id
        // Décrémenter le stock
        await supabase.rpc('decrement_stock', { p_product_id: productId, p_quantity: item.quantity })
        // Vérifier stock bas
        const newQty = existing.stock_quantity - item.quantity
        if (newQty <= existing.low_stock_threshold) {
          stockAlerts.push({ name: item.name, sku: item.sku, stock_quantity: newQty, low_stock_threshold: existing.low_stock_threshold })
        }
      } else {
        // Créer le produit à la volée depuis WooCommerce
        const { data: created } = await supabase
          .from('products')
          .insert({
            user_id: userId,
            name: item.name,
            sku: item.sku,
            price: item.unit_price,
            stock_quantity: 0,
            low_stock_threshold: 5,
          })
          .select('id')
          .single()
        productId = created?.id ?? ''
      }
    } else {
      continue
    }

    if (productId) {
      resolvedItems.push({ product_id: productId, quantity: item.quantity, unit_price: item.unit_price })
    }
  }

  if (!resolvedItems.length) return

  const total_amount = resolvedItems.reduce((s, i) => s + i.quantity * i.unit_price, 0)

  // 3. Créer la commande
  const { data: order } = await supabase
    .from('orders')
    .insert({
      user_id: userId,
      customer_id: customer.id,
      status,
      total_amount,
      notes: wcOrder.customer_note || `Commande WooCommerce #${wcOrder.id}`,
      external_id: externalId,
      external_source: 'woocommerce',
    })
    .select('id')
    .single()

  if (!order) return

  // 4. Insérer les lignes
  await supabase.from('order_items').insert(
    resolvedItems.map((i) => ({ order_id: order.id, ...i }))
  )

  // 5. Auto-facturation si commande déjà "delivered" (ex: statut "completed" WC)
  if (status === 'delivered' && settings?.auto_invoice !== false) {
    await triggerAutoInvoice(supabase, userId, order.id, customer.id, total_amount, customerData)
  }

  // 6. Alertes stock
  if (stockAlerts.length > 0 && settings?.stock_alerts !== false) {
    const { data: userSettings } = await supabase
      .from('user_settings')
      .select('notify_email')
      .eq('user_id', userId)
      .maybeSingle()
    const { data: authUser } = await supabase.auth.admin.getUserById(userId)
    const email = userSettings?.notify_email ?? authUser?.user?.email
    if (email) await sendStockAlert(email, { products: stockAlerts }).catch(console.error)
  }
}

// ── Restock (annulation / remboursement) ───────────────────────────────────

// Ré-incrémente le stock des produits d'une commande annulée/remboursée.
async function restockOrder(
  supabase: ReturnType<typeof getServiceClient>,
  orderId: string
) {
  const { data: items } = await supabase
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', orderId)

  if (!items) return
  for (const it of items) {
    await supabase.rpc('increment_stock', {
      p_product_id: it.product_id,
      p_quantity: it.quantity,
    })
  }
}

// ── Auto-facturation ───────────────────────────────────────────────────────

async function triggerAutoInvoice(
  supabase: ReturnType<typeof getServiceClient>,
  userId: string,
  orderId: string,
  customerId?: string,
  amount?: number,
  customerData?: { full_name: string; email: string }
) {
  // Vérifier qu'aucune facture n'existe déjà
  const { data: existing } = await supabase
    .from('invoices')
    .select('id')
    .eq('order_id', orderId)
    .maybeSingle()
  if (existing) return

  const { data: numData } = await supabase.rpc('generate_invoice_number')
  if (!numData) return

  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 30)

  // Récupérer les infos si pas fournies
  let cId = customerId, amt = amount, cData = customerData
  if (!cId || !amt) {
    const { data: order } = await supabase
      .from('orders')
      .select('customer_id, total_amount, customer:customers(email, full_name)')
      .eq('id', orderId)
      .single()
    cId = order?.customer_id
    amt = order?.total_amount ?? 0
    cData = order?.customer as { full_name: string; email: string } | undefined ?? cData
  }

  const { data: invoice } = await supabase
    .from('invoices')
    .insert({
      user_id: userId,
      order_id: orderId,
      customer_id: cId,
      invoice_number: numData,
      amount: amt ?? 0,
      due_date: dueDate.toISOString().split('T')[0],
      status: 'sent',
    })
    .select('id')
    .single()

  if (invoice && cData?.email) {
    await sendInvoiceEmail(cData.email, {
      invoiceNumber: numData,
      invoiceId: invoice.id,
      customerName: cData.full_name,
      amount: amt ?? 0,
      dueDate: dueDate.toISOString().split('T')[0],
    }).catch(console.error)
  }
}

// ── Handler produit ────────────────────────────────────────────────────────

async function handleProduct(
  supabase: ReturnType<typeof getServiceClient>,
  userId: string,
  wcProduct: WcProductPayload
): Promise<'created' | 'updated' | 'skipped'> {
  // On ne synchronise pas les produits à la corbeille.
  if (wcProduct.status === 'trash') return 'skipped'

  const wooId = wcProduct.id != null ? wcProduct.id : null
  // SKU de repli si WooCommerce n'en fournit pas (champ souvent laissé vide).
  const rawSku = wcProduct.sku != null ? String(wcProduct.sku).trim() : ''
  const sku = rawSku !== '' ? rawSku : 'woo-' + String(wooId)

  const cats = wcProduct.categories
  const category = cats && cats.length > 0 ? cats[0].name : undefined
  const imgs = wcProduct.images
  const image_url = imgs && imgs.length > 0 ? imgs[0].src : undefined

  const fields = {
    user_id: userId,
    woo_id: wooId,
    name: wcProduct.name || 'Produit ' + String(wooId),
    sku,
    price: parseFloat(wcProduct.price || wcProduct.regular_price) || 0,
    stock_quantity: wcProduct.manage_stock
      ? (wcProduct.stock_quantity != null ? wcProduct.stock_quantity : 0)
      : 999,
    low_stock_threshold: 5,
    category: category || undefined,
    image_url: image_url || undefined,
  }

  // Retrouver une ligne existante : d'abord par woo_id (fiable), sinon par sku.
  let existingId: string | null = null
  if (wooId !== null) {
    const res = await supabase
      .from('products')
      .select('id')
      .eq('user_id', userId)
      .eq('woo_id', wooId)
      .maybeSingle()
    existingId = res.data ? res.data.id : null
  }
  if (!existingId) {
    const res = await supabase
      .from('products')
      .select('id')
      .eq('user_id', userId)
      .eq('sku', sku)
      .maybeSingle()
    existingId = res.data ? res.data.id : null
  }

  if (existingId) {
    const upd = await supabase
      .from('products')
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq('id', existingId)
    if (upd.error) {
      console.error('[wc] product update error', upd.error)
      return 'skipped'
    }
    return 'updated'
  }

  const ins = await supabase.from('products').insert(fields)
  if (ins.error) {
    console.error('[wc] product insert error', ins.error)
    return 'skipped'
  }
  return 'created'
}

// Suppression d'un produit côté WooCommerce → suppression dans StockFlow.
async function handleProductDelete(
  supabase: ReturnType<typeof getServiceClient>,
  userId: string,
  wcProduct: Partial<WcProductPayload>
) {
  if (wcProduct.id != null) {
    await supabase
      .from('products')
      .delete()
      .eq('user_id', userId)
      .eq('woo_id', wcProduct.id)
  } else if (wcProduct.sku) {
    await supabase
      .from('products')
      .delete()
      .eq('user_id', userId)
      .eq('sku', wcProduct.sku)
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'WooCommerce webhook endpoint OK',
  })
}
