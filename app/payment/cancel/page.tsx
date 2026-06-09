import Link from 'next/link'

export default async function PaymentCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ invoice?: string }>
}) {
  const { invoice } = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center max-w-md w-full">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Paiement annulé</h1>
        {invoice && (
          <p className="text-gray-500 mb-1">
            Facture <span className="font-medium text-gray-700">{invoice}</span>
          </p>
        )}
        <p className="text-gray-400 text-sm mb-8">
          Aucun montant n&apos;a été débité.
        </p>
        <Link
          href="/dashboard/invoices"
          className="inline-block px-6 py-2.5 bg-gray-800 text-white text-sm font-medium rounded-lg hover:bg-gray-900 transition-colors"
        >
          Retour aux factures
        </Link>
      </div>
    </div>
  )
}
