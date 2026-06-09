import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withApiAuth, apiError } from '@/lib/api/auth'

const orderSchema = z.object({
  // Identifier le client par email OU par id
  customer_email: z.string().email().optional(),
  customer_id:    z.string().uuid().optional(),
  notes:          z.string().optional(),
  // Identifier les produits par SKU OU par id
  items: z.array(z.object({
    sku:        z.string().optional(),
    product_id: z.string().uuid().optional(),
    quantity:   z.number().int().min(1),
    unit_price: z.number().min(0),
  })).min(1),
}).refine(
  (d) => d.customer_email || d.customer_id,
  { message: 'customer_email ou customer_id requis' }
)

// ── GET /api/v1/orders ────────────────────────────────────────────────────

export const GET = withApiAuth(async (_req, { userId, supabase }) => {
  const { data, error } = await supabase
    .from('orders')
    .select('id, status, total_amount, notes, created_at, customer:customers(full_name, email)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) return apiError(error.message, 500)

  return NextResponse.json({ data, count: data.length })
})

// ── POST /api/v1/orders ───────────────────────────────────────────────────

export const POST = withApiAuth(async (req: NextRequest, { userId, supabase }) => {
  let body: unknown
  try { body = await req.json() } catch { return apiError('Invalid JSON body', 400) }

  const parsed = orderSchema.safeParse(body)
  if (!parsed.success) return apiError('Validation error', 422, parsed.error.flatten())

  const { customer_email, customer_id, notes, items } = parsed.data

  // ── 1. Résoudre le client ──────────────────────────────────────────────
  let resolvedCustomerId = customer_id

  if (!resolvedCustomerId && customer_email) {
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('user_id', userId)
      .eq('email', customer_email)
      .maybeSingle()

    if (!existing) return apiError(`Client introuvable pour l'email : ${customer_email}`, 404)
    resolvedCustomerId = existing.id
  }

  // ── 2. Résoudre les produits par SKU ──────────────────────────────────
  const resolvedItems: { product_id: string; quantity: number; unit_price: number }[] = []

  for (const item of items) {
    let productId = item.product_id

    if (!productId && item.sku) {
      const { data: product } = await supabase
        .from('products')
        .select('id, stock_quantity, name')
        .eq('user_id', userId)
        .eq('sku', item.sku)
        .single()

      if (!product) return apiError(`Produit introuvable pour le SKU : ${item.sku}`, 404)

      if (product.stock_quantity < item.quantity) {
        return apiError(
          `Stock insuffisant pour "${product.name}" — disponible : ${product.stock_quantity}, demandé : ${item.quantity}`,
          409
        )
      }
      productId = product.id
    }

    if (!productId) return apiError('product_id ou sku requis pour chaque article', 422)
    resolvedItems.push({ product_id: productId, quantity: item.quantity, unit_price: item.unit_price })
  }

  const total_amount = resolvedItems.reduce((s, i) => s + i.quantity * i.unit_price, 0)

  // ── 3. Créer la commande ───────────────────────────────────────────────
  const { data: order, error: orderErr } = await supabase
    .from('orders')
    .insert({ customer_id: resolvedCustomerId, notes, total_amount, status: 'pending', user_id: userId })
    .select()
    .single()

  if (orderErr || !order) return apiError(orderErr?.message ?? 'Erreur création commande', 500)

  // ── 4. Insérer les lignes ──────────────────────────────────────────────
  const { error: itemsErr } = await supabase.from('order_items').insert(
    resolvedItems.map((i) => ({ order_id: order.id, ...i }))
  )

  if (itemsErr) {
    await supabase.from('orders').delete().eq('id', order.id)
    return apiError(itemsErr.message, 500)
  }

  // ── 5. Décrémenter le stock ────────────────────────────────────────────
  for (const item of resolvedItems) {
    await supabase.rpc('decrement_stock', {
      p_product_id: item.product_id,
      p_quantity: item.quantity,
    })
  }

  return NextResponse.json({
    data: {
      id: order.id,
      status: order.status,
      total_amount: order.total_amount,
      created_at: order.created_at,
    }
  }, { status: 201 })
})
