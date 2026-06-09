/**
 * Webhook Shopify — fine couche au-dessus du cœur de synchro.
 * URL : https://<app>/api/webhooks/shopify?api_key=sf_live_xxx
 * Topics : orders/create, orders/updated, products/create, products/update,
 *          products/delete, orders/cancelled.
 */
import { NextRequest, NextResponse } from 'next/server'
import { handleSyncWebhook } from '@/lib/sync/webhook-handler'
import { shopifyAdapter } from '@/lib/sync/adapters/shopify'

export async function POST(req: NextRequest) {
  return handleSyncWebhook(req, shopifyAdapter)
}

export async function GET() {
  return NextResponse.json({ message: 'Shopify webhook endpoint OK' })
}
