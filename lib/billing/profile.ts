import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Tables } from '@/lib/supabase/database.types'

export type BillingProfile = Tables<'billing_profiles'>

/** Valeurs par défaut quand le marchand n'a pas encore rempli son profil. */
export const DEFAULT_BILLING: Omit<BillingProfile, 'user_id' | 'created_at' | 'updated_at'> = {
  company_name: null,
  address_line1: null,
  address_line2: null,
  postal_code: null,
  city: null,
  country: 'France',
  siret: null,
  vat_number: null,
  vat_exempt: false,
  default_vat_rate: 20,
  invoice_prefix: 'F',
  next_invoice_seq: 0,
  payment_terms_days: 30,
  legal_footer: null,
  logo_url: null,
}

/** Lit le profil de facturation d'un tenant, ou renvoie les défauts. */
export async function getBillingProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<BillingProfile> {
  const { data } = await supabase.from('billing_profiles').select('*').eq('user_id', userId).maybeSingle()
  if (data) return data
  return { user_id: userId, created_at: '', updated_at: '', ...DEFAULT_BILLING }
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

/**
 * À partir d'un montant TTC (ce que le client a payé) et du profil, ventile
 * HT / TVA / TTC. Si le vendeur est en franchise de TVA, le taux est 0.
 */
export function splitVat(
  totalTtc: number,
  profile: Pick<BillingProfile, 'vat_exempt' | 'default_vat_rate'>,
): { subtotal: number; vat_rate: number; vat_amount: number; amount: number } {
  const ttc = round2(totalTtc || 0)
  const rate = profile.vat_exempt ? 0 : Number(profile.default_vat_rate ?? 0)
  if (rate <= 0) return { subtotal: ttc, vat_rate: 0, vat_amount: 0, amount: ttc }
  const subtotal = round2(ttc / (1 + rate / 100))
  const vat = round2(ttc - subtotal)
  return { subtotal, vat_rate: rate, vat_amount: vat, amount: ttc }
}
