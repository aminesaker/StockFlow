// ────────────────────────────────────────────────────────────────────────────
// Templates email HTML pour StockFlow
// ────────────────────────────────────────────────────────────────────────────

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f9fafb; padding: 40px 16px; margin: 0;
`

function layout(content: string) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="${baseStyle}">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
    <!-- Header -->
    <div style="background:#2563eb;padding:24px 32px;">
      <p style="margin:0;color:#fff;font-size:20px;font-weight:700;letter-spacing:-0.3px;">
        📦 StockFlow
      </p>
    </div>
    <!-- Body -->
    <div style="padding:32px;">
      ${content}
    </div>
    <!-- Footer -->
    <div style="padding:16px 32px;border-top:1px solid #f3f4f6;text-align:center;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">
        StockFlow · Gestion automatisée de votre activité<br>
        <a href="#" style="color:#6b7280;text-decoration:none;">Se désabonner</a>
      </p>
    </div>
  </div>
</body>
</html>`
}

// ── 1. Alerte stock bas ────────────────────────────────────────────────────

export interface StockAlertData {
  products: { name: string; sku: string; stock_quantity: number; low_stock_threshold: number }[]
}

export function stockAlertEmail(data: StockAlertData) {
  const rows = data.products.map((p) => `
    <tr>
      <td style="padding:10px 12px;font-weight:500;color:#111827;">${p.name}</td>
      <td style="padding:10px 12px;color:#6b7280;font-family:monospace;">${p.sku}</td>
      <td style="padding:10px 12px;text-align:center;">
        <span style="background:#fee2e2;color:#dc2626;padding:2px 10px;border-radius:9999px;font-size:13px;font-weight:600;">
          ${p.stock_quantity} restant${p.stock_quantity !== 1 ? 's' : ''}
        </span>
      </td>
      <td style="padding:10px 12px;text-align:center;color:#9ca3af;">${p.low_stock_threshold}</td>
    </tr>
  `).join('')

  return layout(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">⚠️ Alerte stock bas</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">
      ${data.products.length} produit${data.products.length > 1 ? 's' : ''} sous le seuil de réapprovisionnement.
    </p>
    <table style="width:100%;border-collapse:collapse;font-size:14px;">
      <thead>
        <tr style="background:#f9fafb;border-bottom:1px solid #e5e7eb;">
          <th style="padding:10px 12px;text-align:left;color:#6b7280;font-weight:500;">Produit</th>
          <th style="padding:10px 12px;text-align:left;color:#6b7280;font-weight:500;">SKU</th>
          <th style="padding:10px 12px;text-align:center;color:#6b7280;font-weight:500;">Stock actuel</th>
          <th style="padding:10px 12px;text-align:center;color:#6b7280;font-weight:500;">Seuil</th>
        </tr>
      </thead>
      <tbody style="border:1px solid #e5e7eb;border-radius:8px;">${rows}</tbody>
    </table>
    <div style="margin-top:24px;padding:16px;background:#eff6ff;border-radius:8px;border:1px solid #bfdbfe;">
      <p style="margin:0;font-size:14px;color:#1d4ed8;">
        💡 <strong>Action recommandée :</strong> passez une commande fournisseur dès maintenant pour éviter une rupture.
      </p>
    </div>
    <div style="margin-top:24px;text-align:center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/stocks"
         style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
        Gérer le stock →
      </a>
    </div>
  `)
}

// ── 2. Facture automatique ─────────────────────────────────────────────────

export interface InvoiceEmailData {
  invoiceNumber: string
  invoiceId: string
  customerName: string
  amount: number
  dueDate: string
}

export function invoiceEmail(data: InvoiceEmailData) {
  const due = new Date(data.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const amount = data.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €'

  return layout(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">🧾 Votre facture ${data.invoiceNumber}</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">
      Bonjour ${data.customerName}, veuillez trouver ci-dessous votre facture.
    </p>
    <div style="background:#f9fafb;border-radius:10px;padding:24px;margin-bottom:24px;border:1px solid #e5e7eb;">
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
        <span style="color:#6b7280;font-size:14px;">Numéro</span>
        <span style="font-weight:600;color:#111827;">${data.invoiceNumber}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
        <span style="color:#6b7280;font-size:14px;">Échéance</span>
        <span style="font-weight:600;color:#111827;">${due}</span>
      </div>
      <div style="border-top:1px solid #e5e7eb;padding-top:12px;display:flex;justify-content:space-between;">
        <span style="font-weight:700;font-size:15px;color:#111827;">Total TTC</span>
        <span style="font-weight:700;font-size:18px;color:#2563eb;">${amount}</span>
      </div>
    </div>
    <div style="text-align:center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/invoices/${data.invoiceId}/pdf"
         style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-right:8px;">
        ⬇ Télécharger le PDF
      </a>
    </div>
  `)
}

// ── 3. Relance impayé ──────────────────────────────────────────────────────

export interface ReminderEmailData {
  invoiceNumber: string
  invoiceId: string
  customerName: string
  amount: number
  dueDate: string
  daysOverdue: number
  reminderCount: number
}

