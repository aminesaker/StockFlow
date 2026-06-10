import Link from 'next/link'
import DemoForm from '@/components/landing/DemoForm'
import { BRAND } from '@/lib/brand'

export const metadata = {
  title: `${BRAND} — Synchronisez vos boutiques e-commerce, automatiquement`,
  description:
    `${BRAND} connecte WooCommerce et Shopify à un tableau de bord unique : stock en temps réel, commandes, clients et factures synchronisés automatiquement. Demandez une démo.`,
}

function Icon({ d }: { d: string }) {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      {/* ── NAV ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <a href="#" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold">{BRAND.charAt(0)}</span>
            <span className="text-lg font-bold tracking-tight">{BRAND}</span>
          </a>
          <div className="hidden items-center gap-8 text-sm font-medium text-gray-600 md:flex">
            <a href="#features" className="hover:text-gray-900">Fonctionnalités</a>
            <a href="#how" className="hover:text-gray-900">Comment ça marche</a>
            <a href="#faq" className="hover:text-gray-900">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden text-sm font-medium text-gray-600 hover:text-gray-900 sm:block">Connexion</Link>
            <a href="#demo" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700">Demander une démo</a>
          </div>
        </nav>
      </header>

      {/* ── HERO ────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-50 via-white to-white" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              WooCommerce · Shopify · et plus
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              Vos stocks, commandes et factures.<br />
              <span className="text-indigo-600">Synchronisés tout seuls.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-gray-600">
              {BRAND} connecte vos boutiques e-commerce à un seul tableau de bord. Une vente, un retour, une commande&nbsp;? Votre stock, vos clients et vos factures se mettent à jour <strong>en temps réel</strong>, sans aucune saisie manuelle.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#demo" className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700">Demander une démo gratuite</a>
              <a href="#features" className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50">Voir les fonctionnalités</a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
              <span className="flex items-center gap-1.5"><Icon d="M20 6 9 17l-5-5" /> Installation en quelques minutes</span>
              <span className="flex items-center gap-1.5"><Icon d="M20 6 9 17l-5-5" /> Sans engagement</span>
            </div>
          </div>

          {/* Maquette dashboard */}
          <div className="relative">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-2xl">
              <div className="flex items-center gap-1.5 border-b border-gray-100 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                <span className="ml-3 text-xs text-gray-400">app.tijaraflow.com</span>
              </div>
              <div className="grid grid-cols-3 gap-4 p-5">
                <div className="col-span-3 grid grid-cols-3 gap-3">
                  {[['Chiffre d’affaires', '14 280 €', 'text-indigo-600'], ['Commandes', '128', 'text-emerald-600'], ['Stock bas', '3', 'text-amber-600']].map(([l, v, c]) => (
                    <div key={l} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                      <p className="text-[11px] text-gray-400">{l}</p>
                      <p className={`mt-1 text-lg font-bold ${c}`}>{v}</p>
                    </div>
                  ))}
                </div>
                <div className="col-span-3 rounded-xl border border-gray-100 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-500">Dernières commandes</p>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">● Synchro en direct</span>
                  </div>
                  {[['#1042', 'WooCommerce', 'Payée'], ['#1041', 'Shopify', 'Préparée'], ['#1040', 'WooCommerce', 'Livrée']].map(([id, src, st]) => (
                    <div key={id} className="flex items-center justify-between border-t border-gray-50 py-2 text-xs">
                      <span className="font-medium text-gray-700">{id}</span>
                      <span className="text-gray-400">{src}</span>
                      <span className="rounded bg-indigo-50 px-2 py-0.5 text-indigo-600">{st}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PLATEFORMES ─────────────────────────────────── */}
      <section className="border-y border-gray-100 bg-gray-50/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-5 py-8 text-sm font-semibold text-gray-400">
          <span className="text-gray-500">Compatible avec&nbsp;:</span>
          <span>WooCommerce</span>
          <span>Shopify</span>
          <span className="text-gray-300">PrestaShop (bientôt)</span>
          <span className="text-gray-300">Magento (bientôt)</span>
          <span className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500">+ API ouverte pour tout site</span>
        </div>
      </section>

      {/* ── PROBLÈMES ───────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <p className="text-center text-sm font-semibold uppercase tracking-wide text-indigo-600">Vous vous reconnaissez ?</p>
        <h2 className="mx-auto mt-2 max-w-2xl text-center text-3xl font-bold tracking-tight">Gérer son stock entre plusieurs outils, ça coûte du temps et de l’argent</h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {[
            ['M12 9v4 M12 17h.01 M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z', 'Des ruptures que vous ne voyez pas venir', 'Une vente sur une boutique, et le stock n’est plus à jour ailleurs. Résultat : survente, clients déçus, commandes annulées.'],
            ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h8 M8 17h8', 'La saisie manuelle vous épuise', 'Recopier chaque commande, chaque client, chaque produit d’un outil à l’autre. Du temps perdu et des erreurs à la clé.'],
            ['M3 3v18h18 M18 17V9 M13 17V5 M8 17v-3', 'Une visibilité éclatée', 'Vos ventes sont sur WooCommerce, vos stats ailleurs, vos factures dans un 3e outil. Impossible de piloter sereinement.'],
            ['M2 9a3 3 0 0 1 0 6 M22 9a3 3 0 0 0 0 6 M8 9h8v6H8z M12 3v6 M12 15v6', 'Les factures qui passent à la trappe', 'Une commande livrée sans facture envoyée, c’est de la trésorerie en retard et un suivi compliqué.'],
          ].map(([d, t, p]) => (
            <div key={t} className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500"><Icon d={d} /></div>
              <div>
                <h3 className="font-semibold text-gray-900">{t}</h3>
                <p className="mt-1.5 text-sm text-gray-600">{p}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FONCTIONNALITÉS ─────────────────────────────── */}
      <section id="features" className="bg-gray-50/60 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <p className="text-center text-sm font-semibold uppercase tracking-wide text-indigo-600">La solution</p>
          <h2 className="mx-auto mt-2 max-w-2xl text-center text-3xl font-bold tracking-tight">Tout votre e-commerce, synchronisé et automatisé</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              ['M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z M3.27 6.96 12 12.01l8.73-5.05 M12 22.08V12', 'Synchro multi-plateformes', 'Connectez WooCommerce, Shopify et bientôt d’autres. Vos produits et commandes remontent automatiquement.'],
              ['M3 3v18h18 M7 16l4-4 3 3 5-6', 'Stock en temps réel, dans les deux sens', 'Une vente décrémente le stock, une annulation ou un remboursement le ré-incrémente. Toujours juste.'],
              ['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75', 'Clients & commandes automatiques', 'Chaque commande crée le client, les lignes et met à jour le statut sans aucune intervention.'],
              ['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8', 'Facturation automatique', 'Commande livrée = facture générée et envoyée par email au client, automatiquement.'],
              ['M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4', 'Sécurisé par conception', 'Signature des webhooks, clés API par client, protection anti-abus. Vos données restent protégées.'],
              ['M4 11a9 9 0 0 1 9 9 M4 4a16 16 0 0 1 16 16 M5 19a1 1 0 1 0 0 .01', 'API ouverte', 'Un site sur-mesure ou une plateforme non encore supportée ? Branchez-le via notre API.'],
            ].map(([d, t, p]) => (
              <div key={t} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Icon d={d} /></div>
                <h3 className="mt-4 font-semibold text-gray-900">{t}</h3>
                <p className="mt-1.5 text-sm text-gray-600">{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMMENT ÇA MARCHE ───────────────────────────── */}
      <section id="how" className="mx-auto max-w-6xl px-5 py-20">
        <p className="text-center text-sm font-semibold uppercase tracking-wide text-indigo-600">En 3 étapes</p>
        <h2 className="mt-2 text-center text-3xl font-bold tracking-tight">Opérationnel le jour même</h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {[
            ['1', 'Connectez votre boutique', 'Ajoutez votre clé dans WooCommerce ou Shopify en quelques clics. Aucun développement requis.'],
            ['2', 'Tout se synchronise', 'Produits, commandes, clients et stock remontent en temps réel dans votre tableau de bord.'],
            ['3', 'Pilotez depuis un seul endroit', 'Suivez vos ventes, votre stock et vos factures — automatisés — au même endroit.'],
          ].map(([n, t, p]) => (
            <div key={n} className="relative rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white">{n}</span>
              <h3 className="mt-4 text-lg font-semibold">{t}</h3>
              <p className="mt-1.5 text-sm text-gray-600">{p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── VALEURS ─────────────────────────────────────── */}
      <section className="bg-indigo-600">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-5 py-12 text-center text-white md:grid-cols-4">
          {[['Temps réel', 'Synchro instantanée'], ['0', 'Saisie manuelle'], ['2 sens', 'Stock vente & retour'], ['Sans', 'Engagement']].map(([v, l]) => (
            <div key={l}>
              <p className="text-3xl font-extrabold">{v}</p>
              <p className="mt-1 text-sm text-indigo-100">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ─────────────────────────────────────────── */}
      <section id="faq" className="mx-auto max-w-3xl px-5 py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight">Questions fréquentes</h2>
        <div className="mt-10 divide-y divide-gray-100">
          {[
            ['Quelles plateformes sont supportées ?', 'WooCommerce et Shopify aujourd’hui, PrestaShop et Magento bientôt. Et pour tout autre site, une API ouverte permet de se connecter.'],
            ['Combien de temps pour connecter ma boutique ?', 'Quelques minutes : vous générez une clé, vous la collez dans votre boutique, et la synchronisation démarre immédiatement.'],
            ['Mes données sont-elles sécurisées ?', 'Oui. Chaque échange est signé (HMAC), chaque client dispose de sa propre clé, et une protection anti-abus est en place.'],
            ['Faut-il des compétences techniques ?', 'Non. La connexion se fait par copier-coller d’une clé, sans aucun développement.'],
            ['Le stock se met-il à jour dans les deux sens ?', 'Oui : une vente décrémente le stock, une annulation ou un remboursement le restitue automatiquement.'],
          ].map(([q, a]) => (
            <details key={q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-gray-900">
                {q}
                <span className="ml-4 text-indigo-600 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-gray-600">{a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── DEMO / CTA ──────────────────────────────────── */}
      <section id="demo" className="relative overflow-hidden bg-gradient-to-br from-indigo-700 to-indigo-900 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2">
          <div className="text-white">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Voyez {BRAND} sur vos propres données</h2>
            <p className="mt-4 max-w-md text-lg text-indigo-100">
              Réservez une démo de 20 minutes. On connecte votre boutique en direct et vous repartez avec une vision claire de ce que l’automatisation peut vous faire gagner.
            </p>
            <ul className="mt-6 space-y-3 text-indigo-100">
              {['Démonstration sur votre cas réel', 'Réponses à toutes vos questions', 'Aucune carte bancaire requise'].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <DemoForm />
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────── */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">{BRAND.charAt(0)}</span>
            <span className="font-bold">{BRAND}</span>
          </div>
          <p className="text-sm text-gray-400">© {new Date().getFullYear()} {BRAND}. Tous droits réservés.</p>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#features" className="hover:text-gray-900">Fonctionnalités</a>
            <a href="#demo" className="hover:text-gray-900">Démo</a>
            <Link href="/login" className="hover:text-gray-900">Connexion</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
