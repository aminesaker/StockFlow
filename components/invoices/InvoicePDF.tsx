import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10,
    paddingTop: 48,
    paddingBottom: 48,
    paddingHorizontal: 48,
    color: '#111',
    backgroundColor: '#fff',
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  brandName: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#2563eb',
  },
  brandSub: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 4,
  },
  invoiceTitle: {
    fontSize: 14,
    fontFamily: 'Helvetica-Bold',
    textAlign: 'right',
    color: '#111',
  },
  invoiceMeta: {
    fontSize: 9,
    color: '#6b7280',
    textAlign: 'right',
    marginTop: 4,
  },
  // Parties
  parties: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  partyBlock: { width: '45%' },
  partyLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  partyName: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: '#111',
    marginBottom: 3,
  },
  partyInfo: { fontSize: 9, color: '#374151', lineHeight: 1.5 },
  // Table
  table: { marginBottom: 24 },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  colDesc: { flex: 1, fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#374151' },
  colQty: { width: 50, textAlign: 'right', fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#374151' },
  colPrice: { width: 70, textAlign: 'right', fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#374151' },
  colTotal: { width: 80, textAlign: 'right', fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#374151' },
  colDescVal: { flex: 1, fontSize: 9, color: '#111' },
  colQtyVal: { width: 50, textAlign: 'right', fontSize: 9, color: '#374151' },
  colPriceVal: { width: 70, textAlign: 'right', fontSize: 9, color: '#374151' },
  colTotalVal: { width: 80, textAlign: 'right', fontSize: 9, color: '#111', fontFamily: 'Helvetica-Bold' },
  // Totals
  totalsSection: { alignItems: 'flex-end', marginBottom: 32 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    paddingVertical: 3,
  },
  totalLabel: { fontSize: 9, color: '#6b7280' },
  totalValue: { fontSize: 9, color: '#111' },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 200,
    paddingVertical: 7,
    paddingHorizontal: 8,
    backgroundColor: '#2563eb',
    borderRadius: 4,
    marginTop: 4,
  },
  grandTotalLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#fff' },
  grandTotalValue: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#fff' },
  // Status badge
  statusBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 32,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 8, color: '#9ca3af' },
})

type InvoiceData = {
  invoice_number: string
  status: string
  amount: number
  due_date: string
  paid_at?: string | null
  created_at: string
  subtotal?: number | null
  vat_rate?: number | null
  vat_amount?: number | null
  customer: {
    full_name: string
    email: string
    phone?: string | null
    address?: string | null
    city?: string | null
    country?: string | null
  }
  order?: {
    id: string
    items: {
      product: { name: string; sku: string }
      quantity: number
      unit_price: number
      total_price: number
    }[]
  } | null
}

type Seller = {
  company_name?: string | null
  address_line1?: string | null
  address_line2?: string | null
  postal_code?: string | null
  city?: string | null
  country?: string | null
  siret?: string | null
  vat_number?: string | null
  vat_exempt?: boolean | null
  legal_footer?: string | null
  payment_terms_days?: number | null
}

type Locale = 'fr' | 'en'

const STATUS_LABELS: Record<Locale, Record<string, string>> = {
  fr: { draft: 'Brouillon', sent: 'Envoyée', paid: 'Payée', overdue: 'En retard', cancelled: 'Annulée' },
  en: { draft: 'Draft', sent: 'Sent', paid: 'Paid', overdue: 'Overdue', cancelled: 'Cancelled' },
}

const DICT: Record<Locale, Record<string, string>> = {
  fr: {
    brandSub: 'Plateforme de gestion e-commerce', invoice: 'FACTURE', issuedOn: 'Émise le', due: 'Échéance :',
    issuer: 'Émetteur', billedTo: 'Facturé à', description: 'Description', qty: 'Qté', unit: 'Prix unit.', total: 'Total',
    serviceProduct: 'Prestation / Produit', subtotal: 'Sous-total HT', vat: 'TVA (0%)', totalIncl: 'Total TTC',
    paidOn: '✓ Payée le', thanks: 'Merci pour votre confiance', sku: 'SKU :', siret: 'SIRET', vatNo: 'N° TVA', vatExemptMention: 'TVA non applicable, art. 293 B du CGI',
  },
  en: {
    brandSub: 'E-commerce management platform', invoice: 'INVOICE', issuedOn: 'Issued on', due: 'Due:',
    issuer: 'From', billedTo: 'Billed to', description: 'Description', qty: 'Qty', unit: 'Unit price', total: 'Total',
    serviceProduct: 'Service / Product', subtotal: 'Subtotal (excl. tax)', vat: 'VAT (0%)', totalIncl: 'Total (incl. tax)',
    paidOn: '✓ Paid on', thanks: 'Thank you for your business', sku: 'SKU:', siret: 'SIRET', vatNo: 'VAT No.', vatExemptMention: 'VAT not applicable, art. 293 B of the French CGI',
  },
}

