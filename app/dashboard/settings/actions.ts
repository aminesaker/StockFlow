'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function saveSettings(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié' }

  const settings = {
    user_id: user.id,
    notify_email: (formData.get('notify_email') as string) || user.email,
    auto_invoice:       formData.get('auto_invoice') === 'on',
    stock_alerts:       formData.get('stock_alerts') === 'on',
    overdue_reminders:  formData.get('overdue_reminders') === 'on',
    weekly_report:      formData.get('weekly_report') === 'on',
  }

  const { error } = await supabase
    .from('user_settings')
    .upsert(settings, { onConflict: 'user_id' })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings')
  return { success: true }
}
