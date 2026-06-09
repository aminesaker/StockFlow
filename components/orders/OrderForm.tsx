'use client'

import { useRef, useState, useTransition } from 'react'
import type { Customer, Product } from '@/types'
import { createOrder } from '@/app/dashboard/orders/actions'

type OrderItem = { product_id: string; quantity: number; unit_price: number }

type Props = {
  customers: Customer[]
  products: Product[]
  onClose: () => void
}

export default function OrderForm({ customers, products, onClose }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [items, setItems] = useState<OrderItem[]>([{ product_id: '', quantity: 1, unit_price: 0 }])
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [isPending, startTransition] = useTransition()

  function addItem() {
    setItems((prev) => [...prev, { product_id: '', quantity: 1, unit_price: 0 }])
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  function updateItem(index: number, field: keyof OrderItem, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item
        const updated = { ...item, [field]: value }
        // Auto-fill unit_price when product changes
        if (field === 'product_id') {
          const product = products.find((p) => p.id === value)
          if (product) updated.unit_price = product.price
        }
        return updated
      })
    )
  }

  const total = items.reduce((s, i) => s + i.quantity * i.unit_price, 0)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    formData.set('items', JSON.stringify(items))

    startTransition(async () => {
      const result = await createOrder(formData)
      if (result.error) setErrors(result.error as Record<string, string[]>)
      else onClose()
    })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Nouvelle commande</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Client */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Client *</label>
            <select
              name="customer_id"
              required
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.customer_id ? 'border-red-400' : 'border-gray-300'}`}
            >
              <option value="">— Sélectionner un client —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
              ))}
            </select>
            {errors.customer_id && <p className="text-xs text-red-500 mt-1">{errors.customer_id[0]}</p>}
          </div>

          {/* Articles */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600">Articles *</label>
              <button
                type="button"
                onClick={addItem}
                className="text-xs text-blue-600 hover:underline"
              >
                + Ajouter une ligne
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-[1fr_80px_100px_32px] gap-2 items-start">
                  <select
                    value={item.product_id}
                    onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                    required
                    className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— Produit —</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (stock: {p.stock_quantity})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                    className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Qté"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unit_price}
                    onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))}
                    className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Prix €"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    disabled={items.length === 1}
                    className="text-red-400 hover:text-red-600 disabled:opacity-30 text-lg leading-none mt-1"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-3 text-right text-sm font-semibold text-gray-900">
              Total : {total.toFixed(2)} €
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
            <textarea
              name="notes"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {errors._root && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{errors._root[0]}</p>
          )}
        </form>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
            Annuler
          </button>
          <button
            onClick={() => formRef.current?.requestSubmit()}
            disabled={isPending}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {isPending ? 'Création...' : 'Créer la commande'}
          </button>
        </div>
      </div>
    </div>
  )
}
