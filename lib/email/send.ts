/**
 * Fonctions d'envoi email centralisées.
 * Resend ne lève PAS d'exception sur erreur API (domaine non vérifié, etc.) :
 * il renvoie { data, error }. On inspecte donc `error` et on le logue, et on
 * saute proprement l'envoi si aucune clé API n'est configurée.
 */
import { resend, FROM_EMAIL, EMAILS_ENABLED } from './resend'
import {
  stockAlertEmail, StockAlertData,
  invoiceEmail, InvoiceEmailData,
  reminderEmail, ReminderEmailData,
  weeklyReportEmail, WeeklyReportData,
} from './templates'

type SendResult = { sent: boolean; id?: string; error?: string }

async function deliver(payload: {
  to: string; subject: string; html: string
}): Promise<SendResult> {
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

export async function sendStockAlert(to: string, data: StockAlertData) {
  return deliver({
    to,
    subject: `⚠️ ${data.products.length} produit${data.products.length > 1 ? 's' : ''} en stock bas — StockFlow`,
    html: stockAlertEmail(data),
  })
}

export async function sendInvoiceEmail(to: string, data: InvoiceEmailData) {
  return deliver({
    to,
    subject: `🧾 Facture ${data.invoiceNumber} — ${data.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`,
    html: invoiceEmail(data),
  })
}

export async function sendReminderEmail(to: string, data: ReminderEmailData) {
  const subjects = ['Rappel de paiement', '2e rappel — paiement en attente', 'Dernier rappel avant procédure']
  const subject = subjects[Math.min(data.reminderCount - 1, 2)]
  return deliver({
    to,
    subject: `🔔 ${subject} — ${data.invoiceNumber}`,
    html: reminderEmail(data),
  })
}

export async function sendWeeklyReport(to: string, data: WeeklyReportData) {
  return deliver({
    to,
    subject: `📊 Rapport hebdomadaire StockFlow — ${data.weekLabel}`,
    html: weeklyReportEmail(data),
  })
}
