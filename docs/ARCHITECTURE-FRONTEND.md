# StockFlow / TijaraFlow — Architecture Frontend

> Livrable d'architecture pour le frontend du SaaS. **Principe directeur : on construit un *système* (design system + templates + boucle d'activation), pas une collection de 40 pages.** Chaque écran devient ensuite un assemblage rapide, cohérent, typé contre le vrai schéma Supabase et branché sur le moteur backend déjà livré (synchro Woo/Shopify, stock, factures, prévision, API v1, rate-limiting, observabilité).

---

## 0. Principes directeurs

1. **Système > pages.** ~18 composants réutilisables + 5 templates de page = 80 % du travail. Le reste est de l'assemblage.
2. **La boucle d'activation est le héros.** Register → connexion boutique guidée → dashboard qui se remplit → 1ʳᵉ alerte. Tout orbite autour de ce parcours.
3. **Les états sont de première classe.** Chaque écran a : *empty / loading / error / forbidden*. Pour un produit de données, **l'état vide EST l'onboarding**.
4. **Server-first (Next 16).** React Server Components par défaut, Server Actions pour les mutations, streaming + Suspense, état de liste piloté par l'URL, types Supabase générés.
5. **Réutiliser l'existant.** On refond les pages actuelles sous le design system, on ne repart pas de zéro.
6. **Scope discipliné : Now / Next / Later.** On ne construit pas de workflow builder ni de multi-boutiques en v1.

---

## 1. Arborescence App Router (cible)

Route groups pour isoler les layouts. `(marketing)` public, `(auth)` centré, `(app)` authentifié avec sidebar.

```
app/
├─ layout.tsx                 # root : <html>, fonts, ThemeProvider (dark mode), <Toaster/>
├─ globals.css                # Tailwind v4 + tokens (variables CSS)
│
├─ page.tsx                   # Landing TijaraFlow                       ✅ existe
│
├─ (marketing)/               # layout public (nav + footer marketing)
│  ├─ layout.tsx
│  ├─ fonctionnalites/page.tsx
│  ├─ tarifs/page.tsx         # pricing — mappé sur les produits Stripe
│  └─ contact/page.tsx        # formulaire (réutilise le pattern demo-request)
│
├─ (auth)/                    # layout centré minimal
│  ├─ layout.tsx
│  ├─ login/page.tsx          ✅ existe (à refondre)
│  ├─ register/page.tsx       ✅ existe (à refondre)
│  ├─ mot-de-passe-oublie/page.tsx
│  └─ reset/page.tsx
│
├─ (app)/                     # layout app : Sidebar + Header + Breadcrumb + garde session
│  ├─ layout.tsx              # vérifie l'auth, charge user + plan (entitlements)
│  ├─ onboarding/page.tsx     # ★ connexion boutique guidée (cœur de l'activation)
│  │
│  ├─ dashboard/
│  │  ├─ page.tsx             # KPI + graphes + checklist "Bien démarrer"
│  │  └─ loading.tsx          # skeleton
│  │
│  ├─ produits/
│  │  ├─ page.tsx             # ListPage (DataTable + filtres URL + export CSV)
│  │  ├─ loading.tsx
│  │  ├─ nouveau/page.tsx     # FormPage
│  │  └─ [id]/page.tsx        # DetailPage (infos + mouvements de stock)
│  │
│  ├─ commandes/
│  │  ├─ page.tsx             # ListPage (statuts colorés)
│  │  └─ [id]/page.tsx        # DetailPage (lignes, paiement, facture liée, historique)
│  │
│  ├─ clients/
│  │  ├─ page.tsx
│  │  └─ [id]/page.tsx        # DetailPage (commandes, factures, total dépensé, notes)
│  │
│  ├─ factures/
│  │  ├─ page.tsx             # ListPage (télécharger / voir PDF / envoyer)
│  │  └─ [id]/page.tsx        # aperçu PDF + actions
│  │
│  ├─ stocks/page.tsx         # vue globale (bas / ruptures) + historique mouvements
│  ├─ previsions/page.tsx     # prévision par vélocité                   ✅ existe
│  │
│  ├─ integrations/           # HUB unique (remplace "Boutiques" + "Intégrations")
│  │  ├─ page.tsx             # cartes : WooCommerce, Shopify, Stripe, Resend
│  │  └─ woocommerce/page.tsx # statut, URL webhook, secret, dernière synchro, logs
│  │
│  ├─ automatisations/page.tsx # toggles (facture auto, alerte stock, rapport hebdo)
│  ├─ rapports/page.tsx        # ventes / produits / stocks / clients + exports
│  │
│  └─ parametres/
│     ├─ page.tsx             # Profil (nom, email, mot de passe)
│     ├─ entreprise/page.tsx  # société, adresse, TVA, SIRET, logo
│     ├─ notifications/page.tsx
│     ├─ api/page.tsx         # API Keys (générer / copier / révoquer)  ✅ existe (settings)
│     └─ facturation/page.tsx # Billing : plan, usage vs limites, upgrade Stripe
│
└─ api/                       # backend — tout existe déjà               ✅
   ├─ webhooks/{woocommerce,shopify}/
   ├─ v1/{products,orders,customers,forecast}/
   ├─ demo-request/  health/  cron/  stripe/  invoices/[id]/pdf/
```

