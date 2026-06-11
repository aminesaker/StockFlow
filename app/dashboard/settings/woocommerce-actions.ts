'use server'

import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'

export async function saveWooCommerceSettings(formData: FormData) {
  const t = await getTranslations('settings')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: t('errNotAuth') }

  const secret = (formData.get('wc_webhook_secret') as string)?.trim() || null

  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: user.id, wc_webhook_secret: secret }, { onConflict: 'user_id' })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings')
  return { success: true }
}
