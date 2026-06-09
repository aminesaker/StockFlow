'use client'

import { useState, useTransition } from 'react'
import type { Customer } from '@/types'
import CustomerForm from '@/components/customers/CustomerForm'
import { deleteCustomer } from './actions'

export default function CustomersClient({ customers }: { customers: Customer[] }) {
  const [modal, setModal] = useState<'create' | Customer | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string) {
    if (!confirm('Supprimer ce client ?')) return
    startTransition(() => {
  void deleteCustomer(id)
})
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setModal('create')}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Nouveau client
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-600">Nom</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Email</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Téléphone</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Ville</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Depuis</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{c.full_name}</td>
                <td className="px-4 py-3 text-gray-500">{c.email}</td>
                <td className="px-4 py-3 text-gray-500">{c.phone ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{c.city ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">
                  {new Date(c.created_at).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => setModal(c)} className="text-xs text-blue-600 hover:underline">
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={isPending}
                    className="text-xs text-red-500 hover:underline disabled:opacity-50"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-400">
                  Aucun client — ajoutez-en un !
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <CustomerForm
          customer={modal === 'create' ? undefined : modal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
