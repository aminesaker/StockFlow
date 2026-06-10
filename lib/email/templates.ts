// ────────────────────────────────────────────────────────────────────────────
// Templates email HTML pour TijaraFlow (FR / EN)
// ────────────────────────────────────────────────────────────────────────────
import { BRAND } from '@/lib/brand'
import type { Locale } from '@/i18n/locales'

const intl = (l: Locale) => (l === 'en' ? 'en-US' : 'fr-FR')
const cur = (n: number, l: Locale) => new Intl.NumberFormat(intl(l), { style: 'currency', currency: 'EUR' }).format(n)
const longDate = (d: string, l: Locale) => new Date(d).toLocaleDateString(intl(l), { day: 'numeric', month: 'long', year: 'numeric' })

function layout(content: string, l: Locale) {
  const tagline = l === 'en' ? 'Automated management of your business' : 'Gestion automatisée de votre activité'
  const unsub = l === 'en' ? 'Unsubscribe' : 'Se désabonner'
  return `<!DOCTYPE html>
<html lang="${l}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f9fafb;padding:40px 16px;margin:0;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
    <div style="background:#4f46e5;padding:24px 32px;">
      <p style="margin:0;color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">📦 ${BRAND}</p>
    </div>
    <div style="padding:32px;">${content}</div>
    <div style="padding:16px 32px;border-top:1px solid #f3f4f6;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">${BRAND} · ${tagline}<br>
        <a href="#" style="color:#6b7280;text-decoration:none;">${unsub}</a></p>
    </div>
  </div>
</body>
</html>`
}

const APP = process.env.NEXT_PUBLIC_APP_URL

// ── 1. Alerte stock bas ────────────────────────────────────────────────────
export interface StockAlertData {
  products: { name: string; sku: string; stock_quantity: number; low_stock_threshold: number }[]
}
export function stockAlertEmail(data: StockAlertData, l: Locale = 'fr') {
  const n = data.products.length
  const s = l === 'en'
    ? { title: '⚠️ Low-stock alert', sub: `${n} product${n > 1 ? 's' : ''} below the restock threshold.`, product: 'Product', stock: 'Current stock', threshold: 'Threshold', remaining: (q: number) => `${q} left`, tip: '💡 <strong>Recommended action:</strong> place a supplier order now to avoid a stockout.', cta: 'Manage stock →' }
    : { title: '⚠️ Alerte stock bas', sub: `${n} produit${n > 1 ? 's' : ''} sous le seuil de réapprovisionnement.`, product: 'Produit', stock: 'Stock actuel', threshold: 'Seuil', remaining: (q: number) => `${q} restant${q !== 1 ? 's' : ''}`, tip: '💡 <strong>Action recommandée :</strong> passez une commande fournisseur dès maintenant pour éviter une rupture.', cta: 'Gérer le stock →' }
  const rows = data.products.map((p) => `
    <tr>
      <td style="padding:10px 12px;font-weight:500;color:#111827;">${p.name}</td>
      <td style="padding:10px 12px;color:#6b7280;font-family:monospace;">${p.sku}</td>
      <td style="padding:10px 12px;text-align:center;"><span style="background:#fee2e2;color:#dc2626;padding:2px 10px;border-radius:9999px;font-size:13px;font-weight:600;">${s.remaining(p.stock_quantity)}</span></td>
      <td style="padding:10px 12px;text-align:center;color:#9ca3af;">${p.low_stock_threshold}</td>
    </tr>`).join('')
  return layout(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">${s.title}</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">${s.sub}</p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead><tr style="background:#f9fafb;border-bottom:1px solid #e5e7eb;">
        <th style="padding:10px 12px;text-align:left;color:#6b7280;font-weight:500;">${s.product}</th>
        <th style="padding:10px 12px;text-align:left;color:#6b7280;font-weight:500;">SKU</th>
        <th style="padding:10px 12px;text-align:center;color:#6b7280;font-weight:500;">${s.stock}</th>
        <th style="padding:10px 12px;text-align:center;color:#6b7280;font-weight:500;">${s.threshold}</th>
      </tr></thead>
      <tbody style="border:1px solid #e5e7eb;border-radius:8px;">${rows}</tbody>
    </table>
    <div style="margin-top:24px;padding:16px;background:#eef2ff;border-radius:8px;border:1px solid #c7d2fe;">
      <p style="margin:0;font-size:14px;color:#4338ca;">${s.tip}</p>
    </div>
    <div style="margin-top:24px;text-align:center;">
      <a href="${APP}/dashboard/stocks" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">${s.cta}</a>
    </div>`, l)
}

// ── 2. Facture ─────────────────────────────────────────────────────────────
export interface InvoiceEmailData { invoiceNumber: string; invoiceId: string; customerName: string; amount: number; dueDate: string }
export function invoiceEmail(data: InvoiceEmailData, l: Locale = 'fr') {
  const s = l === 'en'
    ? { title: `🧾 Your invoice ${data.invoiceNumber}`, hello: `Hello ${data.customerName}, please find your invoice below.`, number: 'Number', due: 'Due date', total: 'Total', download: '⬇ Download PDF' }
    : { title: `🧾 Votre facture ${data.invoiceNumber}`, hello: `Bonjour ${data.customerName}, veuillez trouver ci-dessous votre facture.`, number: 'Numéro', due: 'Échéance', total: 'Total TTC', download: '⬇ Télécharger le PDF' }
  return layout(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">${s.title}</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">${s.hello}</p>
    <div style="background:#f9fafb;border-radius:10px;padding:24px;margin-bottom:24px;border:1px solid #e5e7eb;">
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;"><span style="color:#6b7280;font-size:14px;">${s.number}</span><span style="font-weight:600;color:#111827;">${data.invoiceNumber}</span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;"><span style="color:#6b7280;font-size:14px;">${s.due}</span><span style="font-weight:600;color:#111827;">${longDate(data.dueDate, l)}</span></div>
      <div style="border-top:1px solid #e5e7eb;padding-top:12px;display:flex;justify-content:space-between;"><span style="font-weight:700;font-size:15px;color:#111827;">${s.total}</span><span style="font-weight:700;font-size:18px;color:#4f46e5;">${cur(data.amount, l)}</span></div>
    </div>
    <div style="text-align:center;"><a href="${APP}/api/invoices/${data.invoiceId}/pdf" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">${s.download}</a></div>`, l)
}

