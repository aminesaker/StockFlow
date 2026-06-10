import Link from 'next/link'
import type { Metadata } from 'next'
import SiteHeader from '@/components/landing/SiteHeader'
import SiteFooter from '@/components/landing/SiteFooter'
import { BRAND } from '@/lib/brand'
import { PLANS, PLAN_ORDER } from '@/lib/plans'

export const metadata: Metadata = {
  title: `Tarifs — ${BRAND}`,
  description: `Des forfaits simples et transparents pour synchroniser et automatiser votre e-commerce avec ${BRAND}.`,
}

const CTA: Record<string, { label: string; href: string }> = {
  starter: { label: 'Commencer gratuitement', href: '/register' },
  pro: { label: 'Choisir Pro', href: '/register' },
  business: { label: 'Nous contacter', href: '/contact' },
}

export default function TarifsPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      <SiteHeader />

      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Tarifs</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">Un prix simple, qui grandit avec vous</h1>
          <p className="mt-4 text-lg text-gray-600">
            Commencez gratuitement. Passez à un forfait supérieur quand vos volumes augmentent. Sans engagement, résiliable à tout moment.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {PLAN_ORDER.map((id) => {
            const plan = PLANS[id]
            const popular = id === 'pro'
            const cta = CTA[id]
            return (
              <div
                key={id}
                className={
                  popular
                    ? 'relative rounded-2xl border-2 border-indigo-600 bg-white p-7 shadow-xl'
                    : 'rounded-2xl border border-gray-200 bg-white p-7'
                }
              >
                {popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">
                    Le plus populaire
                  </span>
                )}
                <h2 className="text-lg font-bold">{plan.name}</h2>
                <p className="mt-3 text-3xl font-extrabold tracking-tight">{plan.priceLabel}</p>
                <Link
                  href={cta.href}
                  className={
                    popular
                      ? 'mt-6 block rounded-lg bg-indigo-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-indigo-700'
                      : 'mt-6 block rounded-lg border border-gray-300 px-5 py-3 text-center font-semibold text-gray-700 transition hover:bg-gray-50'
                  }
                >
                  {cta.label}
                </Link>
                <ul className="mt-7 space-y-3 text-sm text-gray-600">
                  {plan.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2.5">
                      <svg className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>

        <p className="mt-10 text-center text-sm text-gray-500">
          Besoin d&apos;un volume sur mesure ou d&apos;un accompagnement ?{' '}
          <Link href="/contact" className="font-semibold text-indigo-600 hover:underline">Parlons-en →</Link>
        </p>
      </section>

      <SiteFooter />
    </div>
  )
}
