// ============================================================
// Import Google Sheets → StockFlow. Lit les lignes d'un onglet, mappe les
// colonnes (en-têtes flexibles FR/EN) et upsert via le MÊME pipeline que les
// webhooks (external_source='google_sheets', external_id=SKU) => idempotent.
// ============================================================
import { getServiceClient, upsertProduct } from './core'
import type { NormalizedProduct } from './types'
import { getGoogleAccessToken, extractSpreadsheetId, SheetsAuthError } from '@/lib/google/sheets-auth'

const SYN: Record<string, string[]> = {
  name: ['name', 'nom', 'produit', 'title', 'titre', 'libelle', 'libellé', 'designation', 'désignation'],
  sku: ['sku', 'ref', 'reference', 'référence', 'code', 'code produit', 'code_produit'],
  price: ['price', 'prix', 'tarif', 'prix ttc', 'prix_ttc', 'pu'],
  stock_quantity: ['stock', 'stock_quantity', 'quantity', 'quantite', 'quantité', 'qty', 'qte', 'qté'],
  category: ['category', 'categorie', 'catégorie', 'type', 'famille'],
  image_url: ['image', 'image_url', 'photo', 'url image', 'image url', 'visuel'],
}

function norm(s: string): string {
  return s.trim().toLowerCase()
}

function buildHeaderMap(header: string[]): Record<string, number> {
  const map: Record<string, number> = {}
  header.forEach((h, i) => {
    const hn = norm(h)
    for (const field of Object.keys(SYN)) {
      if (map[field] === undefined && SYN[field].includes(hn)) map[field] = i
    }
  })
  return map
}

function num(v: unknown): number {
  if (v == null) return 0
  const s = String(v).replace(/[^\d.,-]/g, '').replace(',', '.')
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : 0
}

export type SheetsImportResult = {
  created: number
  updated: number
  skipped: number
  total: number
  error?: string
}

export async function importSheetProducts(opts: {
  userId: string
  storeId: string
  spreadsheet: string
  tab?: string | null
}): Promise<SheetsImportResult> {
  const id = extractSpreadsheetId(opts.spreadsheet)
  if (!id) return { created: 0, updated: 0, skipped: 0, total: 0, error: 'URL ou ID de Google Sheet invalide.' }

  let token: string
  try {
    token = await getGoogleAccessToken()
  } catch (e) {
    return { created: 0, updated: 0, skipped: 0, total: 0, error: e instanceof SheetsAuthError ? e.message : 'Authentification Google échouée.' }
  }

  const range = opts.tab && opts.tab.trim() ? encodeURIComponent(opts.tab.trim()) : encodeURIComponent('A:Z')
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${range}?majorDimension=ROWS`
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    const hint = res.status === 403 ? " Partagez le Sheet avec l'e-mail du compte de service." : ''
    return { created: 0, updated: 0, skipped: 0, total: 0, error: `Lecture du Sheet impossible (${res.status}).${hint} ${txt.slice(0, 120)}` }
  }
  const json = (await res.json()) as { values?: string[][] }
  const rows = json.values ?? []
  if (rows.length < 2) return { created: 0, updated: 0, skipped: 0, total: 0, error: 'Le Sheet est vide ou ne contient pas de ligne de données.' }

  const headerMap = buildHeaderMap(rows[0])
  if (headerMap.name === undefined || headerMap.sku === undefined) {
    return { created: 0, updated: 0, skipped: 0, total: 0, error: "Colonnes 'name'/'nom' et 'sku' requises dans la première ligne." }
  }

  const supabase = getServiceClient()
  let created = 0, updated = 0, skipped = 0, total = 0

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]
    const get = (k: string) => (headerMap[k] !== undefined ? row[headerMap[k]] : undefined)
    const sku = (get('sku') ?? '').toString().trim()
    const name = (get('name') ?? '').toString().trim()
    if (!sku || !name) { skipped++; continue }

    const np: NormalizedProduct = {
      externalId: sku,
      name,
      sku,
      price: num(get('price')),
      stockQuantity: headerMap.stock_quantity !== undefined ? num(get('stock_quantity')) : null,
      category: get('category') ? String(get('category')).trim() : undefined,
      imageUrl: get('image_url') ? String(get('image_url')).trim() : undefined,
    }
    const out = await upsertProduct(supabase, opts.userId, 'google_sheets', np, opts.storeId)
    total++
    if (out === 'created') created++
    else if (out === 'updated') updated++
  }

  return { created, updated, skipped, total }
}
