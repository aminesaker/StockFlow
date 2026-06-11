// ============================================================
// CŒUR de synchronisation — logique métier indépendante de la plateforme.
// Opère sur le modèle normalisé (types.ts). Appelé par les routes webhook
// après mapping via un adaptateur (WooCommerce, Shopify, …).
// ============================================================
import { createClient } from '@supabase/supabase-js'
import { getBillingProfile, splitVat } from '@/lib/billing/profile'
import { sendInvoiceEmail, sendStockAlert } from '@/lib/email/send'
import type { Locale } from '@/i18n/locales'
import { hasAutomations } from '@/lib/entitlements'
import type {
  NormalizedCustomer,
  NormalizedOrder,
  NormalizedProduct,
  SyncSettings,
} from './types'

export function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

type DB = ReturnType<typeof getServiceClient>

// ── PRODUITS ────────────────────────────────────────────────────────────────

export async function upsertProduct(
  supabase: DB,
  userId: string,
  source: string,
  p: NormalizedProduct,
  storeId?: string | null
): Promise<'created' | 'updated' | 'skipped'> {
  const externalId = p.externalId
  const sku =
    p.sku && p.sku.trim() ? p.sku.trim() : `${source}-${externalId}`

  const baseFields = {
    user_id: userId,
    external_id: externalId,
    external_source: source,
    name: p.name || `Produit ${externalId}`,
    sku,
    price: p.price || 0,
    stock_quantity: p.stockQuantity != null ? p.stockQuantity : 0,
    category: p.category || undefined,
    image_url: p.imageUrl || undefined,
  }

  // Retrouver une ligne existante : d'abord par (source, external_id), sinon sku.
  let existingId: string | null = null
  const byExt = await supabase
    .from('products')
    .select('id')
    .eq('user_id', userId)
    .eq('external_source', source)
    .eq('external_id', externalId)
    .maybeSingle()
  existingId = byExt.data ? byExt.data.id : null

  if (!existingId) {
    const bySku = await supabase
      .from('products')
      .select('id')
      .eq('user_id', userId)
      .eq('sku', sku)
      .maybeSingle()
    existingId = bySku.data ? bySku.data.id : null
  }

  if (existingId) {
    const upd = await supabase
      .from('products')
      .update({ ...baseFields, updated_at: new Date().toISOString() })
      .eq('id', existingId)
    if (upd.error) {
      console.error('[sync] product update error', upd.error)
      return 'skipped'
    }
    return 'updated'
  }

  const ins = await supabase
    .from('products')
    .insert({ ...baseFields, low_stock_threshold: 5, store_id: storeId ?? null })
  if (ins.error) {
    console.error('[sync] product insert error', ins.error)
    return 'skipped'
  }
  return 'created'
}

export async function deleteProduct(
  supabase: DB,
  userId: string,
  source: string,
  ref: { externalId?: string; sku?: string | null }
) {
  if (ref.externalId) {
    await supabase
      .from('products')
      .delete()
      .eq('user_id', userId)
      .eq('external_source', source)
      .eq('external_id', ref.externalId)
  } else if (ref.sku) {
    await supabase
      .from('products')
      .delete()
      .eq('user_id', userId)
      .eq('sku', ref.sku)
  }
}

// ── COMMANDES ───────────────────────────────────────────────────────────────

