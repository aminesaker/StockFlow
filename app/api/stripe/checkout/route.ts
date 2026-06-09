import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { invoiceId } = await req.json()

  if (!invoiceId) {
    return NextResponse.json({ error: 'invoiceId requis' }, { status: 400 })
  }

  const supabase = await createClient()

  // Récupère la facture + client
  const { data: invoice, error } = await supabase
    .from('invoices')
    .select('*, customer:customers(full_name, email)')
    .eq('id', invoiceId)
    .single()

  if (error || !invoice) {
    return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
  }

  if (invoice.status === 'paid') {
    return NextResponse.json({ error: 'Cette facture est déjà payée' }, { status: 400 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const customer = invoice.customer as { full_name: string; email: string }

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: customer.email,
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Facture ${invoice.invoice_number}`,
            description: `Paiement pour ${customer.full_name}`,
          },
          unit_amount: Math.round(invoice.amount * 100), // centimes
        },
        quantity: 1,
      },
    ],
    metadata: {
      invoice_id: invoiceId,
      invoice_number: invoice.invoice_number,
    },
    success_url: `${appUrl}/payment/success?invoice=${invoice.invoice_number}`,
    cancel_url: `${appUrl}/payment/cancel?invoice=${invoice.invoice_number}`,
  })

  return NextResponse.json({ url: session.url })
}
