'use client'

import { useRef, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import type { Customer, Product } from '@/types'
import { createOrder } from '@/app/dashboard/orders/actions'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

type OrderItem = { product_id: string; quantity: number; unit_price: number }
type Props = { customers: Customer[]; products: Product[]; onClose: () => void }

export default function OrderForm({ customers, products, onClose }: Props) {
  const t = useTranslations('orders.form')
  const tc = useTranslations('common')
  const formRef = useRef<HTMLFormElement>(null)
  const [items, setItems] = useState<OrderItem[]>([{ product_id: '', quantity: 1, unit_price: 0 }])
  const [customerId, setCustomerId] = useState('')
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [isPending, startTransition] = useTransition()

  function addItem() { setItems((prev) => [...prev, { product_id: '', quantity: 1, unit_price: 0 }]) }
  function removeItem(index: number) { setItems((prev) => prev.filter((_, i) => i !== index)) }
  function updateItem(index: number, field: keyof OrderItem, value: string | number) {
    setItems((prev) => prev.map((item, i) => {
      if (i !== index) return item
      const updated = { ...item, [field]: value }
      if (field === 'product_id') { const product = products.find((p) => p.id === value); if (product) updated.unit_price = product.price }
      return updated
    }))
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">{t('title')}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-muted-foreground text-xl">×</button>
        </div>
        <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t('customer')}</label>
            <input type="hidden" name="customer_id" value={customerId} />
            <Select value={customerId || undefined} onValueChange={setCustomerId}>
              <SelectTrigger className={errors.customer_id ? 'border-red-400' : ''}>
                <SelectValue placeholder={t('selectCustomer')} />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (<SelectItem key={c.id} value={c.id}>{c.full_name} ({c.email})</SelectItem>))}
              </SelectContent>
            </Select>
            {errors.customer_id && <p className="text-xs text-red-500 mt-1">{errors.customer_id[0]}</p>}
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-muted-foreground">{t('items')}</label>
              <button type="button" onClick={addItem} className="text-xs text-primary hover:underline">{t('addLine')}</button>
            </div>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-[1fr_80px_100px_32px] gap-2 items-start">
                  <Select value={item.product_id || undefined} onValueChange={(v) => updateItem(index, 'product_id', v)}>
                    <SelectTrigger className="h-auto py-1.5">
                      <SelectValue placeholder={t('selectProduct')} />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name} ({t('stock')}: {p.stock_quantity})</SelectItem>))}
                    </SelectContent>
                  </Select>
                  <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))} className="px-2 py-1.5 border border-input rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring/50" placeholder={t('qty')} />
                  <input type="number" step="0.01" min="0" value={item.unit_price} onChange={(e) => updateItem(index, 'unit_price', Number(e.target.value))} className="px-2 py-1.5 border border-input rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-ring/50" placeholder={t('price')} />
                  <button type="button" onClick={() => removeItem(index)} disabled={items.length === 1} className="text-red-400 hover:text-red-600 disabled:opacity-30 text-lg leading-none mt-1">×</button>
                </div>
              ))}
            </div>
            <div className="mt-3 text-right text-sm font-semibold text-foreground">{t('total')} : {total.toFixed(2)} €</div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t('notes')}</label>
            <textarea name="notes" rows={2} className="w-full px-3 py-2 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/50" />
          </div>
          {errors._root && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{errors._root[0]}</p>}
        </form>
        <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">{tc('cancel')}</button>
          <button onClick={() => formRef.current?.requestSubmit()} disabled={isPending} className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors">{isPending ? t('creating') : t('create')}</button>
        </div>
      </div>
    </div>
  )
}
