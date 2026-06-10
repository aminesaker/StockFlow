import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import SiteHeader from '@/components/landing/SiteHeader'
import SiteFooter from '@/components/landing/SiteFooter'
import { BRAND } from '@/lib/brand'

export async function generateMetadata() {
  const t = await getTranslations('features.meta')
  return { title: t('title', { brand: BRAND }), description: t('description', { brand: BRAND }) }
}

const ICONS = ['🔄', '📦', '🛒', '🧾', '📈', '📑', '⚡', '🔌', '🔗']

export default async function FonctionnalitesPage() {
  const t = await getTranslations('features')
  const items = t.raw('items') as { title: string; desc: string }[]
  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">{t('kicker')}</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">{t('title')}</h1>
          <p className="mt-4 text-lg text-gray-600">{t('subtitle', { brand: BRAND })}</p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((f, i) => (
            <div key={f.title} className="rounded-2xl border border-gray-200 bg-white p-6 transition hover:shadow-md">
              <span className="text-3xl">{ICONS[i]}</span>
              <h2 className="mt-4 font-bold text-gray-900">{f.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-16 rounded-2xl bg-indigo-600 px-8 py-12 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">{t('cta.title')}</h2>
          <p className="mt-3 text-indigo-100">{t('cta.subtitle', { brand: BRAND })}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="rounded-lg bg-white px-6 py-3 font-semibold text-indigo-700 transition hover:bg-indigo-50">{t('cta.demo')}</Link>
            <Link href="/tarifs" className="rounded-lg border border-white/40 px-6 py-3 font-semibold text-white transition hover:bg-white/10">{t('cta.pricing')}</Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  )
}
