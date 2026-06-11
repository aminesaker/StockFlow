'use server'

import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString()
const plusDays = (iso: string, d: number) => new Date(new Date(iso).getTime() + d * 86400000).toISOString().split('T')[0]

const DEMO_CUSTOMERS = [
  { full_name: 'Marie Dupont', email: 'marie.dupont@demo.tijaraflow.test', phone: '+33 6 12 34 56 78', city: 'Paris', country: 'France' },
  { full_name: 'Lucas Martin', email: 'lucas.martin@demo.tijaraflow.test', phone: '+33 6 23 45 67 89', city: 'Lyon', country: 'France' },
  { full_name: 'Sofia Benali', email: 'sofia.benali@demo.tijaraflow.test', phone: '+33 6 34 56 78 90', city: 'Marseille', country: 'France' },
  { full_name: 'Thomas Leroy', email: 'thomas.leroy@demo.tijaraflow.test', phone: '+33 6 45 67 89 01', city: 'Bordeaux', country: 'France' },
]

const DEMO_PRODUCTS = [
  { sku: 'DEMO-TSH-001', name: 'T-shirt coton bio', price: 19.9, cost: 7.5, stock_quantity: 120, low_stock_threshold: 15, category: 'Vêtements' },
  { sku: 'DEMO-SWT-014', name: 'Sweat à capuche', price: 39.9, cost: 16, stock_quantity: 8, low_stock_threshold: 10, category: 'Vêtements' },
  { sku: 'DEMO-CAP-007', name: 'Casquette logo', price: 14.9, cost: 5, stock_quantity: 0, low_stock_threshold: 5, category: 'Accessoires' },
  { sku: 'DEMO-BAG-002', name: 'Tote bag', price: 9.9, cost: 3, stock_quantity: 60, low_stock_threshold: 10, category: 'Accessoires' },
  { sku: 'DEMO-MUG-021', name: 'Mug céramique', price: 12.5, cost: 4, stock_quantity: 35, low_stock_threshold: 8, category: 'Maison' },
  { sku: 'DEMO-GRD-009', name: 'Gourde inox', price: 24.9, cost: 9, stock_quantity: 22, low_stock_threshold: 6, category: 'Maison' },
]

// commande: client email, statut, jours, lignes [sku, qty]
const DEMO_ORDERS: { email: string; status: string; days: number; lines: [string, number][] }[] = [
  { email: 'marie.dupont@demo.tijaraflow.test', status: 'delivered', days: 2,  lines: [['DEMO-TSH-001', 2], ['DEMO-MUG-021', 1]] },
  { email: 'lucas.martin@demo.tijaraflow.test', status: 'shipped',   days: 5,  lines: [['DEMO-SWT-014', 1]] },
  { email: 'sofia.benali@demo.tijaraflow.test', status: 'pending',   days: 1,  lines: [['DEMO-BAG-002', 3], ['DEMO-CAP-007', 1]] },
  { email: 'thomas.leroy@demo.tijaraflow.test', status: 'confirmed', days: 12, lines: [['DEMO-GRD-009', 2]] },
  { email: 'marie.dupont@demo.tijaraflow.test', status: 'delivered', days: 20, lines: [['DEMO-TSH-001', 1], ['DEMO-GRD-009', 1]] },
]

export async function loadDemoData() {
  const t = await getTranslations('onboarding.demo')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: t('errAuth') }
  const userId = user.id

  const { count } = await supabase.from('products').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('is_demo', true)
  if ((count ?? 0) > 0) return { error: t('errExists') }

  // 1. clients
  const { data: customers, error: cErr } = await supabase
    .from('customers')
    .insert(DEMO_CUSTOMERS.map((c) => ({ ...c, user_id: userId, is_demo: true })))
    .select('id, email')
  if (cErr || !customers) return { error: cErr?.message ?? 'insert customers' }
  const custByEmail = new Map(customers.map((c) => [c.email, c.id]))

  // 2. produits
  const { data: products, error: pErr } = await supabase
    .from('products')
    .insert(DEMO_PRODUCTS.map((p) => ({ ...p, user_id: userId, is_demo: true })))
    .select('id, sku, price')
  if (pErr || !products) return { error: pErr?.message ?? 'insert products' }
  const prodBySku = new Map(products.map((p) => [p.sku, { id: p.id, price: Number(p.price) }]))

  // 3. commandes + lignes
  const createdInvoices: { order_id: string; customer_id: string; amount: number; status: string; created_at: string }[] = []
  for (const o of DEMO_ORDERS) {
    const customer_id = custByEmail.get(o.email)!
    const created_at = daysAgo(o.days)
    const items = o.lines.map(([sku, qty]) => {
      const p = prodBySku.get(sku)!
      return { product_id: p.id, quantity: qty, unit_price: p.price, total_price: round2(p.price * qty) }
    })
    const total = round2(items.reduce((s, i) => s + (i.total_price ?? 0), 0))

    const { data: order, error: oErr } = await supabase
      .from('orders')
      .insert({ user_id: userId, customer_id, status: o.status, total_amount: total, created_at, is_demo: true })
      .select('id')
      .single()
    if (oErr || !order) return { error: oErr?.message ?? 'insert order' }

    const { error: iErr } = await supabase.from('order_items').insert(items.map((i) => ({ order_id: order.id, ...i })))
    if (iErr) return { error: iErr.message }

    if (o.status === 'delivered') {
      createdInvoices.push({ order_id: order.id, customer_id, amount: total, status: 'paid', created_at })
    }
  }

  // 4. factures démo (numéros DEMO-, ne touchent pas la séquence réelle)
  let seq = 1
  for (const inv of createdInvoices) {
    const subtotal = round2(inv.amount / 1.2)
    const vat = round2(inv.amount - subtotal)
    await supabase.from('invoices').insert({
      user_id: userId,
      order_id: inv.order_id,
      customer_id: inv.customer_id,
      invoice_number: `DEMO-${String(seq).padStart(4, '0')}`,
      amount: inv.amount,
      subtotal,
      vat_rate: 20,
      vat_amount: vat,
      due_date: plusDays(inv.created_at, 30),
      created_at: inv.created_at,
      paid_at: inv.created_at,
      status: 'paid',
      is_demo: true,
    })
    seq++
  }

  for (const p of ['/dashboard', '/dashboard/stocks', '/dashboard/orders', '/dashboard/customers', '/dashboard/invoices', '/dashboard/reports', '/dashboard/onboarding']) revalidatePath(p)
  return { success: true }
}

export async function removeDemoData() {
  const t = await getTranslations('onboarding.demo')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: t('errAuth') }
  const userId = user.id

  // ordre : factures -> commandes (cascade order_items) -> produits -> clients
  await supabase.from('invoices').delete().eq('user_id', userId).eq('is_demo', true)
  await supabase.from('orders').delete().eq('user_id', userId).eq('is_demo', true)
  await supabase.from('products').delete().eq('user_id', userId).eq('is_demo', true)
  await supabase.from('customers').delete().eq('user_id', userId).eq('is_demo', true)

  for (const p of ['/dashboard', '/dashboard/stocks', '/dashboard/orders', '/dashboard/customers', '/dashboard/invoices', '/dashboard/reports', '/dashboard/onboarding']) revalidatePath(p)
  return { success: true }
}
