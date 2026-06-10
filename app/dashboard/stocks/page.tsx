import { createClient } from '@/lib/supabase/server'
import type { Product } from '@/types'
import { Suspense } from 'react'
import StocksClient from './StocksClient'
import SearchBar from '@/components/ui/SearchBar'
import StatusFilter from '@/components/ui/StatusFilter'
import Pagination from '@/components/ui/Pagination'
import { PageHeader } from '@/components/shared/page-header'
import { LimitBanner } from '@/components/shared/limit-banner'
import { canCreate } from '@/lib/entitlements'

const PAGE_SIZE = 15

const stockOptions = [
  { value: 'low', label: '⚠️ Stock bas' },
  { value: 'ok', label: '✓ En stock' },
]

type Props = {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>
}

export default async function StocksPage({ searchParams }: Props) {
  const { q = '', status = '', page = '1' } = await searchParams
  const currentPage = Math.max(1, parseInt(page))
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  const limitCheck = user ? await canCreate(supabase, user.id, 'products', 0) : null

  let query = supabase.from('products').select('*', { count: 'exact' })

  if (q) {
    query = query.or(`name.ilike.%${q}%,sku.ilike.%${q}%,category.ilike.%${q}%`)
  }
  // Filtre stock
  // On récupère tout et on filtre en JS (stock bas dépend de low_stock_threshold par ligne)
  // Pour les grands volumes, utiliser une colonne computed en SQL
  const { data: all, count: totalCount } = await query.order('created_at', { ascending: false })

  let products = (all as Product[]) ?? []

  if (status === 'low') {
    products = products.filter((p) => p.stock_quantity <= p.low_stock_threshold)
  } else if (status === 'ok') {
    products = products.filter((p) => p.stock_quantity > p.low_stock_threshold)
  }

  // Pagination manuelle après filtre statut
  const total = status ? products.length : (totalCount ?? 0)
  const paginated = status ? products.slice(from, to + 1) : products
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div>
      <PageHeader title="Stocks" description={`${total} produit${total !== 1 ? 's' : ''}`} />

      {limitCheck && <LimitBanner check={limitCheck} resourceLabel="produits" />}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 max-w-xs">
          <Suspense><SearchBar placeholder="Rechercher nom, SKU, catégorie…" /></Suspense>
        </div>
        <Suspense><StatusFilter options={stockOptions} paramName="status" allLabel="Tous" /></Suspense>
      </div>

      <StocksClient products={paginated} />

      <Suspense><Pagination page={currentPage} totalPages={totalPages} /></Suspense>
    </div>
  )
}