const reminderTone = (count: number) => {
  if (count === 1) return { title: 'Rappel de paiement', intro: 'Nous vous rappelons que la facture suivante est arrivée à échéance.', urgency: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' }
  if (count === 2) return { title: '2e rappel — paiement en attente', intro: 'Malgré notre premier rappel, le règlement n\'a pas encore été effectué.', urgency: '#d97706', bg: '#fffbeb', border: '#fde68a' }
  return { title: 'Dernier rappel avant procédure', intro: 'Sans règlement de votre part sous 48h, nous serons contraints d\'engager une procédure de recouvrement.', urgency: '#dc2626', bg: '#fef2f2', border: '#fecaca' }
}

export function reminderEmail(data: ReminderEmailData) {
  const tone = reminderTone(data.reminderCount)
  const due = new Date(data.dueDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
  const amount = data.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €'

  return layout(`
    <h2 style="margin:0 0 8px;font-size:22px;color:#111827;">🔔 ${tone.title}</h2>
    <p style="margin:0 0 24px;color:#6b7280;font-size:15px;">
      Bonjour ${data.customerName}, ${tone.intro}
    </p>
    <div style="background:#f9fafb;border-radius:10px;padding:24px;margin-bottom:24px;border:1px solid #e5e7eb;">
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
        <span style="color:#6b7280;font-size:14px;">Facture</span>
        <span style="font-weight:600;color:#111827;">${data.invoiceNumber}</span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-bottom:12px;">
        <span style="color:#6b7280;font-size:14px;">Échéance dépassée le</span>
        <span style="font-weight:600;color:#dc2626;">${due} (${data.daysOverdue}j de retard)</span>
      </div>
      <div style="border-top:1px solid #e5e7eb;padding-top:12px;display:flex;justify-content:space-between;">
        <span style="font-weight:700;font-size:15px;color:#111827;">Montant dû</span>
        <span style="font-weight:700;font-size:18px;color:#dc2626;">${amount}</span>
      </div>
    </div>
    <div style="padding:16px;background:${tone.bg};border-radius:8px;border:1px solid ${tone.border};margin-bottom:24px;">
      <p style="margin:0;font-size:14px;color:${tone.urgency};">
        Merci de procéder au règlement dans les meilleurs délais.
      </p>
    </div>
    <div style="text-align:center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/api/invoices/${data.invoiceId}/pdf"
         style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
        Voir la facture →
      </a>
    </div>
  `)
}

// ── 4. Rapport hebdomadaire ────────────────────────────────────────────────

export interface WeeklyReportData {
  weekLabel: string
  newOrders: number
  newCustomers: number
  revenue: number
  pendingInvoices: number
  pendingAmount: number
  overdueInvoices: number
  overdueAmount: number
  lowStockProducts: { name: string; stock_quantity: number }[]
}

export function weeklyReportEmail(data: WeeklyReportData) {
  const fmt = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) + ' €'

  const lowStockList = data.lowStockProducts.length
    ? data.lowStockProducts.map((p) =>
        `<li style="padding:4px 0;color:#374151;">${p.name} — <strong style="color:#dc2626;">${p.stock_quantity} restant${p.stock_quantity !== 1 ? 's' : ''}</strong></li>`
      ).join('')
    : '<li style="padding:4px 0;color:#6b7280;">Aucun produit en stock bas ✓</li>'

  return layout(`
    <h2 style="margin:0 0 4px;font-size:22px;color:#111827;">📊 Rapport hebdomadaire</h2>
    <p style="margin:0 0 24px;color:#9ca3af;font-size:14px;">${data.weekLabel}</p>

    <!-- KPIs -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">
      ${[
        { label: 'Nouvelles commandes', value: data.newOrders, color: '#2563eb', bg: '#eff6ff' },
        { label: 'Nouveaux clients', value: data.newCustomers, color: '#059669', bg: '#ecfdf5' },
        { label: 'CA encaissé', value: fmt(data.revenue), color: '#2563eb', bg: '#eff6ff' },
        { label: 'Factures en attente', value: `${data.pendingInvoices} (${fmt(data.pendingAmount)})`, color: '#d97706', bg: '#fffbeb' },
      ].map((k) => `
        <div style="background:${k.bg};border-radius:10px;padding:16px;">
          <p style="margin:0 0 4px;font-size:12px;color:#6b7280;">${k.label}</p>
          <p style="margin:0;font-size:18px;font-weight:700;color:${k.color};">${k.value}</p>
        </div>
      `).join('')}
    </div>

    ${data.overdueInvoices > 0 ? `
    <div style="background:#fef2f2;border-radius:10px;padding:16px;margin-bottom:16px;border:1px solid #fecaca;">
      <p style="margin:0;font-size:14px;color:#dc2626;">
        ⚠️ <strong>${data.overdueInvoices} facture${data.overdueInvoices > 1 ? 's' : ''} en retard</strong> — ${fmt(data.overdueAmount)} à recouvrer
      </p>
    </div>` : ''}

    <!-- Stock bas -->
    <div style="background:#f9fafb;border-radius:10px;padding:16px 20px;margin-bottom:24px;border:1px solid #e5e7eb;">
      <p style="margin:0 0 10px;font-size:14px;font-weight:600;color:#374151;">📦 Stocks bas</p>
      <ul style="margin:0;padding-left:18px;font-size:14px;">${lowStockList}</ul>
    </div>

    <div style="text-align:center;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard"
         style="display:inline-block;background:#2563eb;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
        Voir le tableau de bord →
      </a>
    </div>
  `)
}
