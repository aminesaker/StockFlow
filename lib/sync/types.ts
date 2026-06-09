// ============================================================
// Modèle de synchronisation NORMALISÉ (indépendant de la plateforme)
// Chaque adaptateur (WooCommerce, Shopify, …) mappe son payload vers
// ces types, puis le cœur (core.ts) applique la logique métier.
// ============================================================

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'

export type NormalizedCustomer = {
  fullName: string
  email: string
  phone?: string
  address?: string
  city?: string
  country?: string
}

export type NormalizedLineItem = {
  sku: string | null
  name: string
  quantity: number
  unitPrice: number
}

export type NormalizedProduct = {
  externalId: string
  name: string
  sku: string | null
  price: number
  stockQuantity: number | null // null = stock non géré côté plateforme
  category?: string | null
  imageUrl?: string | null
}

export type NormalizedOrder = {
  externalId: string
  status: OrderStatus
  customer: NormalizedCustomer
  items: NormalizedLineItem[]
  note?: string
}

// Ce qu'un adaptateur produit à partir d'une requête webhook brute.
export type SyncAction =
  | { kind: 'product.upsert'; product: NormalizedProduct }
  | { kind: 'product.delete'; externalId?: string; sku?: string | null }
  | { kind: 'order.created'; order: NormalizedOrder }
  | { kind: 'order.updated'; order: NormalizedOrder }
  | { kind: 'ignore'; reason: string }
  | { kind: 'ping' }

export type SyncSettings = {
  auto_invoice?: boolean
  stock_alerts?: boolean
} | null

// Interface commune à tous les adaptateurs de plateforme.
export interface PlatformAdapter {
  readonly source: string
  // Vérifie la signature ; renvoie false si invalide. Si secret absent → true.
  verifySignature(rawBody: Buffer, headers: Headers, secret: string | null): boolean
  // Transforme la requête webhook en action normalisée.
  parse(headers: Headers, payload: unknown): SyncAction
}
