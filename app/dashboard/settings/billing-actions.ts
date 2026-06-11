'use server'

import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import type { TablesInsert } from '@/lib/supabase/database.types'

const str = (v: FormDataEntryValue | null) => {
  const s = (v as string | null)?.trim()
  return s ? s : null
}

export async function saveBillingProfile(formData: FormData) {
  const t = await getTranslations('settings')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: t('errNotAuth') }

  const rate = Number(formData.get('default_vat_rate'))
  const terms = Number(formData.get('payment_terms_days'))

  const row: TablesInsert<'billing_profiles'> = {
    user_id: user.id,
    company_name: str(formData.get('company_name')),
    address_line1: str(formData.get('address_line1')),
    address_line2: str(formData.get('address_line2')),
    postal_code: str(formData.get('postal_code')),
    city: str(formData.get('city')),
    country: str(formData.get('country')) ?? 'France',
    siret: str(formData.get('siret')),
    vat_number: str(formData.get('vat_number')),
    vat_exempt: formData.get('vat_exempt') === 'on',
    default_vat_rate: Number.isFinite(rate) && rate >= 0 ? rate : 20,
    invoice_prefix: str(formData.get('invoice_prefix')) ?? 'F',
    payment_terms_days: Number.isFinite(terms) && terms >= 0 ? Math.round(terms) : 30,
    legal_footer: str(formData.get('legal_footer')),
  }

  // upsert : ne touche pas next_invoice_seq (géré par la numérotation)
  const { error } = await supabase.from('billing_profiles').upsert(row, { onConflict: 'user_id' })
  if (error) return { error: error.message }

  revalidatePath('/dashboard/settings')
  return { success: true }
}
