'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import type { Product } from '@/types'
import ProductForm from '@/components/products/ProductForm'
import { deleteProduct } from './actions'
import ImportProducts from './ImportProducts'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

type Props = { products: Product[] }

export default function StocksClient({ products }: Props) {
  const [modal, setModal] = useState<'create' | Product | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string) {
    if (!confirm('Supprimer ce produit ?')) return
    startTransition(async () => {
      const r = await deleteProduct(id)
      if (r.error) toast.error(r.error)
      else toast.success('Produit supprimé')
    })
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-end gap-2">
        <Button asChild variant="outline" size="sm"><a href="/dashboard/stocks/movements">📊 Mouvements</a></Button>
        <Button asChild variant="outline" size="sm"><a href="/api/export/products">⬇ Exporter CSV</a></Button>
        <ImportProducts />
        <Button size="sm" onClick={() => setModal('create')}>+ Ajouter un produit</Button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead>Produit</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-right">Prix</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => {
              const low = product.stock_quantity <= product.low_stock_threshold
              return (
                <TableRow key={product.id}>
                  <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">{product.sku}</TableCell>
                  <TableCell className="text-right tabular-nums">{product.price.toFixed(2)} €</TableCell>
                  <TableCell className="text-right tabular-nums">{product.stock_quantity}</TableCell>
                  <TableCell><Badge variant={low ? 'danger' : 'success'}>{low ? 'Stock bas' : 'En stock'}</Badge></TableCell>
                  <TableCell className="space-x-3 text-right">
                    <button onClick={() => setModal(product)} className="text-xs text-primary hover:underline">Modifier</button>
                    <button onClick={() => handleDelete(product.id)} disabled={isPending} className="text-xs text-destructive hover:underline disabled:opacity-50">Supprimer</button>
                  </TableCell>
                </TableRow>
              )
            })}
            {products.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Aucun produit — ajoutez-en un !</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {modal && <ProductForm product={modal === 'create' ? undefined : modal} onClose={() => setModal(null)} />}
    </div>
  )
}
