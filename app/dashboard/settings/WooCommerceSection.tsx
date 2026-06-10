'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { saveWooCommerceSettings } from './woocommerce-actions'

type Props = {
  apiKeyPrefix: string | null   // Premier préfixe disponible pour construire l'URL
  webhookSecret: string | null
  appUrl: string
}

export default function WooCommerceSection({ apiKeyPrefix, webhookSecret, appUrl }: Props) {
  const [isPending, startTransition] = useTransition()
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [showSecret, setShowSecret] = useState(false)

  const webhookUrl = `${appUrl}/api/webhooks/woocommerce?api_key=sf_live_...`

  function copyUrl() {
    navigator.clipboard.writeText(webhookUrl)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const r = await saveWooCommerceSettings(fd)
      if (r.error) toast.error(r.error)
      else toast.success('Configuration WooCommerce enregistrée')
    })
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border flex items-center gap-3">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-lg">🛒</div>
        <div>
          <h3 className="font-semibold text-foreground">WooCommerce</h3>
          <p className="text-xs text-muted-foreground">Synchronisation automatique commandes, clients, produits</p>
        </div>
        <span className="ml-auto text-xs bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400 dark:bg-green-500/15 dark:text-green-400 px-2.5 py-1 rounded-full font-medium">
          Disponible
        </span>
      </div>

      <div className="px-6 py-5 space-y-5">
        {/* Guide pas-à-pas */}
        <div className="rounded-lg border bg-muted/40 p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Guide de configuration (5 min)</p>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-bold">1</span>
              Générez une clé API dans la section ci-dessus si ce n'est pas déjà fait.
            </li>
            <li className="flex gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-bold">2</span>
              Dans WooCommerce : <strong>WooCommerce → Réglages → Avancé → Webhooks → Ajouter</strong>
            </li>
            <li className="flex gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-bold">3</span>
              Créez 2 webhooks : <code className="bg-muted px-1 rounded text-xs">Commande créée</code> et <code className="bg-muted px-1 rounded text-xs">Commande mise à jour</code>
            </li>
            <li className="flex gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-bold">4</span>
              Collez l'URL ci-dessous dans le champ <strong>URL de livraison</strong> (remplacez par votre vraie clé API).
            </li>
            <li className="flex gap-2">
              <span className="flex-shrink-0 w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-bold">5</span>
              Copiez le <strong>Secret</strong> généré par WooCommerce et collez-le dans le champ ci-dessous.
            </li>
          </ol>
        </div>

        {/* URL webhook */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
            URL Webhook à coller dans WooCommerce
          </label>
          <div className="flex gap-2">
            <code className="flex-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-xs text-foreground break-all">
              {appUrl}/api/webhooks/woocommerce?api_key=<span className="text-primary">sf_live_votreclé</span>
            </code>
            <button
              type="button"
              onClick={copyUrl}
              className="px-3 py-2 border border-border text-muted-foreground text-xs rounded-lg hover:bg-muted/40 transition-colors whitespace-nowrap"
            >
              {copiedUrl ? '✓' : 'Copier'}
            </button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Remplacez <code className="bg-muted px-1 rounded">sf_live_votreclé</code> par votre vraie clé API (section Clés API ci-dessus).
          </p>
        </div>

        {/* Secret WooCommerce */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
              Secret WooCommerce (optionnel mais recommandé)
            </label>
            <div className="flex gap-2">
              <input
                type={showSecret ? 'text' : 'password'}
                name="wc_webhook_secret"
                defaultValue={webhookSecret ?? ''}
                placeholder="Collez ici le secret généré par WooCommerce"
                className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/50 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="px-3 py-2 border border-border text-muted-foreground text-xs rounded-lg hover:bg-muted/40"
              >
                {showSecret ? '🙈' : '👁'}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Permet de vérifier que les webhooks proviennent bien de votre boutique WooCommerce.
            </p>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="text-xs text-muted-foreground">
              Topics à activer :{' '}
              <code className="bg-muted px-1 rounded">order.created</code>{' '}
              <code className="bg-muted px-1 rounded">order.updated</code>{' '}
              <code className="bg-muted px-1 rounded">product.updated</code>
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
            >
              {isPending ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </form>

        {/* Ce qui se passe automatiquement */}
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
          <p className="text-xs font-semibold text-purple-700 mb-2">⚡ Ce que StockFlow fait automatiquement</p>
          <ul className="text-xs text-purple-600 space-y-1">
            <li>→ Nouvelle commande WC <span className="text-purple-400">|</span> Client upsert + commande créée + stock décrémenté</li>
            <li>→ Commande "Completed" WC <span className="text-purple-400">|</span> Facture PDF générée + envoyée au client par email</li>
            <li>→ Produit mis à jour WC <span className="text-purple-400">|</span> Prix et stock synchronisés dans StockFlow</li>
            <li>→ Stock sous le seuil <span className="text-purple-400">|</span> Email d'alerte envoyé à votre adresse</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
