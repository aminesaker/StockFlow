'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createApiKey } from '@/app/dashboard/settings/api-keys-actions'
import { Button } from '@/components/ui/button'

export function OnboardingClient({ appUrl }: { appUrl: string }) {
  const [rawKey, setRawKey] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const router = useRouter()

  function generate() {
    start(async () => {
      const fd = new FormData()
      fd.set('name', 'Connexion boutique')
      const r = await createApiKey(fd)
      if (r.error) toast.error(r.error)
      else if (r.rawKey) { setRawKey(r.rawKey); toast.success('Clé de connexion générée') }
    })
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text)
    toast.success('Copié dans le presse-papiers')
  }

  const wooUrl = rawKey ? `${appUrl}/api/webhooks/woocommerce?api_key=${rawKey}` : ''

  return (
    <div className="space-y-4">
      {!rawKey ? (
        <Button onClick={generate} disabled={pending}>
          {pending ? 'Génération…' : 'Générer ma clé de connexion'}
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="rounded-lg border bg-muted/40 p-3">
            <p className="mb-1 text-xs font-medium text-muted-foreground">URL de webhook (WooCommerce) — à coller dans votre boutique</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto whitespace-nowrap rounded bg-background px-2 py-1.5 text-xs text-foreground">{wooUrl}</code>
              <Button size="sm" variant="outline" onClick={() => copy(wooUrl)}>Copier</Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Dans WooCommerce → Réglages → Avancé → Webhooks → Ajouter : collez cette URL, statut <strong>Actif</strong>, pour les sujets Produit créé/modifié/supprimé et Commande créée/modifiée.
          </p>
          <Button variant="secondary" onClick={() => router.refresh()}>
            J&apos;ai configuré — vérifier la synchronisation
          </Button>
        </div>
      )}
    </div>
  )
}
