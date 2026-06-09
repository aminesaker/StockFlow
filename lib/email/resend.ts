import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  console.warn('[Resend] RESEND_API_KEY manquant — les emails ne seront pas envoyés')
}

export const resend = new Resend(process.env.RESEND_API_KEY ?? 'missing')

// Expéditeur par défaut — à adapter avec ton domaine vérifié dans Resend
export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'StockFlow <noreply@stockflow.app>'
