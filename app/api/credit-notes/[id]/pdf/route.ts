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

  const { data: credit, error } = await supabase
    .from('credit_notes')
    .select(`
      *,
      customer:customers (*),
      invoice:invoices (
        invoice_number,
        order:orders (
          id,
          items:order_items (
            quantity,
            unit_price,
            total_price,
            product:products (name, sku)
          )
        )
      )
    `)
    .eq('id', id)
    .single()

  if (error || !credit) {
    const msg = locale === 'en' ? 'Credit note not found' : 'Avoir introuvable'
    return NextResponse.json({ error: msg }, { status: 404 })
  }

  const inv = credit.invoice as { invoice_number?: string; order?: unknown } | null
  const data = {
    invoice_number: credit.credit_number,
    status: '',
    amount: credit.amount,
    subtotal: credit.subtotal,
    vat_rate: credit.vat_rate,
    vat_amount: credit.vat_amount,
    due_date: credit.created_at,
    created_at: credit.created_at,
    customer: credit.customer,
    order: (inv?.order as unknown) ?? null,
  }

  const seller = credit.user_id ? await getBillingProfile(supabase, credit.user_id) : null

  const buffer = await renderToBuffer(
    createElement(InvoicePDF as any, {
      data,
      locale,
      seller,
      docType: 'credit_note',
      creditRef: inv?.invoice_number ?? null,
    }) as any
  )
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${credit.credit_number}.pdf"`,
    },
  })
}
