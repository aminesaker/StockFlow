// ============================================================
// Adaptateur WooCommerce : mappe les webhooks WooCommerce vers le
// modèle normalisé (types.ts). Aucune logique métier ici.
// ============================================================
import { createHmac, timingSafeEqual } from 'crypto'
import type {
  NormalizedOrder,
  NormalizedProduct,
  OrderStatus,
  PlatformAdapter,
  SyncAction,
} from '../types'

const STATUS_MAP: Record<string, OrderStatus> = {
  pending: 'pending',
  'on-hold': 'pending',
  processing: 'confirmed',
  completed: 'delivered',
  cancelled: 'cancelled',
  refunded: 'cancelled',
  failed: 'cancelled',
}

type WcBilling = {
  first_name?: string; last_name?: string; email?: string; phone?: string
  address_1?: string; address_2?: string; city?: string; country?: string
}
type WcLineItem = { name?: string; sku?: string; quantity?: number; price?: string }
type WcOrder = { id: number; status?: string; billing?: WcBilling; line_items?: WcLineItem[]; customer_note?: string }
type WcProduct = {
  id: number; name?: string; sku?: string; price?: string; regular_price?: string
  stock_quantity?: number | null; manage_stock?: boolean; status?: string
  categories?: { name?: string }[]; images?: { src?: string }[]
}

function mapProduct(p: WcProduct): NormalizedProduct {
  const cats = p.categories
  const imgs = p.images
  return {
    externalId: String(p.id),
    name: p.name || `Produit ${p.id}`,
    sku: p.sku && String(p.sku).trim() ? String(p.sku).trim() : null,
    price: parseFloat(p.price || p.regular_price || '0') || 0,
    // WooCommerce : 999 = "en stock, non suivi" quand manage_stock est faux.
    stockQuantity: p.manage_stock ? (p.stock_quantity != null ? p.stock_quantity : 0) : 999,
    category: cats && cats.length > 0 ? cats[0].name : undefined,
    imageUrl: imgs && imgs.length > 0 ? imgs[0].src : undefined,
  }
}

function mapOrder(o: WcOrder): NormalizedOrder {
  const b = o.billing || {}
  return {
    externalId: String(o.id),
    status: STATUS_MAP[o.status || ''] ?? 'pending',
    customer: {
      fullName: `${b.first_name || ''} ${b.last_name || ''}`.trim() || (b.email || 'Client'),
      email: b.email || '',
      phone: b.phone || undefined,
      address: [b.address_1, b.address_2].filter(Boolean).join(', ') || undefined,
      city: b.city || undefined,
      country: b.country || undefined,
    },
    items: (o.line_items || []).map((it) => ({
      sku: it.sku && String(it.sku).trim() ? String(it.sku).trim() : null,
      name: it.name || '',
      quantity: it.quantity || 0,
      unitPrice: parseFloat(it.price || '0') || 0,
    })),
    note: o.customer_note || undefined,
  }
}

export const woocommerceAdapter: PlatformAdapter = {
  source: 'woocommerce',

  verifySignature(rawBody, headers, secret) {
    if (!secret) return true // signature optionnelle si pas de secret configuré
    const signature = headers.get('x-wc-webhook-signature')
    if (!signature) return false
    try {
      const expected = createHmac('sha256', secret).update(rawBody).digest('base64')
      const a = Buffer.from(signature)
      const b = Buffer.from(expected)
      if (a.length !== b.length) return false
      return timingSafeEqual(a, b)
    } catch {
      return false
    }
  },

  parse(headers, payload): SyncAction {
    const topic = headers.get('x-wc-webhook-topic') || ''
    const p = payload as Record<string, unknown>

    // Ping de validation WooCommerce
    if (p && p.webhook_id && !p.id) return { kind: 'ping' }

    if (topic === 'order.created') return { kind: 'order.created', order: mapOrder(payload as WcOrder) }
    if (topic === 'order.updated') return { kind: 'order.updated', order: mapOrder(payload as WcOrder) }

    if (topic === 'product.created' || topic === 'product.updated') {
      const wc = payload as WcProduct
      if (wc.status === 'trash') return { kind: 'ignore', reason: 'product trash' }
      return { kind: 'product.upsert', product: mapProduct(wc) }
    }

    if (topic === 'product.deleted') {
      const wc = payload as Partial<WcProduct>
      return { kind: 'product.delete', externalId: wc.id != null ? String(wc.id) : undefined, sku: wc.sku || null }
    }

    return { kind: 'ignore', reason: `topic ${topic}` }
  },
}
