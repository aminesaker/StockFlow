import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { BRAND } from '@/lib/brand'
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher'

export default async function SiteHeader() {
  const t = await getTranslations('nav')
  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white">{BRAND.charAt(0)}</span>
          <span className="text-lg font-bold tracking-tight text-gray-900">{BRAND}</span>
        </Link>
        <div className="hidden items-center gap-8 text-sm font-medium text-gray-600 md:flex">
          <Link href="/fonctionnalites" className="hover:text-gray-900">{t('features')}</Link>
          <Link href="/tarifs" className="hover:text-gray-900">{t('pricing')}</Link>
          <Link href="/contact" className="hover:text-gray-900">{t('contact')}</Link>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link href="/login" className="hidden text-sm font-medium text-gray-600 hover:text-gray-900 sm:block">{t('login')}</Link>
          <Link href="/contact" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700">{t('requestDemo')}</Link>
        </div>
      </nav>
    </header>
  )
}
