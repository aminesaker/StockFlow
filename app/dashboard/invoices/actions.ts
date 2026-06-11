'use server'

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
