import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import type { Tables } from '@/lib/supabase/database.types'
import { PageHeader } from '@/components/shared/page-header'
import { canAddStore } from '@/lib/entitlements'
import StoresClient from './StoresClient'

export const dynamic = 'force-dynamic'

export default async function StoresPage() {
  const t = await getTranslations('stores')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: stores } = await supabase
    .from('stores')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  const limit = await canAddStore(supabase, user.id)

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t('title')} description={t('desc')} />
      {!limit.allowed && limit.limit !== null && (
        <div className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-foreground">
          {t('errLimit', { limit: limit.limit })}
        </div>
      )}
      <StoresClient stores={(stores ?? []) as Tables<'stores'>[]} canAdd={limit.allowed} />
    </div>
  )
}
