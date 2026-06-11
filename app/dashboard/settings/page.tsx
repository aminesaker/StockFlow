import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import SettingsForm from './SettingsForm'
import ApiKeysSection from './ApiKeysSection'
import WooCommerceSection from './WooCommerceSection'
import { PageHeader } from '@/components/shared/page-header'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export default async function SettingsPage() {
  const t = await getTranslations('settings')
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: settings }, { data: apiKeys }] = await Promise.all([
    supabase.from('user_settings').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('api_keys').select('id, name, key_prefix, last_used_at, created_at').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  const defaults = {
    notify_email: settings?.notify_email ?? null,
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://votreapp.vercel.app'

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
          <TabsTrigger value="apikeys">{t('tabApiKeys')}</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <SettingsForm settings={defaults} userEmail={user.email ?? ''} />
        </TabsContent>

        <TabsContent value="integrations">
          <WooCommerceSection
            apiKeyPrefix={(apiKeys ?? [])[0]?.key_prefix ?? null}
            webhookSecret={settings?.wc_webhook_secret ?? null}
            appUrl={appUrl}
          />
        </TabsContent>

        <TabsContent value="apikeys">
          <ApiKeysSection apiKeys={(apiKeys ?? []) as unknown as Parameters<typeof ApiKeysSection>[0]['apiKeys']} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
