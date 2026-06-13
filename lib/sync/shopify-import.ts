// ============================================================
// Import initial du catalogue Shopify : tire tous les produits via l'API
// Admin (REST, paginée) et les fait passer par le MÊME upsert que les webhooks
// (external_source='shopify', external_id=id Shopify) => idempotent, zéro doublon.
// ============================================================
import { getServiceClient, upsertProduct } from './core'
import type { NormalizedProduct } from './types'

const API_VERSION = '2024-07'

type ShVariant = { sku?: string; price?: string; inventory_quantity?: number }
type ShProduct = {
  id: number
  title?: string
  product_type?: string
  variants?: ShVariant[]
  image?: { src?: string }
  images?: { src?: string }[]
}

function normalizeDomain(d: string): string {
  return d.replace(/^https?:\/\//, '').replace(/\/+$/, '').trim()
}

function nextPageInfo(linkHeader: string | null): string | null {
  if (!linkHeader) return null
  for (const part of linkHeader.split(',')) {
    const m = part.match(/<([^>]+)>;\s*rel="next"/)
    if (m) {
      try {
        return new URL(m[1]).searchParams.get('page_info')
      } catch {
        return null
      }
    }
  }
  return null
}

function mapProduct(p: ShProduct): NormalizedProduct {
  const v = p.variants && p.variants.length > 0 ? p.variants[0] : undefined
  const img = p.image?.src || (p.images && p.images.length > 0 ? p.images[0].src : undefined)
  return {
    externalId: String(p.id),
    name: p.title || `Produit ${p.id}`,
    sku: v?.sku && String(v.sku).trim() ? String(v.sku).trim() : null,
    price: parseFloat(v?.price || '0') || 0,
    stockQuantity: v?.inventory_quantity != null ? v.inventory_quantity : null,
    category: p.product_type || undefined,
    imageUrl: img || undefined,
  }
}

export type ShopifyImportResult = {
  created: number
  updated: number
  total: number
  error?: string
}

export async function importShopifyProducts(opts: {
  userId: string
  storeId: string
  domain: string
  accessToken: string
}): Promise<ShopifyImportResult> {
  const domain = normalizeDomain(opts.domain)
  if (!domain) return { created: 0, updated: 0, total: 0, error: 'Domaine Shopify manquant' }

  const supabase = getServiceClient()
  const base = `https://${domain}/admin/api/${API_VERSION}/products.json`
  let created = 0
  let updated = 0
  let total = 0
  let pageInfo: string | null = null

  for (let guard = 0; guard < 500; guard++) {
    const url = pageInfo
      ? `${base}?limit=250&page_info=${encodeURIComponent(pageInfo)}`
      : `${base}?limit=250`
    let res: Response
    try {
      res = await fetch(url, {
        headers: {
          'X-Shopify-Access-Token': opts.accessToken,
          'Content-Type': 'application/json',
        },
      })
    } catch (e) {
      return { created, updated, total, error: `Connexion Shopify échouée : ${e instanceof Error ? e.message : String(e)}` }
    }
    if (!res.ok) {
      const txt = await res.text().catch(() => '')
      return { created, updated, total, error: `Shopify a répondu ${res.status}. ${txt.slice(0, 160)}` }
    }
    const json = (await res.json()) as { products?: ShProduct[] }
    const products = json.products ?? []
    for (const p of products) {
      const r = await upsertProduct(supabase, opts.userId, 'shopify', mapProduct(p), opts.storeId)
      total++
      if (r === 'created') created++
      else if (r === 'updated') updated++
    }
    pageInfo = nextPageInfo(res.headers.get('link'))
    if (!pageInfo) break
  }

  return { created, updated, total }
}
