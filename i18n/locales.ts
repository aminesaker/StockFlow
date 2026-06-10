export const locales = ['fr', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'fr'
export const localeNames: Record<Locale, string> = { fr: 'Français', en: 'English' }
export const localeFlags: Record<Locale, string> = { fr: '🇫🇷', en: '🇬🇧' }

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value)
}

// Choisit la meilleure langue depuis un en-tête Accept-Language
export function pickLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return defaultLocale
  const prefs = acceptLanguage.split(',').map((p) => p.split(';')[0].trim().slice(0, 2).toLowerCase())
  return (prefs.find((p) => isLocale(p)) as Locale) ?? defaultLocale
}
