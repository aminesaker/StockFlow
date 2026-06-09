import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s
  }
  const lines = [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(',')),
  ]
  return lines.join('\n')
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ entity: string }> }
) {
  const { entity } = await params
  const supabase = await createClient()

  let csv = ''
  let filename = ''

  if (entity === 'products') {
    const { data } = await supabase
      .from('products')
      .select('name,sku,description,price,stock_quantity,low_stock_threshold,category,image_url')
      .order('name')
    csv = toCsv((data ?? []) as Record<string, unknown>[])
    filename = 'produits.csv'

  } else if (entity === 'customers') {
    const { data } = await supabase
      .from('customers')
      .select('full_name,email,phone,address,city,country,notes')
      .order('full_name')
    csv = toCsv((data ?? []) as Record<string, unknown>[])
    filename = 'clients.csv'

  } else if (entity === 'orders') {
    const { data } = await supabase
      .from('orders')
      .select('id,status,total_amount,notes,created_at,customer:customers(full_name,email)')
      .order('created_at', { ascending: false })
    const rows = (data ?? []).map((o: Record<string, unknown>) => {
      const c = o.customer as { full_name: string; email: string } | null
      return {
        id: o.id,
        client: c?.full_name ?? '',
        email: c?.email ?? '',
        statut: o.status,
        total: o.total_amount,
        notes: o.notes ?? '',
        date: o.created_at,
      }
    })
    csv = toCsv(rows)
    filename = 'commandes.csv'

  } else if (entity === 'invoices') {
    const { data } = await supabase
      .from('invoices')
      .select('invoice_number,status,amount,due_date,paid_at,created_at,customer:customers(full_name,email)')
      .order('created_at', { ascending: false })
    const rows = (data ?? []).map((i: Record<string, unknown>) => {
      const c = i.customer as { full_name: string; email: string } | null
      return {
        numero: i.invoice_number,
        client: c?.full_name ?? '',
        email: c?.email ?? '',
        statut: i.status,
        montant: i.amount,
        echeance: i.due_date,
        payee_le: i.paid_at ?? '',
        creee_le: i.created_at,
      }
    })
    csv = toCsv(rows)
    filename = 'factures.csv'

  } else {
    return NextResponse.json({ error: 'Entité inconnue' }, { status: 400 })
  }

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
