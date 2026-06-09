import { createHmac, timingSafeEqual } from 'crypto'

// ── Types payload WooCommerce ─────────────────────────────────────────────

export interface WcBilling {
  first_name: string
  last_name:  string
  email:      string
  phone:      string
  address_1:  string
  address_2?: string
  city:       string
  state?:     string
  postcode?:  string
  country:    string
}

export interface WcLineItem {
  id:         number
  product_id: number
  name:       string
  sku:        string
  quantity:   number
  price:      string   // string dans l'API WC
  total:      string
}

export interface WcOrderPayload {
  id:             number
  status:         string
  billing:        WcBilling
  line_items:     WcLineItem[]
  total:          string
  customer_note?: string
  date_created:   string
}

export interface WcProductPayload {
  id:             number
  name:           string
  sku:            string
  price:          string
  regular_price:  string
  stock_quantity: number | null
  manage_stock:   boolean
  status:         string
  categories?:    { name: string }[]
  images?:        { src: string }[]
}

// ── Mapping statut WooCommerce → StockFlow ────────────────────────────────

const STATUS_MAP: Record<string, string> = {
  'pending':    'pending',
  'on-hold':    'pending',
  'processing': 'confirmed',
  'completed':  'delivered',
  'cancelled':  'cancelled',
  'refunded':   'cancelled',
  'failed':     'cancelled',
}

export function mapWcStatus(wcStatus: string): string {
  return STATUS_MAP[wcStatus] ?? 'pending'
}

// ── Extraire les infos client depuis billing ──────────────────────────────

export function mapWcCustomer(billing: WcBilling) {
  return {
    full_name: `${billing.first_name} ${billing.last_name}`.trim(),
    email:     billing.email,
    phone:     billing.phone || undefined,
    address:   [billing.address_1, billing.address_2].filter(Boolean).join(', ') || undefined,
    city:      billing.city || undefined,
    country:   billing.country || undefined,
  }
}

// ── Mapper les lignes de commande ─────────────────────────────────────────

export function mapWcItems(lineItems: WcLineItem[]) {
  return lineItems.map((item) => ({
    sku:        item.sku,
    name:       item.name,
    quantity:   item.quantity,
    unit_price: parseFloat(item.price) || 0,
    total:      parseFloat(item.total) || 0,
    wc_product_id: item.product_id,
  }))
}

// ── Vérifier la signature HMAC-SHA256 de WooCommerce ─────────────────────
// WC envoie : X-WC-Webhook-Signature: base64(HMAC-SHA256(rawBody, secret))

export function verifyWcSignature(
  rawBody: Buffer,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false
  try {
    const expected = createHmac('sha256', secret)
      .update(rawBody)
      .digest('base64')
    const a = Buffer.from(signature)
    const b = Buffer.from(expected)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

// ── Topic helpers ─────────────────────────────────────────────────────────

export type WcTopic =
  | 'order.created'
  | 'order.updated'
  | 'order.deleted'
  | 'product.created'
  | 'product.updated'
  | 'customer.created'
  | string

export function parseWcTopic(header: string | null): WcTopic {
  return (header ?? 'unknown') as WcTopic
}
