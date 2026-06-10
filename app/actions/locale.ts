'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { isLocale, type Locale } from '@/i18n/locales'

export async function setLocalePreference(locale: Locale) {
  if (!isLocale(locale)) return { error: 'Locale invalide' }
  const cookieStore = await cookies()
  cookieStore.set('NEXT_LOCALE', locale, { path: '/', maxAge: 31536000, sameSite: 'lax' })

  // Persiste la préférence pour les utilisateurs connectés (utile pour les e-mails)
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('user_settings').upsert({ user_id: user.id, locale }, { onConflict: 'user_id' })
    }
  } catch { /* non bloquant */ }

  return { success: true }
}
