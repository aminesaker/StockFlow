'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import { saveSettings } from './actions'

type Settings = { notify_email: string | null }
type Props = { settings: Settings; userEmail: string }

export default function SettingsForm({ settings, userEmail }: Props) {
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const r = await saveSettings(fd)
      if (r.error) toast.error(r.error)
      else toast.success('Paramètres enregistrés')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Email de notification */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="mb-1 font-semibold text-foreground">Email de notification</h3>
        <p className="mb-4 text-sm text-muted-foreground">Adresse qui reçoit tous les emails automatiques.</p>
        <input
          type="email"
          name="notify_email"
          defaultValue={settings.notify_email ?? userEmail}
          placeholder={userEmail}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {/* Renvoi vers la page Automatisations */}
      <Link
        href="/dashboard/automations"
        className="flex items-center justify-between rounded-xl border border-border bg-card px-6 py-5 transition-colors hover:bg-muted/40"
      >
        <div>
          <p className="font-semibold text-foreground">Automatisations</p>
          <p className="mt-0.5 text-sm text-muted-foreground">Facturation auto, alertes de stock, relances, rapport hebdo.</p>
        </div>
        <span className="text-primary">→</span>
      </Link>
    </form>
  )
}
