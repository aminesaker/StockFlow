import { renderToBuffer } from '@react-pdf/renderer'
import { createElement } from 'react'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import InvoicePDF from '@/components/invoices/InvoicePDF'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

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
    return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 })
  }

  const buffer = await renderToBuffer(
    createElement(InvoicePDF, { data: invoice as Parameters<typeof InvoicePDF>[0]['data'] })
  )

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoice_number}.pdf"`,
    },
  })
}
