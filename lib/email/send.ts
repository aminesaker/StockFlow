/**
 * Fonctions d'envoi email centralisées.
 * Chaque fonction vérifie les préférences utilisateur avant d'envoyer.
 */
import { resend, FROM_EMAIL } from './resend'
import {
  stockAlertEmail, StockAlertData,
  invoiceEmail, InvoiceEmailData,
  reminderEmail, ReminderEmailData,
  weeklyReportEmail, WeeklyReportData,
} from './templates'

// ── Alerte stock bas ───────────────────────────────────────────────────────

export async function sendStockAlert(to: string, data: StockAlertData) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `⚠️ ${data.products.length} produit${data.products.length > 1 ? 's' : ''} en stock bas — StockFlow`,
    html: stockAlertEmail(data),
  })
}

// ── Facture automatique ────────────────────────────────────────────────────

export async function sendInvoiceEmail(to: string, data: InvoiceEmailData) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `🧾 Facture ${data.invoiceNumber} — ${data.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`,
    html: invoiceEmail(data),
  })
}

// ── Relance impayé ─────────────────────────────────────────────────────────

export async function sendReminderEmail(to: string, data: ReminderEmailData) {
  const subjects = ['Rappel de paiement', '2e rappel — paiement en attente', 'Dernier rappel avant procédure']
  const subject = subjects[Math.min(data.reminderCount - 1, 2)]
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `🔔 ${subject} — ${data.invoiceNumber}`,
    html: reminderEmail(data),
  })
}

// ── Rapport hebdomadaire ───────────────────────────────────────────────────

export async function sendWeeklyReport(to: string, data: WeeklyReportData) {
  return resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `📊 Rapport hebdomadaire StockFlow — ${data.weekLabel}`,
    html: weeklyReportEmail(data),
  })
}
