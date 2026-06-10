import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'
import { PLANS, type PlanId } from '@/lib/plans'

export async function POST(req: Request) {
  const { plan } = (await req.json()) as { plan: PlanId }
  const def = PLANS[plan]
  if (!def || !def.priceEnv) {
    return NextResponse.json({ error: 'Plan invalide' }, { status: 400 })
  }
  const priceId = process.env[def.priceEnv]
  if (!priceId) {
    return NextResponse.json({ error: `Stripe non configuré (${def.priceEnv} manquant). Ajoutez l'ID de prix dans Vercel.` }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(req.url).origin
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: user.email ?? undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: { user_id: user.id, plan },
    subscription_data: { metadata: { user_id: user.id, plan } },
    success_url: `${appUrl}/dashboard/billing?success=1`,
    cancel_url: `${appUrl}/dashboard/billing?canceled=1`,
  })
  return NextResponse.json({ url: session.url })
}
