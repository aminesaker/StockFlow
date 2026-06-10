'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { saveSettings } from './actions'

type Settings = {
  notify_email: string | null
  auto_invoice: boolean
  stock_alerts: boolean
  overdue_reminders: boolean
  weekly_report: boolean
}

type Props = { settings: Settings; userEmail: string }

const AUTOMATIONS = [
  {
    key: 'auto_invoice',
    icon: '🧾',
    title: 'Facturation automatique',
    description: 'Crée et envoie une facture au client dès qu\'une commande passe en "Livrée".',
  },
  {
    key: 'stock_alerts',
    icon: '📦',
    title: 'Alertes stock bas',
    description: 'Envoie un email dès qu\'un produit passe sous son seuil de réapprovisionnement.',
  },
  {
    key: 'overdue_reminders',
    icon: '🔔',
    title: 'Relances impayés',
    description: 'Rappels automatiques à J+7, J+15 et J+30 après l\'échéance d\'une facture.',
  },
  {
    key: 'weekly_report',
    icon: '📊',
    title: 'Rapport hebdomadaire',
    description: 'Résumé de votre activité (commandes, revenus, stocks) envoyé chaque lundi matin.',
  },
] as const

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
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">

      {/* Email de notification */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="font-semibold text-foreground mb-1">Email de notification</h3>
        <p className="text-sm text-muted-foreground mb-4">Adresse qui reçoit tous les emails automatiques.</p>
        <input
          type="email"
          name="notify_email"
          defaultValue={settings.notify_email ?? userEmail}
          placeholder={userEmail}
          className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
      </div>

      {/* Automatisations */}
      <div className="rounded-xl border bg-card divide-y divide-gray-100">
        <div className="px-6 py-4">
          <h3 className="font-semibold text-foreground">Automatisations</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Activez ce que StockFlow doit faire sans intervention.</p>
        </div>

        {AUTOMATIONS.map((a) => (
          <label key={a.key} className="flex items-start gap-4 px-6 py-5 cursor-pointer hover:bg-muted/40 transition-colors">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xl">{a.icon}</span>
                <span className="font-medium text-foreground text-sm">{a.title}</span>
              </div>
              <p className="text-sm text-muted-foreground ml-7">{a.description}</p>
            </div>
            {/* Toggle switch */}
            <div className="relative mt-0.5 flex-shrink-0">
              <input
                type="checkbox"
                name={a.key}
                defaultChecked={settings[a.key] ?? true}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-muted peer-checked:bg-primary rounded-full transition-colors peer-focus:ring-2 peer-focus:ring-blue-300" />
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-background rounded-full shadow transition-transform peer-checked:translate-x-5" />
            </div>
          </label>
        ))}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isPending ? 'Enregistrement…' : 'Enregistrer les paramètres'}
        </button>
      </div>
    </form>
  )
}