export default function InvoicePDF({ data, locale = 'fr', seller }: { data: InvoiceData; locale?: Locale; seller?: Seller }) {
  const L = locale === 'en' ? 'en' : 'fr'
  const dl = L === 'en' ? 'en-US' : 'fr-FR'
  const d = DICT[L]
  const fmt = (n: number) => new Intl.NumberFormat(dl, { style: 'currency', currency: 'EUR' }).format(n || 0)
  const fmtDate = (s: string) => new Date(s).toLocaleDateString(dl)
  const items = data.order?.items ?? []
  const ttc = data.amount || 0
  const vatRate = data.vat_rate ?? 0
  const subtotal = data.subtotal ?? ttc
  const vatAmount = data.vat_amount ?? 0
  const sellerName = seller?.company_name || 'TijaraFlow'
  const vatLabel = L === 'fr' ? `TVA (${vatRate} %)` : `VAT (${vatRate}%)`

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>{sellerName}</Text>
            <Text style={styles.brandSub}>{d.brandSub}</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>{d.invoice}</Text>
            <Text style={styles.invoiceMeta}>{data.invoice_number}</Text>
            <Text style={styles.invoiceMeta}>
              {d.issuedOn} {fmtDate(data.created_at)}
            </Text>
            <Text style={styles.invoiceMeta}>
              {d.due} {fmtDate(data.due_date)}
            </Text>
            <Text style={[styles.invoiceMeta, { marginTop: 4, fontFamily: 'Helvetica-Bold' }]}>
              {STATUS_LABELS[L][data.status] ?? data.status}
            </Text>
          </View>
        </View>

        {/* Parties */}
        <View style={styles.parties}>
          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>{d.issuer}</Text>
            <Text style={styles.partyName}>{sellerName}</Text>
            {seller?.address_line1 ? <Text style={styles.partyInfo}>{seller.address_line1}</Text> : null}
            {seller?.address_line2 ? <Text style={styles.partyInfo}>{seller.address_line2}</Text> : null}
            {(seller?.postal_code || seller?.city) ? <Text style={styles.partyInfo}>{[seller?.postal_code, seller?.city].filter(Boolean).join(' ')}</Text> : null}
            {seller?.country ? <Text style={styles.partyInfo}>{seller.country}</Text> : null}
            {seller?.siret ? <Text style={styles.partyInfo}>{d.siret} {seller.siret}</Text> : null}
            {seller?.vat_exempt ? (
              <Text style={styles.partyInfo}>{d.vatExemptMention}</Text>
            ) : seller?.vat_number ? (
              <Text style={styles.partyInfo}>{d.vatNo} {seller.vat_number}</Text>
            ) : null}
          </View>
          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>{d.billedTo}</Text>
            <Text style={styles.partyName}>{data.customer.full_name}</Text>
            <Text style={styles.partyInfo}>{data.customer.email}</Text>
            {data.customer.phone ? <Text style={styles.partyInfo}>{data.customer.phone}</Text> : null}
            {data.customer.address ? <Text style={styles.partyInfo}>{data.customer.address}</Text> : null}
            {data.customer.city ? (
              <Text style={styles.partyInfo}>
                {data.customer.city}{data.customer.country ? `, ${data.customer.country}` : ''}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>{d.description}</Text>
            <Text style={styles.colQty}>{d.qty}</Text>
            <Text style={styles.colPrice}>{d.unit}</Text>
            <Text style={styles.colTotal}>{d.total}</Text>
          </View>

          {items.length > 0 ? (
            items.map((item, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.colDescVal}>
                  {item.product.name}
                  {'\n'}
                  <Text style={{ color: '#9ca3af', fontSize: 8 }}>{d.sku} {item.product.sku}</Text>
                </Text>
                <Text style={styles.colQtyVal}>{item.quantity}</Text>
                <Text style={styles.colPriceVal}>{fmt(item.unit_price)}</Text>
                <Text style={styles.colTotalVal}>{fmt(item.total_price)}</Text>
              </View>
            ))
          ) : (
            <View style={styles.tableRow}>
              <Text style={styles.colDescVal}>{d.serviceProduct}</Text>
              <Text style={styles.colQtyVal}>1</Text>
              <Text style={styles.colPriceVal}>{fmt(data.amount)}</Text>
              <Text style={styles.colTotalVal}>{fmt(data.amount)}</Text>
            </View>
          )}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{d.subtotal}</Text>
            <Text style={styles.totalValue}>{fmt(subtotal)}</Text>
          </View>
          {!seller?.vat_exempt && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{vatLabel}</Text>
              <Text style={styles.totalValue}>{fmt(vatAmount)}</Text>
            </View>
          )}
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>{d.totalIncl}</Text>
            <Text style={styles.grandTotalValue}>{fmt(data.amount)}</Text>
          </View>
          {data.paid_at && (
            <View style={[styles.totalRow, { marginTop: 6 }]}>
              <Text style={[styles.totalLabel, { color: '#16a34a' }]}>
                {d.paidOn} {fmtDate(data.paid_at)}
              </Text>
            </View>
          )}
        </View>

        {/* Mentions légales */}
        <View style={{ marginTop: 18 }}>
          <Text style={{ fontSize: 8, color: '#6b7280', marginBottom: 3 }}>
            {L === 'fr' ? `Conditions de règlement : paiement à ${seller?.payment_terms_days ?? 30} jours.` : `Payment terms: due within ${seller?.payment_terms_days ?? 30} days.`}
          </Text>
          <Text style={{ fontSize: 8, color: '#9ca3af' }}>
            {seller?.legal_footer || (L === 'fr'
              ? "En cas de retard de paiement : pénalités au taux de 3 fois le taux d'intérêt légal et indemnité forfaitaire de 40 € pour frais de recouvrement (art. L441-10 du Code de commerce)."
              : 'Late payment incurs penalties at three times the legal interest rate plus a flat 40 EUR recovery fee (art. L441-10 French Commercial Code).')}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>{d.thanks}</Text>
          <Text style={styles.footerText}>{data.invoice_number}</Text>
        </View>
      </Page>
    </Document>
  )
}
