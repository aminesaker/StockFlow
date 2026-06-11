'use server'

import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { generateApiKey } from '@/lib/api/auth'

export async function createApiKey(formData: FormData) {
  const t = await getTranslations('settings')
  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: t('apiKeys.nameRequired') }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: t('errNotAuth') }

  const { raw, hash, prefix } = generateApiKey()

  const { error } = await supabase.from('api_keys').insert({
    user_id: user.id,
    name,
    key_prefix: prefix,
    key_hash: hash,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings')
  // Retourner la clé en clair UNE SEULE FOIS
  return { success: true, rawKey: raw }
}

export async function deleteApiKey(id: string) {
  const t = await getTranslations('settings')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: t('errNotAuth') }

  const { error } = await supabase.from('api_keys').delete().eq('id', id).eq('user_id', user.id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings')
  return { success: true }
}
