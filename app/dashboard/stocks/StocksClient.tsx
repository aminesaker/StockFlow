'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import type { Product } from '@/types'
import ProductForm from '@/components/products/ProductForm'
import VariantsManager from '@/components/products/VariantsManager'
import { deleteProduct } from './actions'
import ImportProducts from './ImportProducts'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'

type Props = { products: Product[]; variantsByParent: Record<string, Product[]> }

export default function StocksClient({ products, variantsByParent }: Props) {
  const t = useTranslations('stocks')
  const tc = useTranslations('common')
  const [modal, setModal] = useState<'create' | Product | null>(null)
  const [variantParent, setVariantParent] = useState<Product | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string) {
    if (!confirm(t('confirmDelete'))) return
    startTransition(async () => {
      const r = await deleteProduct(id)
      if (r.error) toast.error(r.error)
      else toast.success(t('toastDeleted'))
    })
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-end gap-2">
        <Button asChild variant="outline" size="sm"><a href="/dashboard/stocks/movements">{t('movementsBtn')}</a></Button>
        <Button asChild variant="outline" size="sm"><a href="/api/export/products">{t('exportCsv')}</a></Button>
        <ImportProducts />
        <Button size="sm" onClick={() => setModal('create')}>{t('addProduct')}</Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>{t('colProduct')}</TableHead>
              <TableHead>{t('colSku')}</TableHead>
              <TableHead className="text-right">{t('colPrice')}</TableHead>
              <TableHead className="text-right">{t('colStock')}</TableHead>
              <TableHead>{t('colStatus')}</TableHead>
              <TableHead className="text-right">{tc('actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const variants = variantsByParent[product.id] ?? []
              const hasVar = variants.length > 0
              const effStock = hasVar ? variants.reduce((sum, v) => sum + v.stock_quantity, 0) : product.stock_quantity
              const low = hasVar ? variants.some((v) => v.stock_quantity <= v.low_stock_threshold) : product.stock_quantity <= product.low_stock_threshold
              return (
                <TableRow key={product.id}>
                  <TableCell className="font-medium text-foreground">
                    {product.name}
                    {hasVar && <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs font-normal text-muted-foreground">{t('variants.badge', { count: variants.length })}</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                  <TableCell className="text-right tabular-nums">{product.price.toFixed(2)} €</TableCell>
                  <TableCell className="text-right tabular-nums">{effStock}</TableCell>
                  <TableCell><Badge variant={low ? 'danger' : 'success'}>{low ? t('statusLow') : t('statusOk')}</Badge></TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger className="rounded-md px-2 py-1 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none" aria-label={tc('actions')}>⋯</DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setModal(product)}>{t('actionEdit')}</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setVariantParent(product)}>{t('variants.manage')}</DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <a href={`/dashboard/stocks/movements?product=${product.id}`}>{t('actionView')}</a>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="danger" disabled={isPending} onSelect={() => handleDelete(product.id)}>{t('actionDelete')}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              )
            })}
            {products.length === 0 && (
              <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">{t('empty')}</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {modal && <ProductForm product={modal === 'create' ? undefined : modal} onClose={() => setModal(null)} />}
      {variantParent && <VariantsManager parent={variantParent} variants={variantsByParent[variantParent.id] ?? []} onClose={() => setVariantParent(null)} />}
    </div>
  )
}
