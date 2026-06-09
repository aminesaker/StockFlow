import Link from 'next/link'

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ invoice?: string }>
}) {
  const { invoice } = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center max-w-md w-full">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Paiement confirmé</h1>
        {invoice && (
          <p className="text-gray-500 mb-1">
            Facture <span className="font-medium text-gray-700">{invoice}</span>
          </p>
        )}
        <p className="text-gray-400 text-sm mb-8">
          Votre paiement a été traité avec succès.
        </p>
        <Link
          href="/dashboard/invoices"
          className="inline-block px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retour aux factures
        </Link>
      </div>
    </div>
  )
}
