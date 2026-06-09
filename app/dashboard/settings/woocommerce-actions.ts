'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function saveWooCommerceSettings(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const secret = (formData.get('wc_webhook_secret') as string)?.trim() || null

  const { error } = await supabase
    .from('user_settings')
    .upsert({ user_id: user.id, wc_webhook_secret: secret }, { onConflict: 'user_id' })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings')
  return { success: true }
}
