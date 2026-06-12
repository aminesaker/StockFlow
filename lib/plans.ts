export type PlanId = 'starter' | 'pro' | 'business' | 'scale'

export type Plan = {
  id: PlanId
  name: string
  priceLabel: string
  priceEnv: string | null
  limits: { products: number | null; orders: number | null; stores: number | null }
  features: { automations: boolean; ai: boolean; api: boolean }
  highlights: string[]
}

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: 'starter', name: 'Starter', priceLabel: 'Gratuit', priceEnv: null,
    limits: { products: 500, orders: 500, stores: 1 },
    features: { automations: false, ai: false, api: false },
    highlights: ['500 produits', '500 commandes / mois', '1 boutique', 'Synchro temps réel'],
  },
  pro: {
    id: 'pro', name: 'Pro', priceLabel: '19 €/mois', priceEnv: 'STRIPE_PRICE_PRO',
    limits: { products: 5000, orders: 5000, stores: 1 },
    features: { automations: true, ai: false, api: false },
    highlights: ['5 000 produits', '5 000 commandes / mois', 'Automatisations', 'Alertes de stock'],
  },
  business: {
    id: 'business', name: 'Business', priceLabel: '39 €/mois', priceEnv: 'STRIPE_PRICE_BUSINESS',
    limits: { products: null, orders: null, stores: 3 },
    features: { automations: true, ai: false, api: true },
    highlights: ['Produits & commandes illimités', "Jusqu'à 3 boutiques", 'API publique', 'Automatisations'],
  },
  scale: {
    id: 'scale', name: 'Scale', priceLabel: '89 €/mois', priceEnv: 'STRIPE_PRICE_SCALE',
    limits: { products: null, orders: null, stores: null },
    features: { automations: true, ai: true, api: true },
    highlights: ['Tout Business', 'Multi-boutiques illimitées', 'IA prédictive', 'Support prioritaire'],
  },
}

export const PLAN_ORDER: PlanId[] = ['starter', 'pro', 'business', 'scale']

export function fmtLimit(n: number | null): string {
  return n === null ? '∞' : n.toLocaleString('fr-FR')
}
