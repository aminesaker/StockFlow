import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getBillingProfile } from '@/lib/billing/profile'
import InvoicePDF from '@/components/invoices/InvoicePDF'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  let locale: 'fr' | 'en' = 'fr'
  if (user) {
    const { data: settings } = await supabase
      .from('user_settings')
      .select('locale')
      .eq('user_id', user.id)
      .maybeSingle()
    if (settings?.locale === 'en') locale = 'en'
  }

  const { data: invoice, error } = await supabase
    .from('invoices')
    .select(`
      *,
      customer:customers (*),
      order:orders (
        id,
        items:order_items (
          quantity,
          unit_price,
          total_price,
          product:products (name, sku)
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !invoice) {
    const msg = locale === 'en' ? 'Invoice not found' : 'Facture introuvable'
    return NextResponse.json({ error: msg }, { status: 404 })
  }

  const seller = invoice.user_id ? await getBillingProfile(supabase, invoice.user_id) : null

  const buffer = await renderToBuffer(
    createElement(InvoicePDF as any, { data: invoice, locale, seller }) as any
  )
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoice_number}.pdf"`,
    },
  })
}