// ── 3. Relance impayé ──────────────────────────────────────────────────────
export interface ReminderEmailData { invoiceNumber: string; invoiceId: string; customerName: string; amount: number; dueDate: string; daysOverdue: number; reminderCount: number }
function reminderTone(count: number, l: Locale) {
  const en = [
    { title: 'Payment reminder', intro: 'This is a reminder that the following invoice is now due.', urgency: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe' },
    { title: '2nd reminder — payment pending', intro: 'Despite our first reminder, payment has not yet been received.', urgency: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    { title: 'Final reminder before collection', intro: 'Without payment within 48 hours, we will have to start a collection procedure.', urgency: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  ]
  const fr = [
    { title: 'Rappel de paiement', intro: 'Nous vous rappelons que la facture suivante est arrivée à échéance.', urgency: '#4f46e5', bg: '#eef2ff', border: '#c7d2fe' },
    { title: '2e rappel — paiement en attente', intro: "Malgré notre premier rappel, le règlement n'a pas encore été effectué.", urgency: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    { title: 'Dernier rappel avant procédure', intro: "Sans règlement de votre part sous 48h, nous serons contraints d'engager une procédure de recouvrement.", urgency: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  ]
  return (l === 'en' ? en : fr)[Math.min(count - 1, 2)]
}
export function reminderEmail(data: ReminderEmailData, l: Locale = 'fr') {
  const tone = reminderTone(data.reminderCount, l)
  const s = l === 'en'
    ? { hello: `Hello ${data.customerName}, `, invoice: 'Invoice', overdue: 'Overdue since', lateSuffix: (d: number) => `(${d} days late)`, due_amount: 'Amount due', please: 'Please proceed with payment as soon as possible.', cta: 'View invoice →' }
    : { hello: `Bonjour ${data.customerName}, `, invoice: 'Facture', overdue: 'Échéance dépassée le', lateSuffix: (d: number) => `(${d}j de retard)`, due_amount: 'Montant dû', please: 'Merci de procéder au règlement dans les meilleurs délais.', cta: 'Voir la facture →' }
  return layout(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">🔔 ${tone.title}</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">${s.hello}${tone.intro}</p>
    <div style="background:#f9fafb;border-radius:10px;padding:24px;margin-bottom:24px;border:1px solid #e5e7eb;">
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;"><span style="color:#6b7280;font-size:14px;">${s.invoice}</span><span style="font-weight:600;color:#111827;">${data.invoiceNumber}</span></div>
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;"><span style="color:#6b7280;font-size:14px;">${s.overdue}</span><span style="font-weight:600;color:#dc2626;">${longDate(data.dueDate, l)} ${s.lateSuffix(data.daysOverdue)}</span></div>
      <div style="border-top:1px solid #e5e7eb;padding-top:12px;display:flex;justify-content:space-between;"><span style="font-weight:700;font-size:15px;color:#111827;">${s.due_amount}</span><span style="font-weight:700;font-size:18px;color:#dc2626;">${cur(data.amount, l)}</span></div>
    </div>
    <div style="padding:16px;background:${tone.bg};border-radius:8px;border:1px solid ${tone.border};margin-bottom:24px;"><p style="margin:0;font-size:14px;color:${tone.urgency};">${s.please}</p></div>
    <div style="text-align:center;"><a href="${APP}/api/invoices/${data.invoiceId}/pdf" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">${s.cta}</a></div>`, l)
}

// ── 4. Rapport hebdomadaire ────────────────────────────────────────────────
export interface WeeklyReportData { weekLabel: string; newOrders: number; newCustomers: number; revenue: number; pendingInvoices: number; pendingAmount: number; overdueInvoices: number; overdueAmount: number; lowStockProducts: { name: string; stock_quantity: number }[] }
export function weeklyReportEmail(data: WeeklyReportData, l: Locale = 'fr') {
  const s = l === 'en'
    ? { title: '📊 Weekly report', kNewOrders: 'New orders', kNewCustomers: 'New customers', kRevenue: 'Revenue collected', kPending: 'Pending invoices', overdue: (n: number, a: string) => `⚠️ <strong>${n} overdue invoice${n > 1 ? 's' : ''}</strong> — ${a} to collect`, lowTitle: '📦 Low stock', remaining: (q: number) => `${q} left`, none: 'No low-stock products ✓', cta: 'Open dashboard →' }
    : { title: '📊 Rapport hebdomadaire', kNewOrders: 'Nouvelles commandes', kNewCustomers: 'Nouveaux clients', kRevenue: 'CA encaissé', kPending: 'Factures en attente', overdue: (n: number, a: string) => `⚠️ <strong>${n} facture${n > 1 ? 's' : ''} en retard</strong> — ${a} à recouvrer`, lowTitle: '📦 Stocks bas', remaining: (q: number) => `${q} restant${q !== 1 ? 's' : ''}`, none: 'Aucun produit en stock bas ✓', cta: 'Voir le tableau de bord →' }
  const low = data.lowStockProducts.length
    ? data.lowStockProducts.map((p) => `<li style="padding:4px 0;color:#374151;">${p.name} — <strong style="color:#dc2626;">${s.remaining(p.stock_quantity)}</strong></li>`).join('')
    : `<li style="padding:4px 0;color:#6b7280;">${s.none}</li>`
  const kpis = [
    { label: s.kNewOrders, value: String(data.newOrders), color: '#4f46e5', bg: '#eef2ff' },
    { label: s.kNewCustomers, value: String(data.newCustomers), color: '#059669', bg: '#ecfdf5' },
    { label: s.kRevenue, value: cur(data.revenue, l), color: '#4f46e5', bg: '#eef2ff' },
    { label: s.kPending, value: `${data.pendingInvoices} (${cur(data.pendingAmount, l)})`, color: '#d97706', bg: '#fffbeb' },
  ].map((k) => `<div style="background:${k.bg};border-radius:10px;padding:16px;"><p style="margin:0 0 4px;font-size:12px;color:#6b7280;">${k.label}</p><p style="margin:0;font-size:18px;font-weight:700;color:${k.color};">${k.value}</p></div>`).join('')
  return layout(`
    <h2 style="margin:0 0 4px;font-size:22px;color:#111827;">${s.title}</h2>
    <p style="margin:0 0 24px;color:#9ca3af;font-size:14px;">${data.weekLabel}</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">${kpis}</div>
    ${data.overdueInvoices > 0 ? `<div style="background:#fef2f2;border-radius:10px;padding:16px;margin-bottom:16px;border:1px solid #fecaca;"><p style="margin:0;font-size:14px;color:#dc2626;">${s.overdue(data.overdueInvoices, cur(data.overdueAmount, l))}</p></div>` : ''}
    <div style="background:#f9fafb;border-radius:10px;padding:16px 20px;margin-bottom:24px;border:1px solid #e5e7eb;">
      <p style="margin:0 0 10px;font-size:14px;font-weight:600;color:#374151;">${s.lowTitle}</p>
      <ul style="margin:0;padding-left:18px;font-size:14px;">${low}</ul>
    </div>
    <div style="text-align:center;"><a href="${APP}/dashboard" style="display:inline-block;background:#4f46e5;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">${s.cta}</a></div>`, l)
}
