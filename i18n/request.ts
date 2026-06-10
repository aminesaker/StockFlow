import { getRequestConfig } from 'next-intl/server'
import { cookies, headers } from 'next/headers'
import { defaultLocale, isLocale, pickLocale, type Locale } from './locales'

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('NEXT_LOCALE')?.value
  let locale: Locale
  if (isLocale(cookieLocale)) {
    locale = cookieLocale
  } else {
    const accept = (await headers()).get('accept-language')
    locale = pickLocale(accept) ?? defaultLocale
  }
  const messages = (await import(`../messages/${locale}.json`)).default
  return { locale, messages }
})
