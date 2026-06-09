'use client'

import { useRef, useState, useTransition } from 'react'
import type { Customer } from '@/types'
import { createCustomer, updateCustomer } from '@/app/dashboard/customers/actions'

type Props = { customer?: Customer; onClose: () => void }

export default function CustomerForm({ customer, onClose }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const result = customer
        ? await updateCustomer(customer.id, formData)
        : await createCustomer(formData)

      if (result.error) setErrors(result.error as Record<string, string[]>)
      else onClose()
    })
  }

  const inp = (name: string, type = 'text') => ({
    name,
    type,
    defaultValue: customer ? String(customer[name as keyof Customer] ?? '') : '',
    className: `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
      errors[name] ? 'border-red-400' : 'border-gray-300'
    }`,
  })

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">
            {customer ? 'Modifier le client' : 'Nouveau client'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Nom complet *</label>
              <input {...inp('full_name')} required />
              {errors.full_name && <p className="text-xs text-red-500 mt-1">{errors.full_name[0]}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
              <input {...inp('email', 'email')} required />
              {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email[0]}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Téléphone</label>
              <input {...inp('phone', 'tel')} />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 mb-1">Adresse</label>
              <input {...inp('address')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ville</label>
              <input {...inp('city')} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Pays</label>
              <input {...inp('country')} />
            </div>
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
            {isPending ? 'Enregistrement...' : customer ? 'Mettre à jour' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  )
}
