'use server'

import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'

export async function saveSettings(formData: FormData) {
  const t = await getTranslations('settings')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: t('errNotAuth') }

  const { error } = await supabase
    .from('user_settings')
    .upsert(
      { user_id: user.id, notify_email: (formData.get('notify_email') as string) || user.email },
      { onConflict: 'user_id' },
    )

  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings')
  return { success: true }
}
