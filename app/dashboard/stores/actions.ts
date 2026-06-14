'use server'

import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { canAddStore } from '@/lib/entitlements'
import { importShopifyProducts } from '@/lib/sync/shopify-import'
import { importSheetProducts } from '@/lib/sync/sheets-import'
import { exportProductsToSheet } from '@/lib/sync/sheets-export'

async function getUserId() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')
  return { supabase, userId: user.id }
}

const str = (v: FormDataEntryValue | null) => {
  const s = (v as string | null)?.trim()
  return s ? s : null
}

export async function createStore(formData: FormData) {
  const t = await getTranslations('stores')
  const { supabase, userId } = await getUserId()

  const name = str(formData.get('name'))
  if (!name) return { error: t('errName') }

  const limit = await canAddStore(supabase, userId)
  if (!limit.allowed) return { error: t('errLimit', { limit: limit.limit ?? 0 }) }

  const { error } = await supabase.from('stores').insert({
    user_id: userId,
    name,
    platform: str(formData.get('platform')) ?? 'woocommerce',
    domain: str(formData.get('domain')),
    webhook_secret: str(formData.get('webhook_secret')),
    access_token: str(formData.get('access_token')),
    sheet_tab: str(formData.get('sheet_tab')),
  })
  if (error) return { error: error.message }

  revalidatePath('/dashboard/stores')
  return { success: true }
}

export async function updateStore(id: string, formData: FormData) {
  const t = await getTranslations('stores')
  const { supabase } = await getUserId()

  const name = str(formData.get('name'))
  if (!name) return { error: t('errName') }

  const { error } = await supabase.from('stores').update({
    name,
    platform: str(formData.get('platform')) ?? 'woocommerce',
    domain: str(formData.get('domain')),
    webhook_secret: str(formData.get('webhook_secret')),
    access_token: str(formData.get('access_token')),
    sheet_tab: str(formData.get('sheet_tab')),
  }).eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/dashboard/stores')
  return { success: true }
}

export async function deleteStore(id: string) {
  const { supabase } = await getUserId()
  const { error } = await supabase.from('stores').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/dashboard/stores')
  return { success: true }
}

export async function importShopifyCatalog(id: string) {
  const t = await getTranslations('stores')
  const { supabase, userId } = await getUserId()

  const { data: store } = await supabase
    .from('stores')
    .select('id, platform, domain, access_token')
    .eq('id', id)
    .maybeSingle()

  if (!store) return { error: t('errNotFound') }
  if (store.platform !== 'shopify') return { error: t('errNotShopify') }
  if (!store.domain || !store.access_token) return { error: t('errMissingCreds') }

  const r = await importShopifyProducts({
    userId,
    storeId: store.id,
    domain: store.domain,
    accessToken: store.access_token,
  })
  if (r.error) return { error: r.error }

  revalidatePath('/dashboard/stores')
  revalidatePath('/dashboard/stocks')
  return { success: true, created: r.created, updated: r.updated, total: r.total }
}

export async function importGoogleSheet(id: string) {
  const t = await getTranslations('stores')
  const { supabase, userId } = await getUserId()

  const { data: store } = await supabase
    .from('stores')
    .select('id, platform, domain, sheet_tab')
    .eq('id', id)
    .maybeSingle()

  if (!store) return { error: t('errNotFound') }
  if (store.platform !== 'google_sheets') return { error: t('errNotSheets') }
  if (!store.domain) return { error: t('errNoSheetUrl') }

  const r = await importSheetProducts({
    userId,
    storeId: store.id,
    spreadsheet: store.domain,
    tab: store.sheet_tab,
  })
  if (r.error) return { error: r.error }

  revalidatePath('/dashboard/stores')
  revalidatePath('/dashboard/stocks')
  return { success: true, created: r.created, updated: r.updated, skipped: r.skipped, total: r.total }
}

export async function exportGoogleSheet(id: string) {
  const t = await getTranslations('stores')
  const { supabase, userId } = await getUserId()

  const { data: store } = await supabase
    .from('stores')
    .select('id, platform, domain, sheet_tab')
    .eq('id', id)
    .maybeSingle()

  if (!store) return { error: t('errNotFound') }
  if (store.platform !== 'google_sheets') return { error: t('errNotSheets') }
  if (!store.domain) return { error: t('errNoSheetUrl') }

  const r = await exportProductsToSheet({
    userId,
    spreadsheet: store.domain,
    tab: store.sheet_tab,
  })
  if (r.error) return { error: r.error }

  return { success: true, count: r.count }
}
