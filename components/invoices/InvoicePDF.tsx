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

const STATUS_FR: Record<string, string> = {
  draft: 'Brouillon',
  sent: 'Envoyée',
  paid: 'Payée',
  overdue: 'En retard',
  cancelled: 'Annulée',
}

const fmt = (n: number) =>
  n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

export default function InvoicePDF({ data }: { data: InvoiceData }) {
  const items = data.order?.items ?? []
  const subtotal = items.length > 0
    ? items.reduce((s, i) => s + i.total_price, 0)
    : data.amount

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>StockFlow</Text>
            <Text style={styles.brandSub}>Plateforme de gestion e-commerce</Text>
          </View>
          <View>
            <Text style={styles.invoiceTitle}>FACTURE</Text>
            <Text style={styles.invoiceMeta}>{data.invoice_number}</Text>
            <Text style={styles.invoiceMeta}>
              Émise le {new Date(data.created_at).toLocaleDateString('fr-FR')}
            </Text>
            <Text style={styles.invoiceMeta}>
              Échéance : {new Date(data.due_date).toLocaleDateString('fr-FR')}
            </Text>
            <Text style={[styles.invoiceMeta, { marginTop: 4, fontFamily: 'Helvetica-Bold' }]}>
              {STATUS_FR[data.status] ?? data.status}
            </Text>
          </View>
        </View>

        {/* Parties */}
        <View style={styles.parties}>
          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>Émetteur</Text>
            <Text style={styles.partyName}>StockFlow SAS</Text>
            <Text style={styles.partyInfo}>contact@stockflow.app</Text>
          </View>
          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>Facturé à</Text>
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
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colQty}>Qté</Text>
            <Text style={styles.colPrice}>Prix unit.</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>

          {items.length > 0 ? (
            items.map((item, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.colDescVal}>
                  {item.product.name}
                  {'\n'}
                  <Text style={{ color: '#9ca3af', fontSize: 8 }}>SKU : {item.product.sku}</Text>
                </Text>
                <Text style={styles.colQtyVal}>{item.quantity}</Text>
                <Text style={styles.colPriceVal}>{fmt(item.unit_price)}</Text>
                <Text style={styles.colTotalVal}>{fmt(item.total_price)}</Text>
              </View>
            ))
          ) : (
            <View style={styles.tableRow}>
              <Text style={styles.colDescVal}>Prestation / Produit</Text>
              <Text style={styles.colQtyVal}>1</Text>
              <Text style={styles.colPriceVal}>{fmt(data.amount)}</Text>
              <Text style={styles.colTotalVal}>{fmt(data.amount)}</Text>
            </View>
          )}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Sous-total HT</Text>
            <Text style={styles.totalValue}>{fmt(subtotal)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TVA (0%)</Text>
            <Text style={styles.totalValue}>{fmt(0)}</Text>
          </View>
          <View style={styles.grandTotalRow}>
            <Text style={styles.grandTotalLabel}>Total TTC</Text>
            <Text style={styles.grandTotalValue}>{fmt(data.amount)}</Text>
          </View>
          {data.paid_at && (
            <View style={[styles.totalRow, { marginTop: 6 }]}>
              <Text style={[styles.totalLabel, { color: '#16a34a' }]}>
                ✓ Payée le {new Date(data.paid_at).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>StockFlow — Merci pour votre confiance</Text>
          <Text style={styles.footerText}>{data.invoice_number}</Text>
        </View>
      </Page>
    </Document>
  )
}
