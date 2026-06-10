import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import DemoForm from '@/components/landing/DemoForm'
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher'
import { BRAND } from '@/lib/brand'

export async function generateMetadata() {
  const t = await getTranslations('landing.meta')
  return { title: t('title', { brand: BRAND }), description: t('description', { brand: BRAND }) }
}

function Icon({ d }: { d: string }) {
  return (
    <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

type TextItem = { title: string; body: string }
type Step = { title: string; body: string }
type Value = { value: string; label: string }
type Faq = { q: string; a: string }

const PROBLEM_ICONS = [
  'M12 9v4 M12 17h.01 M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z',
  'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M8 13h8 M8 17h8',
  'M3 3v18h18 M18 17V9 M13 17V5 M8 17v-3',
  'M2 9a3 3 0 0 1 0 6 M22 9a3 3 0 0 0 0 6 M8 9h8v6H8z M12 3v6 M12 15v6',
]
const FEATURE_ICONS = [
  'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z M3.27 6.96 12 12.01l8.73-5.05 M12 22.08V12',
  'M3 3v18h18 M7 16l4-4 3 3 5-6',
  'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
  'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4',
  'M4 11a9 9 0 0 1 9 9 M4 4a16 16 0 0 1 16 16 M5 19a1 1 0 1 0 0 .01',
]

export default async function Landing() {
  const t = await getTranslations('landing')
  const tn = await getTranslations('nav')
  const tf = await getTranslations('footer')
  const problems = t.raw('problems.items') as TextItem[]
  const features = t.raw('solution.items') as TextItem[]
  const steps = t.raw('how.steps') as Step[]
  const values = t.raw('values') as Value[]
  const faqs = t.raw('faq.items') as Faq[]
  const demoBullets = t.raw('demo.bullets') as string[]

  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <a href="#" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold">{BRAND.charAt(0)}</span>
            <span className="text-lg font-bold tracking-tight">{BRAND}</span>
          </a>
          <div className="hidden items-center gap-8 text-sm font-medium text-gray-600 md:flex">
            <a href="#features" className="hover:text-gray-900">{tn('features')}</a>
            <Link href="/tarifs" className="hover:text-gray-900">{tn('pricing')}</Link>
            <a href="#faq" className="hover:text-gray-900">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/login" className="hidden text-sm font-medium text-gray-600 hover:text-gray-900 sm:block">{tn('login')}</Link>
            <a href="#demo" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700">{tn('requestDemo')}</a>
          </div>
        </nav>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-indigo-50 via-white to-white" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">{t('hero.badge')}</span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
              {t('hero.title1')}<br />
              <span className="text-indigo-600">{t('hero.title2')}</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-gray-600">{t('hero.subtitle', { brand: BRAND })}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#demo" className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700">{t('hero.ctaDemo')}</a>
              <a href="#features" className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50">{t('hero.ctaFeatures')}</a>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-500">
              <span className="flex items-center gap-1.5"><Icon d="M20 6 9 17l-5-5" /> {t('hero.trust1')}</span>
              <span className="flex items-center gap-1.5"><Icon d="M20 6 9 17l-5-5" /> {t('hero.trust2')}</span>
            </div>
          </div>
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
                  {[[t('mockup.revenue'), '14 280 €', 'text-indigo-600'], [t('mockup.orders'), '128', 'text-emerald-600'], [t('mockup.lowStock'), '3', 'text-amber-600']].map(([l, v, c]) => (
                    <div key={l} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                      <p className="text-[11px] text-gray-400">{l}</p>
                      <p className={`mt-1 text-lg font-bold ${c}`}>{v}</p>
                    </div>
                  ))}
                </div>
                <div className="col-span-3 rounded-xl border border-gray-100 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-500">{t('mockup.latest')}</p>
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-600">● {t('mockup.liveSync')}</span>
                  </div>
                  {[['#1042', 'WooCommerce', t('mockup.paid')], ['#1041', 'Shopify', t('mockup.prepared')], ['#1040', 'WooCommerce', t('mockup.delivered')]].map(([id, src, st]) => (
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

      <section className="border-y border-gray-100 bg-gray-50/60">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-4 px-5 py-8 text-sm font-semibold text-gray-400">
          <span className="text-gray-500">{t('platforms.compatible')}</span>
          <span>WooCommerce</span>
          <span>Shopify</span>
          <span className="text-gray-300">{t('platforms.soonPresta')}</span>
          <span className="text-gray-300">{t('platforms.soonMagento')}</span>
          <span className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-500">{t('platforms.apiOpen')}</span>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <p className="text-center text-sm font-semibold uppercase tracking-wide text-indigo-600">{t('problems.kicker')}</p>
        <h2 className="mx-auto mt-2 max-w-2xl text-center text-3xl font-bold tracking-tight">{t('problems.title')}</h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {problems.map((p, i) => (
            <div key={p.title} className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500"><Icon d={PROBLEM_ICONS[i]} /></div>
              <div>
                <h3 className="font-semibold text-gray-900">{p.title}</h3>
                <p className="mt-1.5 text-sm text-gray-600">{p.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="bg-gray-50/60 py-20">
        <div className="mx-auto max-w-6xl px-5">
          <p className="text-center text-sm font-semibold uppercase tracking-wide text-indigo-600">{t('solution.kicker')}</p>
          <h2 className="mx-auto mt-2 max-w-2xl text-center text-3xl font-bold tracking-tight">{t('solution.title')}</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {features.map((f, i) => (
              <div key={f.title} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600"><Icon d={FEATURE_ICONS[i]} /></div>
                <h3 className="mt-4 font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-1.5 text-sm text-gray-600">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-5 py-20">
        <p className="text-center text-sm font-semibold uppercase tracking-wide text-indigo-600">{t('how.kicker')}</p>
        <h2 className="mt-2 text-center text-3xl font-bold tracking-tight">{t('how.title')}</h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="relative rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white">{i + 1}</span>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-gray-600">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-indigo-600">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-5 py-12 text-center text-white md:grid-cols-4">
          {values.map((v) => (
            <div key={v.label}>
              <p className="text-3xl font-extrabold">{v.value}</p>
              <p className="mt-1 text-sm text-indigo-100">{v.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-3xl px-5 py-20">
        <h2 className="text-center text-3xl font-bold tracking-tight">{t('faq.title')}</h2>
        <div className="mt-10 divide-y divide-gray-100">
          {faqs.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-gray-900">
                {f.q}
                <span className="ml-4 text-indigo-600 transition group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm text-gray-600">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section id="demo" className="relative overflow-hidden bg-gradient-to-br from-indigo-700 to-indigo-900 py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 lg:grid-cols-2">
          <div className="text-white">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('demo.title', { brand: BRAND })}</h2>
            <p className="mt-4 max-w-md text-lg text-indigo-100">{t('demo.subtitle')}</p>
            <ul className="mt-6 space-y-3 text-indigo-100">
              {demoBullets.map((b) => (
                <li key={b} className="flex items-center gap-2">
                  <svg className="h-5 w-5 text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
                  {b}
                </li>
              ))}
            </ul>
          </div>
          <DemoForm />
        </div>
      </section>

      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">{BRAND.charAt(0)}</span>
            <span className="font-bold">{BRAND}</span>
          </div>
          <p className="text-sm text-gray-400">© {new Date().getFullYear()} {BRAND}. {tf('rights')}</p>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#features" className="hover:text-gray-900">{tn('features')}</a>
            <Link href="/tarifs" className="hover:text-gray-900">{tn('pricing')}</Link>
            <Link href="/login" className="hover:text-gray-900">{tn('login')}</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
