import { createClient } from '@/lib/supabase/server'
import type { Customer, Product } from '@/types'
import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import OrdersClient from './OrdersClient'
import SearchBar from '@/components/ui/SearchBar'
import StatusFilter from '@/components/ui/StatusFilter'
import Pagination from '@/components/ui/Pagination'
import { PageHeader } from '@/components/shared/page-header'
import { LimitBanner } from '@/components/shared/limit-banner'
import { canCreate } from '@/lib/entitlements'

const PAGE_SIZE = 15
type Props = { searchParams: Promise<{ q?: string; status?: string; page?: string }> }

export default async function OrdersPage({ searchParams }: Props) {
  const { q = '', status = '', page = '1' } = await searchParams
  const t = await getTranslations('orders')
  const ts = await getTranslations('orderStatus')
  const currentPage = Math.max(1, parseInt(page))
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()
  let ordersQuery = supabase
    .from('orders')
    .select('*, customer:customers(id, full_name, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)
  if (status) ordersQuery = ordersQuery.eq('status', status)
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
  const { data: { user } } = await supabase.auth.getUser()
  const limitCheck = user ? await canCreate(supabase, user.id, 'orders', 0) : null

  const orderStatusOptions = (['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const).map((v) => ({ value: v, label: ts(v) }))

  return (
    <div>
      <PageHeader title={t('title')} description={t('count', { count: total })} />
      {limitCheck && <LimitBanner check={limitCheck} resourceLabel="commandes" />}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 max-w-xs"><Suspense><SearchBar placeholder={t('search')} /></Suspense></div>
        <Suspense><StatusFilter options={orderStatusOptions} paramName="status" allLabel={t('filterAllStatus')} /></Suspense>
      </div>
      <OrdersClient orders={filteredOrders as unknown as Parameters<typeof OrdersClient>[0]['orders']} customers={(customers as Customer[]) ?? []} products={(products as Product[]) ?? []} />
      <Suspense><Pagination page={currentPage} totalPages={totalPages} /></Suspense>
    </div>
  )
}
