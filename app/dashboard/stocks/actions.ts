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

  const { error } = await supabase.from('products').insert({ ...parsed.data, user_id: userId })

  if (error) return { error: { _root: [error.message] } }

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

  const { supabase } = await getUserId()
  // RLS filtre automatiquement par user_id
  const { error } = await supabase.from('products').update(parsed.data).eq('id', id)

  if (error) return { error: { _root: [error.message] } }

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
    .upsert(rowsWithUser, { onConflict: 'sku', ignoreDuplicates: false })
    .select('id')

  if (error) return { error: error.message }

  revalidatePath('/dashboard/stocks')
  revalidatePath('/dashboard')
  return { success: true, count: count ?? rows.length, total: rows.length }
}
