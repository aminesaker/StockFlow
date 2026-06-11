import { createClient } from '@/lib/supabase/server'
import type { Customer, Order } from '@/types'
import { Suspense } from 'react'
import InvoicesClient from './InvoicesClient'
import SearchBar from '@/components/ui/SearchBar'
import StatusFilter from '@/components/ui/StatusFilter'
import Pagination from '@/components/ui/Pagination'
import { PageHeader } from '@/components/shared/page-header'
import { getTranslations } from 'next-intl/server'

const PAGE_SIZE = 15

type Props = {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>
}

export default async function InvoicesPage({ searchParams }: Props) {
  const { q = '', status = '', page = '1' } = await searchParams
  const t = await getTranslations('invoices')
  const tis = await getTranslations('invoiceStatus')
  const currentPage = Math.max(1, parseInt(page))
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()

  let query = supabase
    .from('invoices')
    .select('*, customer:customers(full_name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status) query = query.eq('status', status)
  if (q) query = query.ilike('invoice_number', `%${q}%`)

  const { data: invoices, count } = await query

  // Filtre recherche sur le nom client côté JS (si q non vide)
  const filtered = q && !q.startsWith('INV')
    ? (invoices ?? []).filter((inv) => {
        const name = (inv.customer as { full_name: string } | null)?.full_name ?? ''
        return name.toLowerCase().includes(q.toLowerCase())
      })
    : invoices ?? []

  const [{ data: customers }, { data: orders }] = await Promise.all([
    supabase.from('customers').select('*').order('full_name'),
    supabase
      .from('orders')
      .select('id, customer_id, total_amount, status')
      .order('created_at', { ascending: false }),
  ])

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div>
      <PageHeader title={t('title')} description={t('count', { count: total })} />

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 max-w-xs">
          <Suspense><SearchBar placeholder={t('search')} /></Suspense>
        </div>
        <Suspense>
          <StatusFilter options={(['draft','sent','paid','overdue','cancelled'] as const).map((v) => ({ value: v, label: tis(v) }))} paramName="status" allLabel={t('filterAllStatus')} />
        </Suspense>
      </div>

      <InvoicesClient
        invoices={filtered as unknown as Parameters<typeof InvoicesClient>[0]['invoices']}
        customers={(customers as Customer[]) ?? []}
        orders={(orders as Order[]) ?? []}
      />

      <Suspense><Pagination page={currentPage} totalPages={totalPages} /></Suspense>
    </div>
  )
}
