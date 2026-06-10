import { getTranslations } from 'next-intl/server'
import SiteHeader from '@/components/landing/SiteHeader'
import SiteFooter from '@/components/landing/SiteFooter'
import ContactForm from '@/components/landing/ContactForm'
import { BRAND } from '@/lib/brand'

export async function generateMetadata() {
  const t = await getTranslations('contact.meta')
  return { title: t('title', { brand: BRAND }), description: t('description', { brand: BRAND }) }
}

const INFO_ICONS = ['💬', '🔌', '⚡']

export default async function ContactPage() {
  const t = await getTranslations('contact')
  const info = t.raw('info') as { title: string; body: string }[]
  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased">
      <SiteHeader />
      <section className="mx-auto max-w-5xl px-5 py-16 sm:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">{t('kicker')}</p>
            <h1 className="mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">{t('title')}</h1>
            <p className="mt-4 text-lg text-gray-600">{t('subtitle')}</p>
            <ul className="mt-8 space-y-4 text-sm text-gray-600">
              {info.map((it, i) => (
                <li key={it.title} className="flex items-start gap-3">
                  <span className="text-xl">{INFO_ICONS[i]}</span>
                  <span><strong className="text-gray-900">{it.title}</strong><br />{it.body}</span>
                </li>
              ))}
            </ul>
          </div>
          <ContactForm />
        </div>
      </section>
      <SiteFooter />
    </div>
  )
}
