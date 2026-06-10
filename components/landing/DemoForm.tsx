'use client'

import { useState } from 'react'

export default function DemoForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading')
    setError('')
    const fd = new FormData(e.currentTarget)
    const payload = {
      name: String(fd.get('name') || ''),
      email: String(fd.get('email') || ''),
      company: String(fd.get('company') || ''),
      message: String(fd.get('message') || ''),
    }
    try {
      const res = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Erreur')
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl bg-white/10 border border-white/20 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/20">
          <svg className="h-7 w-7 text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
        </div>
        <h3 className="text-xl font-semibold text-white">Demande envoyée !</h3>
        <p className="mt-2 text-indigo-100">Merci, nous vous recontactons très vite pour planifier votre démo.</p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl bg-white p-6 sm:p-8 shadow-2xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
          <input name="name" required type="text" placeholder="Votre nom"
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Email pro *</label>
          <input name="email" required type="email" placeholder="vous@entreprise.com"
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise / boutique</label>
          <input name="company" type="text" placeholder="Nom de votre boutique"
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Votre besoin (optionnel)</label>
          <textarea name="message" rows={3} placeholder="Quelles plateformes utilisez-vous ? Combien de produits/commandes ?"
            className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100" />
        </div>
      </div>

      {status === 'error' && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}

      <button type="submit" disabled={status === 'loading'}
        className="mt-5 w-full rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60">
        {status === 'loading' ? 'Envoi…' : 'Demander ma démo gratuite'}
      </button>
      <p className="mt-3 text-center text-xs text-gray-400">Réponse sous 24h ouvrées · Sans engagement</p>
    </form>
  )
}
