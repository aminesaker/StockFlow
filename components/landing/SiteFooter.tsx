import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { BRAND } from '@/lib/brand'

export default async function SiteFooter() {
  const t = await getTranslations('footer')
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">{BRAND.charAt(0)}</span>
          <span className="font-bold text-gray-900">{BRAND}</span>
        </div>
        <p className="text-sm text-gray-400">© {new Date().getFullYear()} {BRAND}. {t('rights')}</p>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
          <Link href="/fonctionnalites" className="hover:text-gray-900">{t('features')}</Link>
          <Link href="/tarifs" className="hover:text-gray-900">{t('pricing')}</Link>
          <Link href="/contact" className="hover:text-gray-900">{t('contact')}</Link>
          <Link href="/login" className="hover:text-gray-900">{t('login')}</Link>
        </div>
      </div>
    </footer>
  )
}
