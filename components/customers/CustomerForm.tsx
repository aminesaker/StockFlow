'use client'

import { useRef, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import type { Customer } from '@/types'
import { createCustomer, updateCustomer } from '@/app/dashboard/customers/actions'

type Props = { customer?: Customer; onClose: () => void }

export default function CustomerForm({ customer, onClose }: Props) {
  const t = useTranslations('customers.form')
  const tc = useTranslations('common')
  const formRef = useRef<HTMLFormElement>(null)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = customer ? await updateCustomer(customer.id, formData) : await createCustomer(formData)
      if (result.error) setErrors(result.error as Record<string, string[]>)
      else onClose()
    })
  }

  const inp = (name: string, type = 'text') => ({
    name, type,
    defaultValue: customer ? String(customer[name as keyof Customer] ?? '') : '',
    className: `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 ${errors[name] ? 'border-red-400' : 'border-input'}`,
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-foreground">{customer ? t('editTitle') : t('addTitle')}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-muted-foreground text-xl">×</button>
        </div>
        <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('fullName')}</label>
              <input {...inp('full_name')} required />
              {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name[0]}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('email')}</label>
              <input {...inp('email', 'email')} required />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email[0]}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('phone')}</label>
              <input {...inp('phone', 'tel')} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('address')}</label>
              <input {...inp('address')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('city')}</label>
              <input {...inp('city')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{t('country')}</label>
              <input {...inp('country')} />
            </div>
          </div>
          {errors._root && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{errors._root[0]}</p>}
        </form>
        <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground">{tc('cancel')}</button>
          <button onClick={() => formRef.current?.requestSubmit()} disabled={isPending} className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors">{isPending ? tc('saving') : customer ? tc('update') : tc('create')}</button>
        </div>
      </div>
    </div>
  )
}
