import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SettingsForm from './SettingsForm'
import ApiKeysSection from './ApiKeysSection'
import WooCommerceSection from './WooCommerceSection'
import { PageHeader } from '@/components/shared/page-header'

export default async function SettingsPage() {
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
        title="Paramètres"
        description="Automatisations et intégrations de votre espace."
        actions={<Link href="/dashboard/api-docs" className="text-sm text-primary hover:underline">Documentation API →</Link>}
      />

      <div className="space-y-6 max-w-2xl">
        {/* Automatisations */}
        <SettingsForm settings={defaults} userEmail={user.email ?? ''} />

        {/* Intégrations */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Intégrations</h3>
          <WooCommerceSection
            apiKeyPrefix={(apiKeys ?? [])[0]?.key_prefix ?? null}
            webhookSecret={settings?.wc_webhook_secret ?? null}
            appUrl={appUrl}
          />
        </div>

        {/* Clés API */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Clés API</h3>
          <ApiKeysSection apiKeys={apiKeys ?? []} />
        </div>
      </div>
    </div>
  )
}
