'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { sendStockAlert, sendInvoiceEmail } from '@/lib/email/send'
import { createInvoiceFromOrder } from '@/app/dashboard/invoices/actions'
import { canCreate, limitMessage, hasAutomations } from '@/lib/entitlements'

const createOrderSchema = z.object({
  customer_id: z.string().uuid('Client requis'),
  notes: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    quantity: z.coerce.number().int().min(1),
    unit_price: z.coerce.number().min(0),
  })).min(1, 'Au moins un article requis'),
})

async function getAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  return { supabase, user }
}

// ── Récupérer les settings utilisateur ────────────────────────────────────

async function getUserSettings(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  return data
}

// ── Créer une commande ────────────────────────────────────────────────────

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

  const { supabase, user } = await getAuth()

  // Enforcement de la limite du plan
  const limit = await canCreate(supabase, user.id, 'orders')
  if (!limit.allowed) return { error: { _root: [limitMessage('orders', limit)] } }

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

  // Créer la commande
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({ customer_id, notes, total_amount, status: 'pending', user_id: user.id })
    .select()
    .single()

  if (orderError || !order) return { error: { _root: [orderError?.message ?? 'Erreur création commande'] } }

  // Insérer les lignes
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

  // Décrémenter le stock + détecter les alertes
  const stockAlerts: { name: string; sku: string; stock_quantity: number; low_stock_threshold: number }[] = []

  for (const item of orderItems) {
    await supabase.rpc('decrement_stock', {
      p_product_id: item.product_id,
      p_quantity: item.quantity,
    })

    // Vérifier si le nouveau stock est bas
    const { data: updated } = await supabase
      .from('products')
      .select('name, sku, stock_quantity, low_stock_threshold')
      .eq('id', item.product_id)
      .single()

    if (updated && updated.stock_quantity <= updated.low_stock_threshold) {
      stockAlerts.push(updated)
    }
  }

  // Envoyer alerte stock si activé
  if (stockAlerts.length > 0) {
    const settings = await getUserSettings(supabase, user.id)
    if (settings?.stock_alerts !== false) {
      const notifyEmail = settings?.notify_email ?? user.email
      if (notifyEmail) {
        await sendStockAlert(notifyEmail, { products: stockAlerts }).catch(console.error)
      }
    }
  }

  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard/stocks')
  revalidatePath('/dashboard')
  return { success: true, orderId: order.id }
}

// ── Changer le statut d'une commande ──────────────────────────────────────

export async function updateOrderStatus(id: string, status: string) {
  const { supabase, user } = await getAuth()
  const { error } = await supabase.from('orders').update({ status }).eq('id', id)

  if (error) return { error: error.message }

  // 🔥 Auto-facturation quand la commande passe en "delivered"
  if (status === 'delivered') {
    const settings = await getUserSettings(supabase, user.id)
    if (settings?.auto_invoice !== false && (await hasAutomations(supabase, user.id))) {
      const result = await createInvoiceFromOrder(id)

      if (!result.error && result.invoiceNumber) {
        // Récupérer l'email du client pour lui envoyer la facture
        const { data: order } = await supabase
          .from('orders')
          .select('customer:customers(email, full_name), invoices(id)')
          .eq('id', id)
          .single()

        const customer = (order?.customer as { email: string; full_name: string }[] | null)?.[0]
        const invoice = (order?.invoices as { id: string }[] | null)?.[0]

        if (customer?.email && invoice?.id) {
          const dueDate = new Date()
          dueDate.setDate(dueDate.getDate() + 30)

          await sendInvoiceEmail(customer.email, {
            invoiceNumber: result.invoiceNumber,
            invoiceId: invoice.id,
            customerName: customer.full_name,
            amount: 0, // sera récupéré depuis la DB dans une amélioration future
            dueDate: dueDate.toISOString().split('T')[0],
          }).catch(console.error)
        }
      }
    }
  }

  revalidatePath('/dashboard/orders')
  return { success: true }
}

// ── Supprimer une commande ─────────────────────────────────────────────────

export async function deleteOrder(id: string) {
  const { supabase } = await getAuth()
  const { error } = await supabase.from('orders').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard')
  return { success: true }
}