export async function createOrder(
  supabase: DB,
  userId: string,
  source: string,
  o: NormalizedOrder,
  settings: SyncSettings,
  storeId?: string | null
) {
  const externalId = o.externalId
  const status = o.status

  // 0. Idempotence : si cette commande externe existe déjà, ne pas la re-traiter.
  //    Un webhook rejoué (retry boutique) ne doit pas re-décrémenter le stock
  //    ni créer une commande en double.
  if (externalId) {
    const { data: dup } = await supabase
      .from('orders')
      .select('id')
      .eq('user_id', userId)
      .eq('external_source', source)
      .eq('external_id', externalId)
      .maybeSingle()
    if (dup) return
  }

  // 1. Upsert client
  const customerData = mapCustomerRow(o.customer)
  const { data: customer } = await supabase
    .from('customers')
    .upsert({ ...customerData, user_id: userId, store_id: storeId ?? null }, { onConflict: 'email' })
    .select('id')
    .single()
  if (!customer) return

  // 2. Résoudre les produits par SKU (créer si inexistant)
  const resolvedItems: { product_id: string; quantity: number; unit_price: number }[] = []
  const stockAlerts: { name: string; sku: string; stock_quantity: number; low_stock_threshold: number }[] = []

  for (const item of o.items) {
    if (!item.sku) continue
    let productId: string

    const { data: existing } = await supabase
      .from('products')
      .select('id, stock_quantity, low_stock_threshold')
      .eq('user_id', userId)
      .eq('sku', item.sku)
      .maybeSingle()

    if (existing) {
      productId = existing.id
      await supabase.rpc('decrement_stock', { p_product_id: productId, p_quantity: item.quantity })
      const newQty = existing.stock_quantity - item.quantity
      if (newQty <= existing.low_stock_threshold) {
        stockAlerts.push({ name: item.name, sku: item.sku, stock_quantity: newQty, low_stock_threshold: existing.low_stock_threshold })
      }
    } else {
      const { data: created } = await supabase
        .from('products')
        .insert({ user_id: userId, name: item.name, sku: item.sku, price: item.unitPrice, stock_quantity: 0, low_stock_threshold: 5, store_id: storeId ?? null })
        .select('id')
        .single()
      productId = created?.id ?? ''
    }

    if (productId) {
      resolvedItems.push({ product_id: productId, quantity: item.quantity, unit_price: item.unitPrice })
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
      notes: o.note || `Commande ${source} #${externalId}`,
      external_id: externalId,
      external_source: source,
      store_id: storeId ?? null,
    })
    .select('id')
    .single()
  if (!order) return

  // 4. Lignes
  await supabase.from('order_items').insert(
    resolvedItems.map((i) => ({ order_id: order.id, ...i }))
  )

  // Automatisations : actives uniquement si le plan les inclut (Pro+)
  const autom = await hasAutomations(supabase, userId)

  // 5. Auto-facturation si déjà livrée
  if (autom && status === 'delivered' && settings?.auto_invoice !== false) {
    await triggerAutoInvoice(supabase, userId, order.id, customer.id, total_amount, customerData)
  }

  // 6. Alertes stock
  if (autom && stockAlerts.length > 0 && settings?.stock_alerts !== false) {
    await notifyStockAlerts(supabase, userId, stockAlerts)
  }
}

export async function updateOrder(
  supabase: DB,
  userId: string,
  source: string,
  o: NormalizedOrder,
  settings: SyncSettings
) {
  const status = o.status
  const { data: existing } = await supabase
    .from('orders')
    .select('id, status')
    .eq('user_id', userId)
    .eq('external_source', source)
    .eq('external_id', o.externalId)
    .maybeSingle()

  // Commande inconnue : la créer si on a les infos (utile si "created" manqué)
  if (!existing) {
    if (o.items.length > 0) await createOrder(supabase, userId, source, o, settings)
    return
  }

  if (existing.status === status) return
  await supabase.from('orders').update({ status }).eq('id', existing.id)

  if (status === 'cancelled' && existing.status !== 'cancelled') {
    await restockOrder(supabase, existing.id)
  }
  if (status === 'delivered' && settings?.auto_invoice !== false && (await hasAutomations(supabase, userId))) {
    await triggerAutoInvoice(supabase, userId, existing.id)
  }
}

// ── CLIENTS ─────────────────────────────────────────────────────────────────

