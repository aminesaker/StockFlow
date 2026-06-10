import Link from 'next/link'

const BASE = 'https://votreapp.vercel.app'

const ENDPOINTS = [
  {
    method: 'GET',
    path: '/api/v1/products',
    title: 'Lister les produits',
    description: 'Retourne tous vos produits.',
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
    method: 'POST',
    path: '/api/v1/products',
    title: 'Créer / mettre à jour un produit',
    description: 'Crée un produit ou met à jour si le SKU existe déjà.',
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
    method: 'GET',
    path: '/api/v1/customers',
    title: 'Lister les clients',
    description: 'Retourne les 100 derniers clients.',
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
    method: 'POST',
    path: '/api/v1/customers',
    title: 'Créer / mettre à jour un client',
    description: 'Crée un client ou met à jour si l\'email existe déjà.',
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
    method: 'GET',
    path: '/api/v1/orders',
    title: 'Lister les commandes',
    description: 'Retourne les 100 dernières commandes avec le client associé.',
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
    method: 'POST',
    path: '/api/v1/orders',
    title: 'Créer une commande',
    description: 'Crée une commande, décrémente le stock. Identifiez le client par email ou id, les produits par SKU ou id.',
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

export default function ApiDocsPage() {
  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/settings" className="text-sm text-muted-foreground hover:text-muted-foreground">← Paramètres</Link>
      </div>

      <h2 className="text-2xl font-bold text-foreground mb-1">Documentation API</h2>
      <p className="text-sm text-muted-foreground mb-8">
        Connectez n'importe quelle boutique ou script à StockFlow via l'API REST.
      </p>

      {/* Authentification */}
      <div className="rounded-xl border bg-card p-6 mb-6">
        <h3 className="font-semibold text-foreground mb-3">Authentification</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Toutes les requêtes nécessitent un header <code className="bg-muted px-1.5 py-0.5 rounded text-xs">Authorization</code> avec votre clé API.
        </p>
        <pre className="bg-gray-900 text-green-400 rounded-lg p-4 text-xs overflow-x-auto">{`curl ${BASE}/api/v1/products \\
  -H "Authorization: Bearer sf_live_votrecle..."`}</pre>
        <p className="text-xs text-muted-foreground mt-3">
          Générez vos clés dans{' '}
          <Link href="/dashboard/settings" className="text-primary hover:underline">Paramètres → Clés API</Link>.
        </p>
      </div>

      {/* Workflow typique */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-6">
        <h3 className="font-semibold text-blue-900 mb-2">🔁 Workflow typique (WooCommerce / Shopify)</h3>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Synchronisez vos produits via <code className="bg-blue-100 px-1 rounded text-xs">POST /api/v1/products</code></li>
          <li>Créez les clients à la première commande via <code className="bg-blue-100 px-1 rounded text-xs">POST /api/v1/customers</code></li>
          <li>Envoyez chaque commande via <code className="bg-blue-100 px-1 rounded text-xs">POST /api/v1/orders</code></li>
          <li>StockFlow génère automatiquement la facture et envoie l'email client</li>
        </ol>
      </div>

      {/* Endpoints */}
      <div className="space-y-4">
        {ENDPOINTS.map((ep, i) => (
          <div key={i} className="overflow-hidden rounded-xl border bg-card">
            <div className="px-5 py-4 border-b border-border flex items-center gap-3">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${METHOD_COLORS[ep.method]}`}>
                {ep.method}
              </span>
              <code className="text-sm font-mono text-foreground">{ep.path}</code>
              <span className="text-sm text-muted-foreground ml-auto">{ep.title}</span>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-sm text-muted-foreground">{ep.description}</p>

              {ep.body && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Body (JSON)</p>
                  <pre className="bg-gray-900 text-blue-300 rounded-lg p-3 text-xs overflow-x-auto">{ep.body}</pre>
                </div>
              )}

              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase mb-1">Réponse</p>
                <pre className="bg-gray-900 text-green-400 rounded-lg p-3 text-xs overflow-x-auto">{ep.response}</pre>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Codes d'erreur */}
      <div className="rounded-xl border bg-card p-6 mt-6">
        <h3 className="font-semibold text-foreground mb-3">Codes de réponse</h3>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-border">
            {[
              ['200', 'OK', 'Requête réussie'],
              ['201', 'Created', 'Ressource créée'],
              ['401', 'Unauthorized', 'Clé API manquante ou invalide'],
              ['404', 'Not Found', 'Client ou produit introuvable'],
              ['409', 'Conflict', 'Stock insuffisant'],
              ['422', 'Unprocessable Entity', 'Données invalides — voir le champ details'],
              ['500', 'Server Error', 'Erreur interne'],
            ].map(([code, status, desc]) => (
              <tr key={code}>
                <td className="py-2 pr-4 font-mono font-semibold text-foreground w-12">{code}</td>
                <td className="py-2 pr-4 text-muted-foreground w-40">{status}</td>
                <td className="py-2 text-muted-foreground">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
