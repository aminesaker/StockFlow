import Link from 'next/link'
import type { Metadata } from 'next'
import SiteHeader from '@/components/landing/SiteHeader'
import SiteFooter from '@/components/landing/SiteFooter'
import { BRAND } from '@/lib/brand'

export const metadata: Metadata = {
  title: `Fonctionnalités — ${BRAND}`,
  description: `Synchronisation multi-boutiques, stock temps réel, commandes, facturation automatique, prévisions, rapports et API. Découvrez tout ce que ${BRAND} automatise.`,
}

const FEATURES = [
  { icon: '🔄', title: 'Synchronisation multi-boutiques', desc: 'WooCommerce et Shopify connectés à un tableau de bord unique. Une vente, un retour, une annulation ? Tout se met à jour en temps réel, sans saisie.' },
  { icon: '📦', title: 'Stock en temps réel', desc: 'Décrément automatique à chaque commande, restock sur annulation/remboursement, et alertes dès qu\'un produit passe sous son seuil.' },
  { icon: '🛒', title: 'Commandes & clients centralisés', desc: 'Toutes vos commandes et fiches clients regroupées, quelle que soit la boutique d\'origine, avec historique complet.' },
  { icon: '🧾', title: 'Facturation automatique', desc: 'Génération de la facture (PDF) dès qu\'une commande est livrée, et envoi par email au client — sans rien faire.' },
  { icon: '📈', title: 'Prévisions de stock', desc: 'Calcul de la vélocité des ventes, date de rupture estimée et quantités de réapprovisionnement suggérées par produit.' },
  { icon: '📑', title: 'Rapports & exports', desc: 'Chiffre d\'affaires, top produits, meilleurs clients et valeur de stock sur la période de votre choix. Export CSV en un clic.' },
  { icon: '⚡', title: 'Automatisations', desc: 'Facturation auto, alertes de stock, relances d\'impayés et rapport hebdomadaire : activez ce que vous voulez, en un toggle.' },
  { icon: '🔌', title: 'API publique & webhooks', desc: 'Une API REST et des webhooks pour connecter n\'importe quel site ou outil maison. Intégration sur mesure possible.' },
  { icon: '🔗', title: 'Hub d\'intégrations', desc: 'État des connexions, configuration guidée des webhooks et journal de synchronisation en temps réel.' },
]

export default function FonctionnalitesPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      <SiteHeader />

      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Fonctionnalités</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">Tout votre e-commerce, automatisé</h1>
          <p className="mt-4 text-lg text-gray-600">
            {BRAND} relie vos boutiques et prend en charge les tâches répétitives, pour que vous vous concentriez sur la vente.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl border border-gray-200 bg-white p-6 transition hover:shadow-md">
              <span className="text-3xl">{f.icon}</span>
              <h2 className="mt-4 font-bold text-gray-900">{f.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-2xl bg-indigo-600 px-8 py-12 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Prêt à arrêter la double saisie ?</h2>
          <p className="mt-3 text-indigo-100">Voyez {BRAND} en action sur votre propre boutique.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="rounded-lg bg-white px-6 py-3 font-semibold text-indigo-700 transition hover:bg-indigo-50">Demander une démo</Link>
            <Link href="/tarifs" className="rounded-lg border border-white/40 px-6 py-3 font-semibold text-white transition hover:bg-white/10">Voir les tarifs</Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