export async function upsertCustomer(
  supabase: DB,
  userId: string,
  c: NormalizedCustomer,
  storeId?: string | null
) {
  if (!c.email) return
  const { error } = await supabase
    .from('customers')
    .upsert({ ...mapCustomerRow(c), user_id: userId, store_id: storeId ?? null }, { onConflict: 'email' })
  if (error) console.error('[sync] customer upsert error', error)
}

// Suppression de commande → traitée comme une annulation (restock + statut).
export async function deleteOrder(
  supabase: DB,
  userId: string,
  source: string,
  externalId: string
) {
  const { data: existing } = await supabase
    .from('orders')
    .select('id, status')
    .eq('user_id', userId)
    .eq('external_source', source)
    .eq('external_id', externalId)
    .maybeSingle()
  if (!existing) return
  if (existing.status !== 'cancelled') {
    await restockOrder(supabase, existing.id)
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', existing.id)
  }
}

// ── Helpers internes ──────────────────────────────────────────────────────────

function mapCustomerRow(c: NormalizedCustomer) {
  return {
    full_name: c.fullName,
    email: c.email,
    phone: c.phone || undefined,
    address: c.address || undefined,
    city: c.city || undefined,
    country: c.country || undefined,
  }
}

async function restockOrder(supabase: DB, orderId: string) {
  const { data: items } = await supabase
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', orderId)
  if (!items) return
  for (const it of items) {
    await supabase.rpc('increment_stock', { p_product_id: it.product_id, p_quantity: it.quantity, p_reason: 'cancellation' })
  }
}

async function notifyStockAlerts(
  supabase: DB,
  userId: string,
  products: { name: string; sku: string; stock_quantity: number; low_stock_threshold: number }[]
) {
  const { data: us } = await supabase
    .from('user_settings')
    .select('notify_email, locale')
    .eq('user_id', userId)
    .maybeSingle()
  const { data: authUser } = await supabase.auth.admin.getUserById(userId)
  const email = us?.notify_email ?? authUser?.user?.email
  if (email) await sendStockAlert(email, { products }, (us?.locale as Locale) ?? 'fr').catch(console.error)
}

async function triggerAutoInvoice(
  supabase: DB,
  userId: string,
  orderId: string,
  customerId?: string,
  amount?: number,
  customerData?: { full_name: string; email: string }
) {
  const { data: existing } = await supabase
    .from('invoices')
    .select('id')
    .eq('order_id', orderId)
    .maybeSingle()
  if (existing) return

  const { data: numData } = await supabase.rpc('next_invoice_number', { p_user_id: userId })
  if (!numData) return

  const profile = await getBillingProfile(supabase, userId)
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + (profile.payment_terms_days ?? 30))

  let cId = customerId, amt = amount, cData = customerData
  if (!cId || !amt) {
    const { data: order } = await supabase
      .from('orders')
      .select('customer_id, total_amount, customer:customers(email, full_name)')
      .eq('id', orderId)
      .single()
    cId = order?.customer_id
    amt = order?.total_amount ?? 0
    cData = (order?.customer as { full_name: string; email: string } | undefined) ?? cData
  }

  const v = splitVat(amt ?? 0, profile)
  const { data: invoice } = await supabase
    .from('invoices')
    .insert({
      user_id: userId,
      order_id: orderId,
      customer_id: cId,
      invoice_number: numData,
      amount: v.amount,
      subtotal: v.subtotal,
      vat_rate: v.vat_rate,
      vat_amount: v.vat_amount,
      due_date: dueDate.toISOString().split('T')[0],
      status: 'sent',
    })
    .select('id')
    .single()

  if (invoice && cData?.email) {
    const { data: usInv } = await supabase.from('user_settings').select('locale').eq('user_id', userId).maybeSingle()
    await sendInvoiceEmail(cData.email, {
      invoiceNumber: numData,
      invoiceId: invoice.id,
      customerName: cData.full_name,
      amount: amt ?? 0,
      dueDate: dueDate.toISOString().split('T')[0],
    }, (usInv?.locale as Locale) ?? 'fr').catch(console.error)
  }
}
