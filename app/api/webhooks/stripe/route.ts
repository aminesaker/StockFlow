import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import type Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createClient as createServiceClient } from '@supabase/supabase-js'

// Récupère la date de fin de période — dans l'API récente elle est portée par
// l'item d'abonnement, plus par la souscription elle-même.
function periodEndIso(sub: Stripe.Subscription): string | null {
  const top = (sub as { current_period_end?: number }).current_period_end
  const item = (sub.items?.data?.[0] as { current_period_end?: number } | undefined)?.current_period_end
  const ts = top ?? item
  return ts ? new Date(ts * 1000).toISOString() : null
}

export const runtime = 'nodejs'

function svc() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: Request) {
  const body = await req.text()
  const sig = (await headers()).get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Signature invalide'
    console.error('[stripe] signature:', message)
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const md = session.metadata ?? {}

    // 1) Paiement d'une facture (one-off)
    if (md.invoice_id) {
      const { error } = await svc().from('invoices').update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        stripe_payment_intent_id: session.payment_intent as string,
      }).eq('id', md.invoice_id)
      if (error) console.error('[stripe] facture:', error.message)
    }
    // 2) Souscription d'un abonnement
    else if (md.user_id && md.plan) {
      let currentPeriodEnd: string | null = null
      if (session.subscription) {
        try {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string)
          currentPeriodEnd = periodEndIso(sub)
        } catch (e) {
          console.error('[stripe] retrieve sub:', e instanceof Error ? e.message : e)
        }
      }
      const { error } = await svc().from('user_subscriptions').upsert({
        user_id: md.user_id,
        plan: md.plan,
        status: 'active',
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        current_period_end: currentPeriodEnd,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      if (error) console.error('[stripe] abonnement:', error.message)
    }
  } else if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const userId = sub.metadata?.user_id
    if (userId) {
      const canceled = event.type === 'customer.subscription.deleted' || sub.status === 'canceled'
      const { error } = await svc().from('user_subscriptions').upsert({
        user_id: userId,
        ...(sub.metadata?.plan ? { plan: sub.metadata.plan } : {}),
        status: canceled ? 'canceled' : sub.status,
        stripe_subscription_id: sub.id,
        current_period_end: periodEndIso(sub),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      if (error) console.error('[stripe] maj abonnement:', error.message)
    }
  }

  return NextResponse.json({ received: true })
}
