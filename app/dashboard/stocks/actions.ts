'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { productSchema } from '@/lib/validations'
import { canCreate, limitMessage } from '@/lib/entitlements'

async function getUserId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  return { supabase, userId: user.id }
}

export async function createProduct(formData: FormData) {
  const raw = {
    name: formData.get('name'),
    sku: formData.get('sku'),
    description: formData.get('description'),
    price: formData.get('price'),
    cost: formData.get('cost'),
    stock_quantity: formData.get('stock_quantity'),
    low_stock_threshold: formData.get('low_stock_threshold'),
    category: formData.get('category'),
    image_url: formData.get('image_url'),
  }

  const parsed = productSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { supabase, userId } = await getUserId()

  const limit = await canCreate(supabase, userId, 'products')
  if (!limit.allowed) return { error: { _root: [limitMessage('products', limit)] } }

  const { data: created, error } = await supabase
    .from('products')
    .insert({ ...parsed.data, user_id: userId })
    .select('id, stock_quantity')
    .single()

  if (error) return { error: { _root: [error.message] } }

  // Mouvement de stock initial
  if (created && created.stock_quantity > 0) {
    await supabase.from('stock_movements').insert({
      user_id: userId,
      product_id: created.id,
      delta: created.stock_quantity,
      reason: 'initial',
      balance_after: created.stock_quantity,
    })
  }

  revalidatePath('/dashboard/stocks')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateProduct(id: string, formData: FormData) {
  const raw = {
    name: formData.get('name'),
    sku: formData.get('sku'),
    description: formData.get('description'),
    price: formData.get('price'),
    cost: formData.get('cost'),
    stock_quantity: formData.get('stock_quantity'),
    low_stock_threshold: formData.get('low_stock_threshold'),
    category: formData.get('category'),
    image_url: formData.get('image_url'),
  }

  const parsed = productSchema.safeParse(raw)
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { supabase, userId } = await getUserId()
  // RLS filtre automatiquement par user_id
  const { data: before } = await supabase.from('products').select('stock_quantity').eq('id', id).single()
  const { error } = await supabase.from('products').update(parsed.data).eq('id', id)

  if (error) return { error: { _root: [error.message] } }

  // Mouvement d'ajustement manuel si le stock a changé
  const newQty = parsed.data.stock_quantity
  if (before && typeof newQty === 'number' && newQty !== before.stock_quantity) {
    await supabase.from('stock_movements').insert({
      user_id: userId,
      product_id: id,
      delta: newQty - before.stock_quantity,
      reason: 'adjustment',
      balance_after: newQty,
    })
  }

  revalidatePath('/dashboard/stocks')
  return { success: true }
}

export async function deleteProduct(id: string) {
  const { supabase } = await getUserId()
  const { error } = await supabase.from('products').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/stocks')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function createVariant(parentId: string, formData: FormData) {
  const { supabase, userId } = await getUserId()

  const { data: parent } = await supabase
    .from('products')
    .select('id, name, category, parent_id')
    .eq('id', parentId)
    .single()
  if (!parent || parent.parent_id) return { error: { _root: ['Produit parent introuvable'] } }

  const sku = String(formData.get('sku') ?? '').trim()
  const price = Number(formData.get('price'))
  const stock = Number(formData.get('stock_quantity'))
  const threshold = Number(formData.get('low_stock_threshold'))
  const attrsRaw = String(formData.get('attributes') ?? '').trim()

  if (!sku) return { error: { sku: ['SKU requis'] } }
  if (!Number.isFinite(price) || price < 0) return { error: { price: ['Prix invalide'] } }

  const attrs: Record<string, string> = {}
  for (const part of attrsRaw.split(',')) {
    const idx = part.indexOf(':')
    if (idx === -1) continue
    const key = part.slice(0, idx).trim()
    const val = part.slice(idx + 1).trim()
    if (key && val) attrs[key] = val
  }

  const limit = await canCreate(supabase, userId, 'products')
  if (!limit.allowed) return { error: { _root: [limitMessage('products', limit)] } }

  const stockQ = Number.isFinite(stock) && stock >= 0 ? Math.round(stock) : 0
  const { data: created, error } = await supabase
    .from('products')
    .insert({
      user_id: userId,
      parent_id: parentId,
      name: parent.name,
      sku,
      price,
      cost: 0,
      stock_quantity: stockQ,
      low_stock_threshold: Number.isFinite(threshold) && threshold >= 0 ? Math.round(threshold) : 5,
      category: parent.category,
      variant_attributes: Object.keys(attrs).length ? attrs : null,
    })
    .select('id')
    .single()
  if (error) return { error: { _root: [error.message] } }

  if (created && stockQ > 0) {
    await supabase.from('stock_movements').insert({
      user_id: userId, product_id: created.id, delta: stockQ, reason: 'initial', balance_after: stockQ,
    })
  }

  revalidatePath('/dashboard/stocks')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateVariant(id: string, formData: FormData) {
  const { supabase, userId } = await getUserId()

  const price = Number(formData.get('price'))
  const stock = Number(formData.get('stock_quantity'))
  const threshold = Number(formData.get('low_stock_threshold'))
  const attrsRaw = String(formData.get('attributes') ?? '').trim()

  const attrs: Record<string, string> = {}
  for (const part of attrsRaw.split(',')) {
    const idx = part.indexOf(':')
    if (idx === -1) continue
    const key = part.slice(0, idx).trim()
    const val = part.slice(idx + 1).trim()
    if (key && val) attrs[key] = val
  }

  const { data: before } = await supabase
    .from('products')
    .select('stock_quantity, price, low_stock_threshold')
    .eq('id', id)
    .single()

  const stockQ = Number.isFinite(stock) && stock >= 0 ? Math.round(stock) : (before?.stock_quantity ?? 0)

  const { error } = await supabase.from('products').update({
    price: Number.isFinite(price) && price >= 0 ? price : (before?.price ?? 0),
    stock_quantity: stockQ,
    low_stock_threshold: Number.isFinite(threshold) && threshold >= 0 ? Math.round(threshold) : (before?.low_stock_threshold ?? 5),
    variant_attributes: Object.keys(attrs).length ? attrs : null,
  }).eq('id', id)
  if (error) return { error: { _root: [error.message] } }

  if (before && stockQ !== before.stock_quantity) {
    await supabase.from('stock_movements').insert({
      user_id: userId, product_id: id, delta: stockQ - before.stock_quantity, reason: 'adjustment', balance_after: stockQ,
    })
  }

  revalidatePath('/dashboard/stocks')
  revalidatePath('/dashboard')
  return { success: true }
}

// ── Import CSV ─────────────────────────────────────────────────────────────────

type CsvRow = {
  name: string; sku: string; description?: string
  price: number; stock_quantity: number; low_stock_threshold?: number
  category?: string; image_url?: string
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) throw new Error('Le fichier CSV est vide ou ne contient que des en-têtes.')
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/"/g, ''))

  const required = ['name', 'sku', 'price', 'stock_quantity']
  for (const col of required) {
    if (!headers.includes(col)) throw new Error(`Colonne manquante : "${col}"`)
  }

  return lines.slice(1).map((line, i) => {
    const values: string[] = []
    let current = ''
    let inQuotes = false
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes }
      else if (ch === ',' && !inQuotes) { values.push(current); current = '' }
      else { current += ch }
    }
    values.push(current)

    const row: Record<string, string> = {}
    headers.forEach((h, idx) => { row[h] = (values[idx] ?? '').trim() })

    if (!row.name) throw new Error(`Ligne ${i + 2} : le champ "name" est requis.`)
    if (!row.sku)  throw new Error(`Ligne ${i + 2} : le champ "sku" est requis.`)

    const price = parseFloat(row.price)
    const qty   = parseInt(row.stock_quantity, 10)
    if (isNaN(price)) throw new Error(`Ligne ${i + 2} : "price" invalide (${row.price})`)
    if (isNaN(qty))   throw new Error(`Ligne ${i + 2} : "stock_quantity" invalide (${row.stock_quantity})`)

    return {
      name: row.name,
      sku: row.sku,
      description: row.description || undefined,
      price,
      stock_quantity: qty,
      low_stock_threshold: row.low_stock_threshold ? parseInt(row.low_stock_threshold, 10) || undefined : undefined,
      category: row.category || undefined,
      image_url: row.image_url || undefined,
    } satisfies CsvRow
  })
}

