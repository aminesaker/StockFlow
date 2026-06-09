import { createClient } from '@/lib/supabase/server'
import type { Customer, Order } from '@/types'
import { Suspense } from 'react'
import InvoicesClient from './InvoicesClient'
import SearchBar from '@/components/ui/SearchBar'
import StatusFilter from '@/components/ui/StatusFilter'
import Pagination from '@/components/ui/Pagination'

const PAGE_SIZE = 15

const invoiceStatusOptions = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'sent', label: 'Envoyée' },
  { value: 'paid', label: 'Payée' },
  { value: 'overdue', label: 'En retard' },
  { value: 'cancelled', label: 'Annulée' },
]

type Props = {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>
}

export default async function InvoicesPage({ searchParams }: Props) {
  const { q = '', status = '', page = '1' } = await searchParams
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Factures</h2>
        <p className="text-sm text-gray-400 mt-0.5">{total} facture{total !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 max-w-xs">
          <Suspense><SearchBar placeholder="Rechercher N° facture ou client…" /></Suspense>
        </div>
        <Suspense>
          <StatusFilter options={invoiceStatusOptions} paramName="status" allLabel="Tous statuts" />
        </Suspense>
      </div>

      <InvoicesClient
        invoices={filtered}
        customers={(customers as Customer[]) ?? []}
        orders={(orders as Order[]) ?? []}
      />

      <Suspense><Pagination page={currentPage} totalPages={totalPages} /></Suspense>
    </div>
  )
}
