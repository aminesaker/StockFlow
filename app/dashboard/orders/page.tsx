import { createClient } from '@/lib/supabase/server'
import type { Customer, Product } from '@/types'
import { Suspense } from 'react'
import OrdersClient from './OrdersClient'
import SearchBar from '@/components/ui/SearchBar'
import StatusFilter from '@/components/ui/StatusFilter'
import Pagination from '@/components/ui/Pagination'

const PAGE_SIZE = 15

const orderStatusOptions = [
  { value: 'pending', label: 'En attente' },
  { value: 'confirmed', label: 'Confirmée' },
  { value: 'shipped', label: 'Expédiée' },
  { value: 'delivered', label: 'Livrée' },
  { value: 'cancelled', label: 'Annulée' },
]

type Props = {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>
}

export default async function OrdersPage({ searchParams }: Props) {
  const { q = '', status = '', page = '1' } = await searchParams
  const currentPage = Math.max(1, parseInt(page))
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()

  // Requête commandes avec filtre
  let ordersQuery = supabase
    .from('orders')
    .select('*, customer:customers(id, full_name, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (status) ordersQuery = ordersQuery.eq('status', status)

  // Recherche sur le nom du client (via jointure)
  // Supabase ne supporte pas ilike sur les relations, on filtre côté JS pour la recherche
  const { data: orders, count } = await ordersQuery

  const filteredOrders = q
    ? (orders ?? []).filter((o) => {
        const customerName = (o.customer as { full_name: string } | null)?.full_name ?? ''
        return customerName.toLowerCase().includes(q.toLowerCase())
      })
    : orders ?? []

  const [{ data: customers }, { data: products }] = await Promise.all([
    supabase.from('customers').select('*').order('full_name'),
    supabase.from('products').select('*').order('name'),
  ])

  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Commandes</h2>
        <p className="text-sm text-gray-400 mt-0.5">{total} commande{total !== 1 ? 's' : ''}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 max-w-xs">
          <Suspense><SearchBar placeholder="Rechercher par client…" /></Suspense>
        </div>
        <Suspense>
          <StatusFilter options={orderStatusOptions} paramName="status" allLabel="Tous statuts" />
        </Suspense>
      </div>

      <OrdersClient
        orders={filteredOrders}
        customers={(customers as Customer[]) ?? []}
        products={(products as Product[]) ?? []}
      />

      <Suspense><Pagination page={currentPage} totalPages={totalPages} /></Suspense>
    </div>
  )
}
