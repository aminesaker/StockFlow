'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function saveSettings(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  // Les automatisations sont gérées sur /dashboard/automations.
  // Ici on ne touche qu'à l'email de notification (upsert partiel : les autres colonnes restent inchangées).
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
