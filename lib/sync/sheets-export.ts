// ============================================================
// Export StockFlow → Google Sheets. Écrit le catalogue (en-têtes + lignes)
// dans l'onglet ciblé. Nécessite que le compte de service ait l'accès ÉDITION
// au Sheet (le marchand le partage en "Éditeur").
// ============================================================
import { getServiceClient } from './core'
import { getGoogleAccessToken, extractSpreadsheetId, SheetsAuthError } from '@/lib/google/sheets-auth'

const HEADER = ['name', 'sku', 'price', 'stock_quantity', 'category', 'image_url']

export type SheetsExportResult = { count: number; error?: string }

export async function exportProductsToSheet(opts: {
  userId: string
  spreadsheet: string
  tab?: string | null
}): Promise<SheetsExportResult> {
  const id = extractSpreadsheetId(opts.spreadsheet)
  if (!id) return { count: 0, error: 'URL ou ID de Google Sheet invalide.' }

  let token: string
  try {
    token = await getGoogleAccessToken()
  } catch (e) {
    return { count: 0, error: e instanceof SheetsAuthError ? e.message : 'Authentification Google échouée.' }
  }

  const supabase = getServiceClient()
  const { data: products, error } = await supabase
    .from('products')
    .select('name, sku, price, stock_quantity, category, image_url')
    .eq('user_id', opts.userId)
    .order('name', { ascending: true })
  if (error) return { count: 0, error: error.message }

  const rows = (products ?? []).map((p) => [
    p.name ?? '',
    p.sku ?? '',
    p.price != null ? String(p.price) : '0',
    p.stock_quantity != null ? String(p.stock_quantity) : '0',
    p.category ?? '',
    p.image_url ?? '',
  ])
  const values = [HEADER, ...rows]

  const tab = opts.tab && opts.tab.trim() ? opts.tab.trim() : null
  const clearRange = encodeURIComponent(tab ?? 'A:Z')
  const writeRange = encodeURIComponent(tab ? `${tab}!A1` : 'A1')

  // 1) Vider l'ancien contenu
  const clearRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${clearRange}:clear`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: '{}' }
  )
  if (!clearRes.ok) {
    const txt = await clearRes.text().catch(() => '')
    const hint = clearRes.status === 403 ? " Partagez le Sheet en Éditeur avec le compte de service." : ''
    return { count: 0, error: `Écriture impossible (${clearRes.status}).${hint} ${txt.slice(0, 120)}` }
  }

  // 2) Écrire les nouvelles valeurs
  const writeRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${writeRange}?valueInputOption=RAW`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values }),
    }
  )
  if (!writeRes.ok) {
    const txt = await writeRes.text().catch(() => '')
    return { count: 0, error: `Écriture impossible (${writeRes.status}). ${txt.slice(0, 120)}` }
  }

  return { count: rows.length }
}
