'use server'

import { getTranslations } from 'next-intl/server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { TablesUpdate } from '@/lib/supabase/database.types'
import { invoiceSchema } from '@/lib/validations'
import { getBillingProfile, splitVat } from '@/lib/billing/profile'

async function getUserId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  return { supabase, userId: user.id }
}

export async function createInvoice(formData: FormData) {
  const parsed = invoiceSchema.safeParse({
    customer_id: formData.get('customer_id'),
    order_id: formData.get('order_id'),
    amount: formData.get('amount'),
    due_date: formData.get('due_date'),
    status: formData.get('status') || 'draft',
  })

  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { supabase, userId } = await getUserId()

  const { data: invoiceNumber, error: numError } = await supabase.rpc('next_invoice_number', { p_user_id: userId })
  if (numError) return { error: { _root: [numError.message] } }

  const profile = await getBillingProfile(supabase, userId)
  const v = splitVat(Number(parsed.data.amount), profile)

  const { error } = await supabase.from('invoices').insert({
    ...parsed.data,
    amount: v.amount,
    subtotal: v.subtotal,
    vat_rate: v.vat_rate,
    vat_amount: v.vat_amount,
    invoice_number: invoiceNumber,
    order_id: parsed.data.order_id || null,
    user_id: userId,
  })

  if (error) return { error: { _root: [error.message] } }

  revalidatePath('/dashboard/invoices')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function createInvoiceFromOrder(orderId: string) {
  const { supabase, userId } = await getUserId()

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*, customer:customers(id, full_name)')
    .eq('id', orderId)
    .single()

  if (orderError || !order) return { error: 'Commande introuvable' }

  const { data: existing } = await supabase
    .from('invoices')
    .select('id, invoice_number')
    .eq('order_id', orderId)
    .maybeSingle()

  if (existing) return { error: `Facture ${existing.invoice_number} existe déjà pour cette commande` }

  const { data: invoiceNumber, error: numError } = await supabase.rpc('next_invoice_number', { p_user_id: userId })
  if (numError) return { error: numError.message }

  const profile = await getBillingProfile(supabase, userId)
  const v = splitVat(order.total_amount, profile)

  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + (profile.payment_terms_days ?? 30))

  const { error } = await supabase.from('invoices').insert({
    order_id: orderId,
    customer_id: (order.customer as { id: string }).id,
    invoice_number: invoiceNumber,
    amount: v.amount,
    subtotal: v.subtotal,
    vat_rate: v.vat_rate,
    vat_amount: v.vat_amount,
    due_date: dueDate.toISOString().split('T')[0],
    status: 'draft',
    user_id: userId,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/invoices')
  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard')
  return { success: true, invoiceNumber }
}

export async function updateInvoiceStatus(
  id: string,
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
) {
  const { supabase } = await getUserId()

  const update: TablesUpdate<'invoices'> = { status }
  if (status === 'paid') update.paid_at = new Date().toISOString()

  const { error } = await supabase.from('invoices').update(update).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/invoices')
  return { success: true }
}

export async function deleteInvoice(id: string) {
  const { supabase } = await getUserId()
  const { error } = await supabase.from('invoices').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/invoices')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function createCreditNote(
  invoiceId: string,
  items?: { product_id: string; quantity: number }[],
) {
  const t = await getTranslations('invoiceDetail')
  const { supabase, userId } = await getUserId()

  const { data: invoice, error: invErr } = await supabase
    .from('invoices')
    .select('id, customer_id, order_id, amount, subtotal, vat_rate, vat_amount, invoice_number')
    .eq('id', invoiceId)
    .single()
  if (invErr || !invoice) return { error: t('creditNotFound') }

  // Lignes de la commande liée (si présente)
  let orderItems: { product_id: string; quantity: number; unit_price: number }[] = []
  if (invoice.order_id) {
    const { data: oi } = await supabase
      .from('order_items')
      .select('product_id, quantity, unit_price')
      .eq('order_id', invoice.order_id)
    orderItems = (oi ?? []) as { product_id: string; quantity: number; unit_price: number }[]
  }

  // Quantités déjà retournées (avoirs précédents de cette facture)
  const { data: prevCN } = await supabase.from('credit_notes').select('id').eq('invoice_id', invoiceId)
  const prevIds = (prevCN ?? []).map((c) => c.id)
  const returned: Record<string, number> = {}
  if (prevIds.length) {
    const { data: cni } = await supabase.from('credit_note_items').select('product_id, quantity').in('credit_note_id', prevIds)
    for (const r of cni ?? []) {
      if (r.product_id) returned[r.product_id] = (returned[r.product_id] ?? 0) + r.quantity
    }
  }

  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

  // Construire les lignes de l'avoir
  let lines: { product_id: string; quantity: number; unit_price: number }[] = []
  if (orderItems.length) {
    if (items && items.length) {
      // Partiel : valider chaque quantité demandée
      for (const req of items) {
        const oi = orderItems.find((x) => x.product_id === req.product_id)
        if (!oi) continue
        const remaining = oi.quantity - (returned[req.product_id] ?? 0)
        const qty = Math.min(Math.max(0, Math.floor(req.quantity)), remaining)
        if (qty > 0) lines.push({ product_id: req.product_id, quantity: qty, unit_price: oi.unit_price })
      }
    } else {
      // Sans sélection : retourner tout ce qui reste
      for (const oi of orderItems) {
        const remaining = oi.quantity - (returned[oi.product_id] ?? 0)
        if (remaining > 0) lines.push({ product_id: oi.product_id, quantity: remaining, unit_price: oi.unit_price })
      }
    }
    if (!lines.length) return { error: t('creditNothing') }
  } else {
    // Facture manuelle sans commande : un seul avoir total possible
    if (prevIds.length) return { error: t('creditExists', { number: '' }) }
    lines = []
  }

  const amount = lines.length ? round2(lines.reduce((s2, l) => s2 + l.quantity * l.unit_price, 0)) : invoice.amount
  const rate = Number(invoice.vat_rate ?? 0)
  const subtotal = rate > 0 ? round2(amount / (1 + rate / 100)) : amount
  const vat = round2(amount - subtotal)

  const { data: creditNumber, error: numErr } = await supabase.rpc('next_credit_number', { p_user_id: userId })
  if (numErr || !creditNumber) return { error: numErr?.message ?? 'numbering error' }

  const { data: cn, error: insErr } = await supabase.from('credit_notes').insert({
    user_id: userId,
    invoice_id: invoice.id,
    customer_id: invoice.customer_id,
    credit_number: creditNumber,
    amount,
    subtotal,
    vat_rate: rate,
    vat_amount: vat,
  }).select('id').single()
  if (insErr || !cn) return { error: insErr?.message ?? 'insert error' }

  if (lines.length) {
    await supabase.from('credit_note_items').insert(
      lines.map((l) => ({ credit_note_id: cn.id, product_id: l.product_id, quantity: l.quantity, unit_price: l.unit_price })),
    )
    for (const l of lines) {
      await supabase.rpc('increment_stock', { p_product_id: l.product_id, p_quantity: l.quantity, p_reason: 'return', p_reference: creditNumber })
    }
  }

  revalidatePath('/dashboard/invoices')
  revalidatePath(`/dashboard/invoices/${invoiceId}`)
  revalidatePath('/dashboard/stocks')
  revalidatePath('/dashboard')
  return { success: true, creditNumber }
}
