import { headers } from 'next/headers'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import CopyField from '@/components/app/copy-field'

export const dynamic = 'force-dynamic'

type Platform = { id: string; name: string; icon: string; topics: string[] }

const PLATFORMS: Platform[] = [
  {
    id: 'woocommerce', name: 'WooCommerce', icon: '🛍️',
    topics: ['product.created', 'product.updated', 'product.deleted', 'order.created', 'order.updated', 'customer.created', 'customer.updated', 'order.deleted'],
  },
  {
    id: 'shopify', name: 'Shopify', icon: '🟢',
    topics: ['products/create', 'products/update', 'products/delete', 'orders/create', 'orders/updated', 'orders/delete', 'customers/create', 'customers/update'],
  },
]

const COMING = [
  { name: 'PrestaShop', icon: '🧩' },
  { name: 'Magento', icon: '🟧' },
  { name: 'BigCommerce', icon: '🔵' },
  { name: 'API personnalisée', icon: '🔌' },
]

type EventRow = { id: string; source: string; action: string; status: string; detail: string | null; created_at: string }
type KeyRow = { name: string | null; key_prefix: string; last_used_at: string | null }

export default async function IntegrationsPage() {
  const t = await getTranslations('integrations')
  const timeAgo = (iso: string | null): string => {
    if (!iso) return t('never')
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return t('justNow')
    if (m < 60) return t('minAgo', { m })
    const h = Math.floor(m / 60)
    if (h < 24) return t('hAgo', { h })
    const d = Math.floor(h / 24)
    return t('dAgo', { d })
  }

  const supabase = await createClient()
  await supabase.auth.getUser()

  const h = await headers()
  const host = h.get('host') ?? 'localhost:3000'
  const proto = host.includes('localhost') ? 'http' : 'https'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? `${proto}://${host}`

  const [{ data: prods }, { data: ords }, { data: keys }, { data: events }, { data: settings }] = await Promise.all([
    supabase.from('products').select('external_source').not('external_source', 'is', null),
    supabase.from('orders').select('external_source').not('external_source', 'is', null),
    supabase.from('api_keys').select('name, key_prefix, last_used_at, created_at').order('created_at', { ascending: false }),
    supabase.from('sync_events').select('id, source, action, status, detail, created_at').order('created_at', { ascending: false }).limit(30),
    supabase.from('user_settings').select('wc_webhook_secret').maybeSingle(),
  ])

  const evs = (events as EventRow[] | null) ?? []
  const apiKeys = (keys as KeyRow[] | null) ?? []
  const hasSecret = !!settings?.wc_webhook_secret
  const sampleKey = apiKeys[0]?.key_prefix ? `${apiKeys[0].key_prefix}…` : t('yourKey')

  const countBy = (rows: { external_source: string | null }[] | null, src: string) =>
    (rows ?? []).filter((r) => r.external_source === src).length
  const lastSyncOf = (src: string) => evs.find((e) => e.source === src)?.created_at ?? null

  const state = PLATFORMS.map((p) => {
    const products = countBy(prods, p.id)
    const orders = countBy(ords, p.id)
    const lastSync = lastSyncOf(p.id)
    return { ...p, products, orders, lastSync, connected: products > 0 || orders > 0 || !!lastSync }
  })

  return (
    <div>
      <PageHeader title={t('title')} description={t('desc')} />

      {/* ── État des connexions ─────────────────────────────── */}
      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{t('connectionsState')}</h2>
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        {state.map((p) => (
          <Card key={p.id}>
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{p.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{p.name}</span>
                    {p.connected
                      ? <Badge variant="success">{t('connected')}</Badge>
                      : <Badge variant="muted">{t('notConnected')}</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{t('synced', { products: p.products, orders: p.orders })}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{t('lastSync', { time: timeAgo(p.lastSync) })}</p>
                </div>
              </div>
              <a href="#config" className="shrink-0 text-xs font-medium text-primary hover:underline">{t('configure')}</a>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Catalogue de plateformes ───────────────────────── */}
      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{t('catalog')}</h2>
      <div className="mb-8 grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {PLATFORMS.map((p) => (
          <Card key={p.id}>
            <CardContent className="flex flex-col items-center gap-2 p-5 text-center">
              <span className="text-3xl">{p.icon}</span>
              <span className="font-medium text-foreground">{p.name}</span>
              <Badge variant="success">{t('available')}</Badge>
            </CardContent>
          </Card>
        ))}
        {COMING.map((p) => (
          <Card key={p.name} className="opacity-70">
            <CardContent className="flex flex-col items-center gap-2 p-5 text-center">
              <span className="text-3xl grayscale">{p.icon}</span>
              <span className="font-medium text-foreground">{p.name}</span>
              <Badge variant="muted">{t('soon')}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Config webhooks guidée ─────────────────────────── */}
      <h2 id="config" className="mb-3 scroll-mt-20 text-sm font-semibold text-muted-foreground">{t('webhookConfig')}</h2>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted-foreground">{t('hmac')}</span>
        {hasSecret
          ? <Badge variant="success">{t('hmacOn')}</Badge>
          : <Badge variant="warning">{t('hmacOff')}</Badge>}
        <Link href="/dashboard/settings" className="text-primary hover:underline">{t('manageSecret')}</Link>
      </div>
      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        {PLATFORMS.map((p) => (
          <Card key={p.id}>
            <CardHeader><CardTitle className="flex items-center gap-2"><span>{p.icon}</span> {p.name}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">{t('webhookUrl')}</p>
                <CopyField value={`${appUrl}/api/webhooks/${p.id}?api_key=${sampleKey}`} />
                <p className="mt-1 text-[11px] text-muted-foreground">{t('replaceKey', { key: sampleKey })}</p>
              </div>
              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">{t('eventsToEnable')}</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.topics.map((tp) => (
                    <span key={tp} className="rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">{tp}</span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {apiKeys.length > 0 && (
        <p className="mb-8 text-xs text-muted-foreground">
          {t('existingKeys', { keys: apiKeys.map((k) => `${k.key_prefix}… (${k.name ?? t('unnamed')})`).join(' · ') })}
        </p>
      )}

      {/* ── Journal de synchro ─────────────────────────────── */}
      <h2 className="mb-3 text-sm font-semibold text-muted-foreground">{t('syncLog')}</h2>
      <Card>
        <CardContent className="p-0">
          {evs.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">{t('noEvents')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs text-muted-foreground">
                    <th className="px-5 py-2.5 font-medium">{t('colWhen')}</th>
                    <th className="px-5 py-2.5 font-medium">{t('colPlatform')}</th>
                    <th className="px-5 py-2.5 font-medium">{t('colAction')}</th>
                    <th className="px-5 py-2.5 font-medium">{t('colStatus')}</th>
                    <th className="px-5 py-2.5 font-medium">{t('colDetail')}</th>
                  </tr>
                </thead>
                <tbody>
                  {evs.map((e) => (
                    <tr key={e.id} className="border-b border-border last:border-0">
                      <td className="whitespace-nowrap px-5 py-2.5 text-muted-foreground">{timeAgo(e.created_at)}</td>
                      <td className="px-5 py-2.5 capitalize text-foreground">{e.source}</td>
                      <td className="px-5 py-2.5 text-muted-foreground">{e.action}</td>
                      <td className="px-5 py-2.5">
                        {e.status === 'ok'
                          ? <Badge variant="success">{t('ok')}</Badge>
                          : <Badge variant="danger">{t('errorBadge')}</Badge>}
                      </td>
                      <td className="max-w-xs truncate px-5 py-2.5 text-muted-foreground">{e.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
