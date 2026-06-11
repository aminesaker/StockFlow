'use client'

import { useRef, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import type { Customer, Order } from '@/types'
import { createInvoice } from '@/app/dashboard/invoices/actions'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

type Props = { customers: Customer[]; orders: Order[]; onClose: () => void }

export default function InvoiceForm({ customers, orders, onClose }: Props) {
  const t = useTranslations('invoices.form')
  const tc = useTranslations('common')
  const formRef = useRef<HTMLFormElement>(null)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [isPending, startTransition] = useTransition()
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [orderId, setOrderId] = useState('__none__')
  const [status, setStatus] = useState('draft')

  const customerOrders = orders.filter((o) => o.customer_id === selectedCustomerId)
  const defaultDue = new Date()
  defaultDue.setDate(defaultDue.getDate() + 30)
  const defaultDueStr = defaultDue.toISOString().split('T')[0]

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await createInvoice(formData)
      if (result.error) setErrors(result.error as Record<string, string[]>)
      else onClose()
    })
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">{t('title')}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-muted-foreground text-xl">×</button>
        </div>
        <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t('customer')}</label>
            <input type="hidden" name="customer_id" value={selectedCustomerId} />
            <Select value={selectedCustomerId || undefined} onValueChange={(v) => { setSelectedCustomerId(v); setOrderId('__none__') }}>
              <SelectTrigger className={errors.customer_id ? 'border-red-400' : ''}><SelectValue placeholder={t('selectCustomer')} /></SelectTrigger>
              <SelectContent>
                {customers.map((c) => (<SelectItem key={c.id} value={c.id}>{c.full_name}</SelectItem>))}
              </SelectContent>
            </Select>
            {errors.customer_id && <p className="text-xs text-red-500 mt-1">{errors.customer_id[0]}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t('linkedOrder')} <span className="text-muted-foreground">{t('optional')}</span></label>
            <input type="hidden" name="order_id" value={orderId === '__none__' ? '' : orderId} />
            <Select value={orderId} onValueChange={setOrderId} disabled={!selectedCustomerId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t('none')}</SelectItem>
                {customerOrders.map((o) => (<SelectItem key={o.id} value={o.id}>{o.id.slice(0, 8)}... — {o.total_amount.toFixed(2)} €</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t('amount')}</label>
            <input type="number" name="amount" step="0.01" min="0" required className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 ${errors.amount ? 'border-red-400' : 'border-input'}`} />
            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount[0]}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t('dueDate')}</label>
            <input type="date" name="due_date" required defaultValue={defaultDueStr} className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 ${errors.due_date ? 'border-red-400' : 'border-input'}`} />
            {errors.due_date && <p className="text-xs text-red-500 mt-1">{errors.due_date[0]}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">{t('status')}</label>
            <input type="hidden" name="status" value={status} />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">{t('statusDraft')}</SelectItem>
                <SelectItem value="sent">{t('statusSent')}</SelectItem>
              </SelectContent>
            </Select>
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
