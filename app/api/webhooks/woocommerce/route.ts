/**
 * Webhook WooCommerce — fine couche au-dessus du cœur de synchro.
 * URL : https://<app>/api/webhooks/woocommerce?api_key=sf_live_xxx
 * Topics : Order created/updated, Product created/updated/deleted.
 */
import { NextRequest, NextResponse } from 'next/server'
import { handleSyncWebhook } from '@/lib/sync/webhook-handler'
import { woocommerceAdapter } from '@/lib/sync/adapters/woocommerce'

export async function POST(req: NextRequest) {
  return handleSyncWebhook(req, woocommerceAdapter)
}

export async function GET() {
  return NextResponse.json({ message: 'WooCommerce webhook endpoint OK' })
}
