import { Resend } from 'resend'

// Les emails ne partent que si une clé API est configurée.
export const EMAILS_ENABLED = !!process.env.RESEND_API_KEY

if (!EMAILS_ENABLED) {
  console.warn('[Resend] RESEND_API_KEY manquant — les emails ne seront pas envoyés')
}

export const resend = new Resend(process.env.RESEND_API_KEY ?? 're_missing')

// Expéditeur par défaut. `onboarding@resend.dev` fonctionne sans vérifier de
// domaine (mais ne délivre qu'à l'adresse du compte Resend en mode test).
// Pour la prod : RESEND_FROM_EMAIL="StockFlow <noreply@ton-domaine-verifie.com>".
export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? 'StockFlow <onboarding@resend.dev>'
