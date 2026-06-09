import { createClient } from '@/lib/supabase/server'
import type { Customer } from '@/types'
import { Suspense } from 'react'
import CustomersClient from './CustomersClient'
import SearchBar from '@/components/ui/SearchBar'
import Pagination from '@/components/ui/Pagination'

const PAGE_SIZE = 15

type Props = {
  searchParams: Promise<{ q?: string; page?: string }>
}

export default async function CustomersPage({ searchParams }: Props) {
  const { q = '', page = '1' } = await searchParams
  const currentPage = Math.max(1, parseInt(page))
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()

  let query = supabase
    .from('customers')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,email.ilike.%${q}%,city.ilike.%${q}%`)
  }

  const { data: customers, count } = await query

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Clients</h2>
          <p className="text-sm text-gray-400 mt-0.5">{total} client{total !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="mb-4 max-w-xs">
        <Suspense><SearchBar placeholder="Rechercher nom, email, ville…" /></Suspense>
      </div>

      <CustomersClient customers={(customers as Customer[]) ?? []} />

      <Suspense><Pagination page={currentPage} totalPages={totalPages} /></Suspense>
    </div>
  )
}
