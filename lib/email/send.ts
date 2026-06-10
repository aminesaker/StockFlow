/**
 * Fonctions d'envoi email centralisées (FR / EN).
 */
import { resend, FROM_EMAIL, EMAILS_ENABLED } from './resend'
import { BRAND } from '@/lib/brand'
import type { Locale } from '@/i18n/locales'
import {
  stockAlertEmail, StockAlertData,
  invoiceEmail, InvoiceEmailData,
  reminderEmail, ReminderEmailData,
  weeklyReportEmail, WeeklyReportData,
} from './templates'

type SendResult = { sent: boolean; id?: string; error?: string }

const cur = (n: number, l: Locale) => new Intl.NumberFormat(l === 'en' ? 'en-US' : 'fr-FR', { style: 'currency', currency: 'EUR' }).format(n)

async function deliver(payload: { to: string; subject: string; html: string }): Promise<SendResult> {
  if (!EMAILS_ENABLED) {
    console.warn(`[email] envoi ignoré (RESEND_API_KEY manquant) → ${payload.to}`)
    return { sent: false, error: 'RESEND_API_KEY manquant' }
  }
  try {
    const { data, error } = await resend.emails.send({ from: FROM_EMAIL, ...payload })
    if (error) {
      console.error('[email] échec Resend:', error)
      return { sent: false, error: error.message || String(error) }
    }
    return { sent: true, id: data?.id }
  } catch (e) {
    console.error('[email] exception:', e)
    return { sent: false, error: String(e) }
  }
}

export async function sendStockAlert(to: string, data: StockAlertData, locale: Locale = 'fr') {
  const n = data.products.length
  const subject = locale === 'en'
    ? `⚠️ ${n} product${n > 1 ? 's' : ''} low in stock — ${BRAND}`
    : `⚠️ ${n} produit${n > 1 ? 's' : ''} en stock bas — ${BRAND}`
  return deliver({ to, subject, html: stockAlertEmail(data, locale) })
}

export async function sendInvoiceEmail(to: string, data: InvoiceEmailData, locale: Locale = 'fr') {
  const subject = locale === 'en'
    ? `🧾 Invoice ${data.invoiceNumber} — ${cur(data.amount, locale)}`
    : `🧾 Facture ${data.invoiceNumber} — ${cur(data.amount, locale)}`
  return deliver({ to, subject, html: invoiceEmail(data, locale) })
}

export async function sendReminderEmail(to: string, data: ReminderEmailData, locale: Locale = 'fr') {
  const fr = ['Rappel de paiement', '2e rappel — paiement en attente', 'Dernier rappel avant procédure']
  const en = ['Payment reminder', '2nd reminder — payment pending', 'Final reminder before collection']
  const label = (locale === 'en' ? en : fr)[Math.min(data.reminderCount - 1, 2)]
  return deliver({ to, subject: `🔔 ${label} — ${data.invoiceNumber}`, html: reminderEmail(data, locale) })
}

export async function sendWeeklyReport(to: string, data: WeeklyReportData, locale: Locale = 'fr') {
  const subject = locale === 'en'
    ? `📊 ${BRAND} weekly report — ${data.weekLabel}`
    : `📊 Rapport hebdomadaire ${BRAND} — ${data.weekLabel}`
  return deliver({ to, subject, html: weeklyReportEmail(data, locale) })
}
