import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

// Nécessaire : désactiver le body parsing de Next.js pour vérifier la signature Stripe
export const runtime = 'nodejs'

export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const sig = headersList.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
  }

  let event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Signature invalide'
    console.error('[Webhook] Erreur signature:', message)
    return NextResponse.json({ error: `Webhook error: ${message}` }, { status: 400 })
  }

  // ── Gestion des événements ──────────────────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object

    // Récupère l'invoice_id depuis les metadata
    const invoiceId = session.metadata?.invoice_id
    if (!invoiceId) {
      console.error('[Webhook] invoice_id manquant dans les metadata')
      return NextResponse.json({ error: 'invoice_id manquant' }, { status: 400 })
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        stripe_payment_intent_id: session.payment_intent as string,
      })
      .eq('id', invoiceId)

    if (error) {
      console.error('[Webhook] Erreur mise à jour facture:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`[Webhook] Facture ${invoiceId} marquée payée ✓`)
  }

  // Ignorer silencieusement les autres événements
  return NextResponse.json({ received: true })
}
