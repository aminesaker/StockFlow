// ============================================================
// Adaptateur Shopify : mappe les webhooks Shopify vers le modèle
// normalisé. Signature : header X-Shopify-Hmac-Sha256 = base64(HMAC-SHA256).
// Topic : header X-Shopify-Topic (ex: "orders/create", "products/update").
// ============================================================
import { createHmac, timingSafeEqual } from 'crypto'
import type {
  NormalizedCustomer,
  NormalizedOrder,
  NormalizedProduct,
  OrderStatus,
  PlatformAdapter,
  SyncAction,
} from '../types'

type ShVariant = { sku?: string; price?: string; inventory_quantity?: number }
type ShProduct = {
  id: number; title?: string; product_type?: string; status?: string
  variants?: ShVariant[]; image?: { src?: string }; images?: { src?: string }[]
}
type ShAddress = { address1?: string; address2?: string; city?: string; country?: string; phone?: string }
type ShLineItem = { sku?: string; title?: string; name?: string; quantity?: number; price?: string }
type ShOrder = {
  id: number; name?: string; financial_status?: string; fulfillment_status?: string | null
  cancelled_at?: string | null; note?: string
  customer?: { first_name?: string; last_name?: string; email?: string; phone?: string }
  email?: string; billing_address?: ShAddress; line_items?: ShLineItem[]
}

function mapStatus(o: ShOrder): OrderStatus {
  const fin = o.financial_status || ''
  if (o.cancelled_at || fin === 'refunded' || fin === 'voided') return 'cancelled'
  if (o.fulfillment_status === 'fulfilled') return 'delivered'
  if (o.fulfillment_status === 'partial') return 'shipped'
  if (fin === 'paid') return 'confirmed'
  return 'pending'
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

function mapOrder(o: ShOrder): NormalizedOrder {
  const c = o.customer || {}
  const b = o.billing_address || {}
  const email = c.email || o.email || ''
  return {
    externalId: String(o.id),
    status: mapStatus(o),
    customer: {
      fullName: `${c.first_name || ''} ${c.last_name || ''}`.trim() || email || 'Client',
      email,
      phone: c.phone || b.phone || undefined,
      address: [b.address1, b.address2].filter(Boolean).join(', ') || undefined,
      city: b.city || undefined,
      country: b.country || undefined,
    },
    items: (o.line_items || []).map((it) => ({
      sku: it.sku && String(it.sku).trim() ? String(it.sku).trim() : null,
      name: it.title || it.name || '',
      quantity: it.quantity || 0,
      unitPrice: parseFloat(it.price || '0') || 0,
    })),
    note: o.note || undefined,
  }
}

type ShCustomer = {
  id?: number; first_name?: string; last_name?: string; email?: string; phone?: string
  default_address?: ShAddress
}

function mapCustomer(c: ShCustomer): NormalizedCustomer {
  const a = c.default_address || {}
  return {
    fullName: `${c.first_name || ''} ${c.last_name || ''}`.trim() || (c.email || 'Client'),
    email: c.email || '',
    phone: c.phone || a.phone || undefined,
    address: [a.address1, a.address2].filter(Boolean).join(', ') || undefined,
    city: a.city || undefined,
    country: a.country || undefined,
  }
}

export const shopifyAdapter: PlatformAdapter = {
  source: 'shopify',

  verifySignature(rawBody, headers, secret) {
    if (!secret) return true
    const signature = headers.get('x-shopify-hmac-sha256')
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
    const topic = headers.get('x-shopify-topic') || ''

    if (topic === 'products/create' || topic === 'products/update') {
      const p = payload as ShProduct
      if (p.status === 'archived') return { kind: 'ignore', reason: 'product archived' }
      return { kind: 'product.upsert', product: mapProduct(p) }
    }
    if (topic === 'products/delete') {
      const p = payload as Partial<ShProduct>
      return { kind: 'product.delete', externalId: p.id != null ? String(p.id) : undefined }
    }
    if (topic === 'orders/create') return { kind: 'order.created', order: mapOrder(payload as ShOrder) }
    if (
      topic === 'orders/updated' || topic === 'orders/cancelled' ||
      topic === 'orders/fulfilled' || topic === 'orders/paid' ||
      topic === 'orders/partially_fulfilled'
    ) {
      return { kind: 'order.updated', order: mapOrder(payload as ShOrder) }
    }

    if (topic === 'customers/create' || topic === 'customers/update') {
      return { kind: 'customer.upsert', customer: mapCustomer(payload as ShCustomer) }
    }
    if (topic === 'orders/delete') {
      const o = payload as Partial<ShOrder>
      return o.id != null
        ? { kind: 'order.deleted', externalId: String(o.id) }
        : { kind: 'ignore', reason: 'orders/delete sans id' }
    }

    return { kind: 'ignore', reason: `topic ${topic}` }
  },
}
