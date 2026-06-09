'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const createOrderSchema = z.object({
  customer_id: z.string().uuid('Client requis'),
  notes: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.coerce.number().int().min(1),
    unit_price: z.coerce.number().min(0),
  })).min(1, 'Au moins un article requis'),
})

async function getUserId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  return { supabase, userId: user.id }
}

export async function createOrder(formData: FormData) {
  let items
  try {
    items = JSON.parse(formData.get('items') as string)
  } catch {
    return { error: { _root: ['Articles invalides'] } }
  }

  const parsed = createOrderSchema.safeParse({
    customer_id: formData.get('customer_id'),
    notes: formData.get('notes'),
    items,
  })

  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { customer_id, notes, items: orderItems } = parsed.data
  const total_amount = orderItems.reduce((s, i) => s + i.quantity * i.unit_price, 0)

  const { supabase, userId } = await getUserId()

  // Vérifier le stock disponible
  for (const item of orderItems) {
    const { data: product } = await supabase
      .from('products')
      .select('stock_quantity, name')
      .eq('id', item.product_id)
      .single()

    if (!product || product.stock_quantity < item.quantity) {
      return {
        error: {
          _root: [`Stock insuffisant pour "${product?.name ?? 'produit inconnu'}" (dispo: ${product?.stock_quantity ?? 0})`],
        },
      }
    }
  }

  // Créer la commande avec user_id
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({ customer_id, notes, total_amount, status: 'pending', user_id: userId })
    .select()
    .single()

  if (orderError || !order) return { error: { _root: [orderError?.message ?? 'Erreur création commande'] } }

  // Insérer les lignes (RLS order_items vérifie via orders.user_id)
  const { error: itemsError } = await supabase.from('order_items').insert(
    orderItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
    }))
  )

  if (itemsError) {
    await supabase.from('orders').delete().eq('id', order.id)
    return { error: { _root: [itemsError.message] } }
  }

  // Décrémenter le stock
  for (const item of orderItems) {
    await supabase.rpc('decrement_stock', {
      p_product_id: item.product_id,
      p_quantity: item.quantity,
    })
  }

  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard/stocks')
  revalidatePath('/dashboard')
  return { success: true, orderId: order.id }
}

export async function updateOrderStatus(id: string, status: string) {
  const { supabase } = await getUserId()
  const { error } = await supabase.from('orders').update({ status }).eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/orders')
  return { success: true }
}

export async function deleteOrder(id: string) {
  const { supabase } = await getUserId()
  const { error } = await supabase.from('orders').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard')
  return { success: true }
}