**Fichiers spéciaux à systématiser** dans chaque dossier de route : `loading.tsx` (skeleton), `error.tsx` (état d'erreur), et un `not-found.tsx` global. C'est gratuit avec l'App Router et ça donne le « rapide » perçu.

> **Migration depuis l'existant** : les pages actuelles sont sous `app/dashboard/*`. On les déplace sous `app/(app)/...` (le groupe `(app)` n'apparaît pas dans l'URL → les URLs restent propres). Faisable progressivement, page par page.

---

## 2. Design System

### 2.1 Tokens (fondation thème + dark mode)

Définis en variables CSS dans `globals.css`, consommés par Tailwind. Le dark mode devient un simple `class="dark"` sur `<html>`.

| Catégorie | Décisions |
|---|---|
| **Couleurs** | `--primary` (indigo), `--bg`, `--surface`, `--border`, `--muted`, `--success`, `--warning`, `--danger` — chaque token a sa variante claire/sombre |
| **Typo** | 1 police (Geist ou Inter). Échelle : `xs→3xl`. Titres `font-semibold`, corps `text-sm` |
| **Espacement** | Échelle Tailwind par défaut (4px). Conteneur app : `max-w-6xl` |
| **Rayon** | `--radius` (lg = 12px cards, md = 8px inputs/boutons) |
| **Élévation** | `shadow-sm` cards, `shadow-lg` modals/popovers |

### 2.2 Primitives (base shadcn/ui — recommandé)

Tu **possèdes** ces composants (Radix sous le capot → accessibilité + dark mode + thème gratuits). À installer une fois, à la racine du système.

| Primitive | Usage |
|---|---|
| `Button` | variants : primary / secondary / ghost / danger |
| `Input`, `Textarea`, `Select`, `Checkbox`, `Switch` | formulaires |
| `Card` | conteneur de section |
| `Badge` | statuts (commande, stock, plan) |
| `Table` | base de la DataTable |
| `Dialog` / `Sheet` | modals (création rapide) / panneau latéral mobile |
| `Tabs` | pages de détail et paramètres |
| `DropdownMenu` | actions de ligne (⋯) |
| `Tooltip`, `Toast` (sonner ✅ déjà là) | feedback |
| `Skeleton` | états de chargement |
| `Avatar`, `Separator` | header / divers |

### 2.3 Composants composites (le vrai accélérateur)

Construits **une fois** sur les primitives, réutilisés partout :

| Composant | Rôle |
|---|---|
| **`PageHeader`** | titre + sous-titre + actions + breadcrumb |
| **`StatCard`** | KPI : label, valeur, variation, icône (dashboard) |
| **`DataTable<T>`** | tableau générique : colonnes typées, tri, sélection, pagination, états intégrés |
| **`FilterBar`** | recherche + filtres pilotés par l'URL (déjà esquissé sur Stocks) |
| **`EmptyState`** | icône + titre + texte + CTA (par écran) |
| **`StatusBadge`** | mapping statut → couleur (commandes, stock, factures, prévision) |
| **`ConnectionCard`** | carte d'intégration : logo, statut, dernière synchro, actions |
| **`ChecklistOnboarding`** | étapes d'activation cochables |
| **`UsageMeter`** | barre usage vs limite du plan (billing) |

### 2.4 Les 5 templates de page

Chaque écran réutilise un de ces 5 archétypes → cohérence et vitesse.

1. **`ListTemplate`** — `PageHeader` + `FilterBar` + `DataTable` + pagination + (empty/loading/error). → Produits, Commandes, Clients, Factures.
2. **`DetailTemplate`** — `PageHeader` + `Tabs` + cards de contenu. → fiches Produit/Commande/Client/Facture.
3. **`FormTemplate`** — `PageHeader` + sections de formulaire + barre d'actions sticky. → création/édition.
4. **`DashboardTemplate`** — grille de `StatCard` + zone graphes + actions rapides + checklist.
5. **`SettingsTemplate`** — navigation par onglets/sections + cards de formulaire. → Paramètres, Facturation.

---

## 3. Architecture data & performance (Next 16)

| Décision | Détail |
|---|---|
| **RSC par défaut** | Les pages sont des Server Components : data récupérée côté serveur, zéro JS inutile envoyé. |
| **Server Actions** | Toutes les mutations (créer produit, changer statut, générer facture) — pattern déjà en place dans l'app. |
| **Streaming + Suspense** | `loading.tsx` + `<Suspense>` autour des zones lentes (graphes) → la page s'affiche immédiatement, les données arrivent en flux. |
| **Types générés** | Générer les types Supabase (`supabase gen types`) → typage de bout en bout, fin des `any`. |
| **État de liste dans l'URL** | `?q=&status=&page=` → partageable, navigable, cache-friendly (déjà fait sur Stocks). |
| **Une seule `DataTable`** | Toute la pagination/tri/sélection centralisée. |
| **Cache & revalidation** | `revalidatePath`/`revalidateTag` après mutation ; données dashboard en cache court. |

### 3.1 Modèle d'entitlements (clé pour le pricing)

Le pricing n'est pas un tableau décoratif : c'est un **système de limites appliqué dans le code**.

```ts
// lib/plans.ts
export const PLANS = {
  starter:  { products: 500,   orders: 500,   stores: 1, automations: false, ai: false, api: false },
  pro:      { products: 5000,  orders: 5000,  stores: 1, automations: true,  ai: false, api: false },
  business: { products: Infinity, orders: Infinity, stores: Infinity, automations: true, ai: true, api: true },
} as const
// table user_subscriptions(user_id, plan, status, current_period_end)
// helper requireEntitlement(userId, 'api') → 403 + invite upgrade
```

Branché sur Stripe (webhook met à jour `user_subscriptions`). Le frontend lit le plan dans le layout `(app)` et affiche `UsageMeter` + gating.

---

## 4. Contrat d'états (par écran)

Chaque template gère **systématiquement** :

- **Loading** → `Skeleton` (jamais de spinner plein écran).
- **Empty** → `EmptyState` avec CTA *contextuel* (ex. liste produits vide → « Connectez votre boutique » ou « Ajouter un produit »). **C'est l'onboarding déguisé.**
- **Error** → `error.tsx` avec message clair + bouton « Réessayer ».
- **Forbidden** (plan insuffisant) → carte « Cette fonctionnalité est dans le plan Pro » + bouton upgrade.

---

## 5. Boucle d'activation & onboarding

Le parcours qu'on optimise avant tout :

```
Register ──► (app)/onboarding ──► dashboard (se remplit) ──► 1ʳᵉ alerte de rupture
                  │
                  └─ 1. Coller la clé API dans WooCommerce (guide visuel)
                     2. Voir « Synchronisation en cours… » puis ✓ X produits importés
                     3. Activer les alertes de stock
```

**Checklist « Bien démarrer »** persistée (table `onboarding_steps` ou flags dans `user_settings`), affichée sur le dashboard tant qu'incomplète :

- ☐ Connecter une boutique
- ☐ Première synchronisation réussie
- ☐ Configurer les alertes de stock
- ☐ (optionnel) Générer la première facture

**Métrique d'activation** = % d'utilisateurs ayant connecté une boutique + 1 synchro réussie sous 24 h. C'est LE chiffre à suivre.

---

## 6. Scope Now / Next / Later

| Domaine | Now (Sprint 0-2) | Next (Sprint 3-4) | Later |
|---|---|---|---|
| Auth | login/register/reset | — | SSO, 2FA |
| Activation | onboarding boutique, checklist | — | — |
| Dashboard | KPI + 2 graphes | + graphes avancés | — |
| Produits / Commandes / Stocks / **Prévisions** ✅ | refonte design system | mouvements de stock détaillés | — |
| Intégrations | hub + WooCommerce | Shopify UI | autres plateformes |
| Clients / Factures | — | liste + détail + PDF + envoi | — |
| Billing | — | Stripe + entitlements | usage-based |
| Automatisations | — | **toggles** (pas de builder) | workflow builder |
| Rapports / IA | prévision (fait) | page rapports + exports | modèle saisonnier |
| Plateforme | dark mode (gratuit via tokens) | — | équipe/rôles, multi-boutiques |

---

## 7. Sprint 0 — Fondations *(rien de visible client, mais tout devient 5× plus rapide)*

**Objectif :** poser le système pour que chaque page suivante prenne des heures, pas des jours.

| Lot | Livrable | Definition of Done |
|---|---|---|
| Thème | Tokens CSS + dark mode + `ThemeProvider` + toggle | Bascule clair/sombre sur toute l'app |
| shadcn/ui | Installation + 12 primitives configurées aux tokens | Storybook ou page `/_kit` qui les montre |
| Composites | `PageHeader`, `StatCard`, `DataTable`, `FilterBar`, `EmptyState`, `StatusBadge` | Typés, testés sur données factices |
| Templates | Les 5 templates de page | Une page de démo par template |
| Layout `(app)` | Sidebar + Header + Breadcrumb + responsive + garde session + lecture du plan | Navigation complète, mobile OK |
| Data | Types Supabase générés + client typé + helper entitlements | `any` éliminés sur la couche data |
| États | `loading.tsx`/`error.tsx` standardisés | Présents sur chaque route |

---

## 8. Sprint 1 — Boucle d'activation *(le premier vrai « waouh »)*

**Objectif :** un nouvel inscrit connecte sa boutique et voit ses données affluer.

| Écran | Composants | Données | Critères d'acceptation |
|---|---|---|---|
| **Auth** (login/register/reset) | `FormTemplate`, `Input`, `Button` | Supabase Auth | Inscription → redirige vers `/onboarding` |
| **Onboarding** | `ChecklistOnboarding`, `ConnectionCard`, guide visuel, polling de statut | clé API, webhooks, 1ʳᵉ synchro | « X produits importés ✓ » s'affiche en direct |
| **Dashboard** | `DashboardTemplate`, `StatCard`×6, 2 graphes (recharts ✅), actions rapides, checklist | KPI (CA, commandes, produits, stock bas, factures, boutiques) | Se remplit après synchro ; états vides soignés avant |

**KPI du dashboard (sources réelles) :**

| Card | Source |
|---|---|
| Chiffre d'affaires (mois) | `sum(orders.total_amount)` mois courant |
| Commandes (mois) | `count(orders)` mois courant |
| Produits | `count(products)` |
| Stock faible | `count(products where stock <= low_stock_threshold)` |
| Factures (impayées/total) | `count(invoices)` |
| Boutiques connectées | `distinct external_source` actifs |

**Graphes :** Revenus (ligne, 30 j) · Commandes (barres, 30 j) · Top produits (barres) · Évolution du stock (à partir des mouvements).

---

## 9. Flux de navigation clés

```
Visiteur  : Landing → Tarifs/Fonctionnalités → Register
Activation: Register → Onboarding → (connexion boutique) → Dashboard
Quotidien : Dashboard → Commandes → détail → facture liée → envoi
Stock     : Dashboard (alerte) → Prévisions → "à commander" → Produit → réappro
Compte    : Sidebar → Paramètres / Facturation / Intégrations
```

---

## 10. Inventaire de l'existant (à réutiliser / refondre)

**Backend prêt (à exposer, pas à reconstruire) :** synchro Woo/Shopify (adaptateurs), stock bidirectionnel, commandes/clients/factures, **prévision** (`forecast_stock` + API + page), API v1, rate-limiting, observabilité (`error_logs`, `/api/health`), landing + formulaire démo, emails Resend (mode test).

**Frontend existant à refondre sous le design system :** dashboard, stocks, commandes, clients, factures, paramètres (+ API keys + WooCommerce section), prévisions, login/register.

**À créer :** onboarding, hub intégrations, automatisations (toggles), rapports, billing, pages marketing (tarifs/fonctionnalités/contact), reset password.

---

## Recommandation finale

**Démarrer par le Sprint 0.** Tant que le design system + les templates + le layout `(app)` ne sont pas posés, toute page produite sera incohérente et lente à maintenir. Une fois la fondation en place, on enchaîne Sprint 1 (activation) puis le reste, page par page, chacune typée et branchée sur le moteur réel.

**Décision à acter pour lancer le Sprint 0 :** adopte-t-on **shadcn/ui** (recommandé) ou garde-t-on un kit Tailwind maison ?
