import Link from 'next/link'

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ invoice?: string }>
}) {
  const { invoice } = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <div className="bg-background rounded-2xl shadow-sm border border-border p-10 text-center max-w-md w-full">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Paiement confirmé</h1>
        {invoice && (
          <p className="text-muted-foreground mb-1">
            Facture <span className="font-medium text-foreground">{invoice}</span>
          </p>
        )}
        <p className="text-muted-foreground text-sm mb-8">
          Votre paiement a été traité avec succès.
        </p>
        <Link
          href="/dashboard/invoices"
          className="inline-block px-6 py-2.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
        >
          Retour aux factures
        </Link>
      </div>
    </div>
  )
}
