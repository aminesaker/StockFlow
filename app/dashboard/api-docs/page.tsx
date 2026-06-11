import Link from 'next/link'
import { getTranslations } from 'next-intl/server'

const BASE = 'https://votreapp.vercel.app'

const ENDPOINTS = [
  {
    key: 'products_list', method: 'GET', path: '/api/v1/products',
    response: `{
  "data": [
    {
      "id": "uuid",
      "name": "T-shirt bleu",
      "sku": "TSH-001",
      "price": 29.99,
      "stock_quantity": 85,
      "category": "Vêtements"
    }
  ],
  "count": 1
}`,
  },
  {
    key: 'products_upsert', method: 'POST', path: '/api/v1/products',
    body: `{
  "name": "T-shirt bleu",
  "sku": "TSH-001",
  "price": 29.99,
  "stock_quantity": 100,
  "low_stock_threshold": 10,
  "category": "Vêtements"
}`,
    response: `{ "data": { "id": "uuid", "name": "T-shirt bleu", ... } }`,
  },
  {
    key: 'customers_list', method: 'GET', path: '/api/v1/customers',
    response: `{
  "data": [
    {
      "id": "uuid",
      "full_name": "Marie Dupont",
      "email": "marie@example.com",
      "city": "Paris"
    }
  ],
  "count": 1
}`,
  },
  {
    key: 'customers_upsert', method: 'POST', path: '/api/v1/customers',
    body: `{
  "full_name": "Marie Dupont",
  "email": "marie@example.com",
  "phone": "+33 6 12 34 56 78",
  "address": "12 rue de la Paix",
  "city": "Paris",
  "country": "France"
}`,
    response: `{ "data": { "id": "uuid", "full_name": "Marie Dupont", ... } }`,
  },
  {
    key: 'orders_list', method: 'GET', path: '/api/v1/orders',
    response: `{
  "data": [
    {
      "id": "uuid",
      "status": "pending",
      "total_amount": 59.98,
      "customer": { "full_name": "Marie Dupont", "email": "marie@example.com" }
    }
  ],
  "count": 1
}`,
  },
  {
    key: 'orders_create', method: 'POST', path: '/api/v1/orders',
    body: `{
  "customer_email": "marie@example.com",
  "notes": "Commande WooCommerce #1234",
  "items": [
    { "sku": "TSH-001", "quantity": 2, "unit_price": 29.99 }
  ]
}`,
    response: `{
  "data": {
    "id": "uuid",
    "status": "pending",
    "total_amount": 59.98
  }
}`,
  },
]

const METHOD_COLORS: Record<string, string> = {
  GET:    'bg-emerald-100 text-emerald-700',
  POST:   'bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  PUT:    'bg-amber-100 text-amber-700',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
}

const CODES: [string, string, string][] = [
  ['200', 'OK', 'c200'],
  ['201', 'Created', 'c201'],
  ['401', 'Unauthorized', 'c401'],
  ['404', 'Not Found', 'c404'],
  ['409', 'Conflict', 'c409'],
  ['422', 'Unprocessable Entity', 'c422'],
  ['500', 'Server Error', 'c500'],
]

export default async function ApiDocsPage() {
  const t = await getTranslations('apiDocs')
  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/settings" className="text-sm text-muted-foreground hover:text-muted-foreground">{t('back')}</Link>
      </div>

      <h2 className="text-2xl font-bold text-foreground mb-1">{t('title')}</h2>
      <p className="text-sm text-muted-foreground mb-8">{t('intro')}</p>

      {/* Authentification */}
      <div className="rounded-xl border bg-card p-6 mb-6">
        <h3 className="font-semibold text-foreground mb-3">{t('auth')}</h3>
        <p className="text-sm text-muted-foreground mb-3">
          {t('authDesc1')} <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Authorization</code> {t('authDesc2')}
        </p>
        <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-xs overflow-x-auto">{`curl ${BASE}/api/v1/products \\
  -H "Authorization: Bearer sf_live_votrecle..."`}</pre>
        <p className="text-xs text-muted-foreground mt-3">
          {t('genKeys1')}{' '}
          <Link href="/dashboard/settings" className="text-primary hover:underline">{t('settingsApiKeys')}</Link>.
        </p>
      </div>

      {/* Workflow typique */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">{t('workflowTitle')}</h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>{t('wf1')} <code className="bg-blue-100 px-1 rounded text-xs">POST /api/v1/products</code></li>
          <li>{t('wf2')} <code className="bg-blue-100 px-1 rounded text-xs">POST /api/v1/customers</code></li>
          <li>{t('wf3')} <code className="bg-blue-100 px-1 rounded text-xs">POST /api/v1/orders</code></li>
          <li>{t('wf4')}</li>
        </ol>
      </div>

      {/* Endpoints */}
      <div className="space-y-4">
        {ENDPOINTS.map((ep) => (
          <div key={ep.key} className="overflow-hidden rounded-xl border bg-card">
            <div className="px-5 py-4 border-b border-border flex items-center gap-3">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${METHOD_COLORS[ep.method]}`}>
                {ep.method}
              </span>
              <code className="text-sm font-mono text-foreground">{ep.path}</code>
              <span className="text-sm text-muted-foreground ml-auto">{t(`endpoints.${ep.key}.title`)}</span>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-sm text-muted-foreground">{t(`endpoints.${ep.key}.desc`)}</p>

              {ep.body && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">{t('bodyLabel')}</p>
                  <pre className="bg-gray-900 text-blue-300 rounded-lg p-3 text-xs overflow-x-auto">{ep.body}</pre>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-1">{t('responseLabel')}</p>
                <pre className="bg-gray-900 text-green-400 rounded-lg p-3 text-xs overflow-x-auto">{ep.response}</pre>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Codes d'erreur */}
      <div className="rounded-xl border bg-card p-6 mt-6">
        <h3 className="font-semibold text-foreground mb-3">{t('codesTitle')}</h3>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-border">
            {CODES.map(([code, status, descKey]) => (
              <tr key={code}>
                <td className="py-2 pr-4 font-mono font-semibold text-foreground w-12">{code}</td>
                <td className="py-2 pr-4 text-muted-foreground w-40">{status}</td>
                <td className="py-2 text-muted-foreground">{t(`codes.${descKey}`)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
