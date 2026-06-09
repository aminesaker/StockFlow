'use client'

import { useState, useTransition } from 'react'
import type { Product } from '@/types'
import ProductForm from '@/components/products/ProductForm'
import { deleteProduct } from './actions'

type Props = { products: Product[] }

export default function StocksClient({ products }: Props) {
  const [modal, setModal] = useState<'create' | Product | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string) {
    if (!confirm('Supprimer ce produit ?')) return
    startTransition(() => {
  void deleteProduct(id)
})
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setModal('create')}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Ajouter un produit
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-600">Produit</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">SKU</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Prix</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Stock</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Statut</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                <td className="px-4 py-3 text-gray-500">{product.sku}</td>
                <td className="px-4 py-3 text-right">{product.price.toFixed(2)} €</td>
                <td className="px-4 py-3 text-right">{product.stock_quantity}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    product.stock_quantity <= product.low_stock_threshold
                      ? 'bg-red-100 text-red-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {product.stock_quantity <= product.low_stock_threshold ? 'Stock bas' : 'En stock'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button
                    onClick={() => setModal(product)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    disabled={isPending}
                    className="text-xs text-red-500 hover:underline disabled:opacity-50"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Aucun produit — ajoutez-en un !
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <ProductForm
          product={modal === 'create' ? undefined : modal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
