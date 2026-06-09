'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { invoiceSchema } from '@/lib/validations'

export async function createInvoice(formData: FormData) {
  const parsed = invoiceSchema.safeParse({
    customer_id: formData.get('customer_id'),
    order_id: formData.get('order_id'),
    amount: formData.get('amount'),
    due_date: formData.get('due_date'),
    status: formData.get('status') || 'draft',
  })

  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()

  // Génère le numéro de facture via la fonction SQL
  const { data: invoiceNumber, error: numError } = await supabase
    .rpc('generate_invoice_number')

  if (numError) return { error: { _root: [numError.message] } }

  const payload = {
    ...parsed.data,
    invoice_number: invoiceNumber,
    order_id: parsed.data.order_id || null,
  }

  const { error } = await supabase.from('invoices').insert(payload)
  if (error) return { error: { _root: [error.message] } }

  revalidatePath('/dashboard/invoices')
  revalidatePath('/dashboard')
  return { success: true }
}

// Crée une facture directement depuis une commande (1 clic)
export async function createInvoiceFromOrder(orderId: string) {
  const supabase = await createClient()

  // Récupère la commande + client
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*, customer:customers(id, full_name)')
    .eq('id', orderId)
    .single()

  if (orderError || !order) return { error: 'Commande introuvable' }

  // Vérifie qu'une facture n'existe pas déjà pour cette commande
  const { data: existing } = await supabase
    .from('invoices')
    .select('id, invoice_number')
    .eq('order_id', orderId)
    .maybeSingle()

  if (existing) return { error: `Facture ${existing.invoice_number} existe déjà pour cette commande` }

  const { data: invoiceNumber, error: numError } = await supabase
    .rpc('generate_invoice_number')

  if (numError) return { error: numError.message }

  // Échéance = 30 jours
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 30)

  const { error } = await supabase.from('invoices').insert({
    order_id: orderId,
    customer_id: (order.customer as { id: string }).id,
    invoice_number: invoiceNumber,
    amount: order.total_amount,
    due_date: dueDate.toISOString().split('T')[0],
    status: 'draft',
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/invoices')
  revalidatePath('/dashboard/orders')
  revalidatePath('/dashboard')
  return { success: true, invoiceNumber }
}

export async function updateInvoiceStatus(id: string, status: string) {
  const supabase = await createClient()

  const update: Record<string, unknown> = { status }
  if (status === 'paid') update.paid_at = new Date().toISOString()

  const { error } = await supabase.from('invoices').update(update).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/invoices')
  return { success: true }
}

export async function deleteInvoice(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('invoices').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/invoices')
  revalidatePath('/dashboard')
  return { success: true }
}
