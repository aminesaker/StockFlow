import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import SettingsForm from './SettingsForm'
import ApiKeysSection from './ApiKeysSection'
import WooCommerceSection from './WooCommerceSection'
import ShopifySection from './ShopifySection'
import GoogleSheetsSection from './GoogleSheetsSection'
import BillingProfileForm from './BillingProfileForm'
import { getBillingProfile } from '@/lib/billing/profile'
import { PageHeader } from '@/components/shared/page-header'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export default async function SettingsPage() {
  const t = await getTranslations('settings')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: settings }, { data: apiKeys }, billingProfile, { data: stores }] = await Promise.all([
    supabase.from('user_settings').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('api_keys').select('id, name, key_prefix, last_used_at, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
    getBillingProfile(supabase, user.id),
    supabase.from('stores').select('id, name').eq('user_id', user.id).order('created_at', { ascending: true }),
  ])

  const defaults = {
    notify_email: settings?.notify_email ?? null,
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://votreapp.vercel.app'
  const serviceEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? null

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('desc')}
        actions={<Link href="/dashboard/api-docs" className="text-sm text-primary hover:underline">{t('apiDocs')}</Link>}
      />

      <Tabs defaultValue="notifications" className="max-w-2xl">
        <TabsList>
          <TabsTrigger value="notifications">{t('tabNotifications')}</TabsTrigger>
          <TabsTrigger value="integrations">{t('tabIntegrations')}</TabsTrigger>
          <TabsTrigger value="billing">{t('tabBilling')}</TabsTrigger>
          <TabsTrigger value="apikeys">{t('tabApiKeys')}</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <SettingsForm settings={defaults} userEmail={user.email ?? ''} />
        </TabsContent>

        <TabsContent value="integrations">
          <div className="space-y-5">
            <WooCommerceSection
              apiKeyPrefix={(apiKeys ?? [])[0]?.key_prefix ?? null}
              webhookSecret={settings?.wc_webhook_secret ?? null}
              appUrl={appUrl}
            />
            <ShopifySection appUrl={appUrl} />
            <GoogleSheetsSection serviceEmail={serviceEmail} />
          </div>
        </TabsContent>

        <TabsContent value="billing">
          <BillingProfileForm profile={billingProfile} />
        </TabsContent>

        <TabsContent value="apikeys">
          <ApiKeysSection apiKeys={(apiKeys ?? []) as unknown as Parameters<typeof ApiKeysSection>[0]['apiKeys']} stores={stores ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
