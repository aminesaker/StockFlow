'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import type { Customer } from '@/types'
import CustomerForm from '@/components/customers/CustomerForm'
import { deleteCustomer } from './actions'

export default function CustomersClient({ customers }: { customers: Customer[] }) {
  const [modal, setModal] = useState<'create' | Customer | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleDelete(id: string) {
    if (!confirm('Supprimer ce client ?')) return
    startTransition(async () => {
      const r = await deleteCustomer(id)
      if (r.error) toast.error(r.error)
      else toast.success('Client supprimé')
    })
  }

  return (
    <div>
      <div className="flex items-center justify-end gap-2 mb-4">
        <a
          href="/api/export/customers"
          className="rounded-lg border px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent"
        >
          ⬇ Exporter CSV
        </a>
        <button
          onClick={() => setModal('create')}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          + Nouveau client
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nom</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Téléphone</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ville</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Depuis</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-b hover:bg-muted/50">
                <td className="px-4 py-3 font-medium text-foreground">{c.full_name}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.email}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.phone ?? '—'}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.city ?? '—'}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <button onClick={() => setModal(c)} className="text-xs text-primary hover:underline">
                    Modifier
                  </button>
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={isPending}
                    className="text-xs text-destructive hover:underline disabled:opacity-50"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
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