export async function importProductsCsv(formData: FormData) {
  const file = formData.get('file') as File | null
  if (!file) return { error: 'Aucun fichier fourni.' }

  const text = await file.text()
  let rows: CsvRow[]
  try {
    rows = parseCsv(text)
  } catch (e) {
    return { error: (e as Error).message }
  }

  if (!rows.length) return { error: 'Aucune ligne à importer.' }

  const { supabase, userId } = await getUserId()

  // Enforcement : refuse l'import s'il fait dépasser la limite du plan.
  // Estimation prudente : on compte chaque ligne comme un nouveau produit
  // (les SKU déjà existants seront en réalité des mises à jour).
  const limit = await canCreate(supabase, userId, 'products', rows.length)
  if (!limit.allowed) {
    const cap = limit.remaining ?? 0
    return {
      error: `${limitMessage('products', limit)} (${rows.length} lignes à importer, ${cap} emplacement(s) restant(s)).`,
    }
  }

  const rowsWithUser = rows.map((r) => ({ ...r, user_id: userId }))

  const { error, count } = await supabase
    .from('products')
    .upsert(rowsWithUser, { onConflict: 'user_id,sku', ignoreDuplicates: false })
    .select('id')

  if (error) return { error: error.message }

  revalidatePath('/dashboard/stocks')
  revalidatePath('/dashboard')
  return { success: true, count: count ?? rows.length, total: rows.length }
}
