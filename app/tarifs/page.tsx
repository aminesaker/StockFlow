import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import SiteHeader from '@/components/landing/SiteHeader'
import SiteFooter from '@/components/landing/SiteFooter'
import { BRAND } from '@/lib/brand'
import { PLAN_ORDER } from '@/lib/plans'

export async function generateMetadata() {
  const t = await getTranslations('pricing.meta')
  return { title: t('title', { brand: BRAND }), description: t('description', { brand: BRAND }) }
}

const CTA_HREF: Record<string, string> = { starter: '/register', pro: '/register', business: '/contact' }

export default async function TarifsPage() {
  const t = await getTranslations('pricing')
  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      <SiteHeader />
      <section className="mx-auto max-w-6xl px-5 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">{t('kicker')}</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">{t('title')}</h1>
          <p className="mt-4 text-lg text-gray-600">{t('subtitle')}</p>
        </div>
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {PLAN_ORDER.map((id) => {
            const popular = id === 'pro'
            const highlights = t.raw(`plans.${id}.highlights`) as string[]
            return (
              <div key={id} className={popular ? 'relative rounded-2xl border-2 border-indigo-600 bg-white p-7 shadow-xl' : 'rounded-2xl border border-gray-200 bg-white p-7'}>
                {popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold text-white">{t('popular')}</span>
                )}
                <h2 className="text-lg font-bold">{t(`plans.${id}.name`)}</h2>
                <p className="mt-3 text-3xl font-extrabold tracking-tight">{t(`plans.${id}.price`)}</p>
                <Link href={CTA_HREF[id]} className={popular ? 'mt-6 block rounded-lg bg-indigo-600 px-5 py-3 text-center font-semibold text-white transition hover:bg-indigo-700' : 'mt-6 block rounded-lg border border-gray-300 px-5 py-3 text-center font-semibold text-gray-700 transition hover:bg-gray-50'}>
                  {t(`plans.${id}.cta`)}
                </Link>
                <ul className="mt-7 space-y-3 text-sm text-gray-600">
                  {highlights.map((h) => (
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
          {t('note')}{' '}
          <Link href="/contact" className="font-semibold text-indigo-600 hover:underline">{t('noteLink')}</Link>
        </p>
      </section>
      <SiteFooter />
    </div>
  )
}
