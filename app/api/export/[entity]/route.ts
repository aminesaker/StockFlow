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

const ALLOWED_DAYS = [7, 30, 90, 365]

type ReportRevenue = { series: { bucket: string; amount: number }[] }
type ReportTop = { id: string; name: string; sku?: string; qty?: number; revenue: number; orders?: number }
type Report = {
  revenue: ReportRevenue
  top_products: ReportTop[]
  customers: { top: ReportTop[] }
}

export async function GET(
  req: NextRequest,
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
      .select('full_name,email,phone,address,city,country')
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

  } else if (entity.startsWith('report-')) {
    // Exports de rapports : période via ?days=
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const daysParam = Number(req.nextUrl.searchParams.get('days'))
    const days = ALLOWED_DAYS.includes(daysParam) ? daysParam : 30

    const { data } = await supabase.rpc('reports_overview', { p_user_id: user.id, p_days: days })
    const r = (data as Report | null) ?? null

    if (entity === 'report-revenue') {
      const rows = (r?.revenue.series ?? []).map((s) => ({ date: s.bucket, chiffre_affaires: s.amount }))
      csv = toCsv(rows)
      filename = `rapport-ca-${days}j.csv`
    } else if (entity === 'report-products') {
      const rows = (r?.top_products ?? []).map((p) => ({ produit: p.name, sku: p.sku ?? '', quantite: p.qty ?? 0, chiffre_affaires: p.revenue }))
      csv = toCsv(rows)
      filename = `rapport-top-produits-${days}j.csv`
    } else if (entity === 'report-customers') {
      const rows = (r?.customers.top ?? []).map((c) => ({ client: c.name, chiffre_affaires: c.revenue, commandes: c.orders ?? 0 }))
      csv = toCsv(rows)
      filename = `rapport-clients-${days}j.csv`
    } else {
      return NextResponse.json({ error: 'Rapport inconnu' }, { status: 400 })
    }

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
