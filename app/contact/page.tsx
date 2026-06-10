import type { Metadata } from 'next'
import SiteHeader from '@/components/landing/SiteHeader'
import SiteFooter from '@/components/landing/SiteFooter'
import ContactForm from '@/components/landing/ContactForm'
import { BRAND } from '@/lib/brand'

export const metadata: Metadata = {
  title: `Contact — ${BRAND}`,
  description: `Une question, une demande de démo ou un projet d'intégration ? Contactez l'équipe ${BRAND}.`,
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      <SiteHeader />

      <section className="mx-auto max-w-5xl px-5 py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Contact</p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">Parlons de votre e-commerce</h1>
            <p className="mt-4 text-lg text-gray-600">
              Démo personnalisée, question sur les forfaits, ou intégration sur mesure : écrivez-nous, nous répondons sous 24h ouvrées.
            </p>
            <ul className="mt-8 space-y-4 text-sm text-gray-600">
              <li className="flex items-start gap-3">
                <span className="text-xl">💬</span>
                <span><strong className="text-gray-900">Démo en direct</strong><br />On vous montre {BRAND} branché sur votre boutique.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-xl">🔌</span>
                <span><strong className="text-gray-900">Intégration sur mesure</strong><br />Un site maison ? Notre API ouverte s&apos;y connecte.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-xl">⚡</span>
                <span><strong className="text-gray-900">Réponse rapide</strong><br />Sous 24h ouvrées, par une vraie personne.</span>
              </li>
            </ul>
          </div>

          <ContactForm />
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
