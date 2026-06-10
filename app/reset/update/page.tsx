'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ResetUpdatePage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (password.length < 8) return setError('Le mot de passe doit faire au moins 8 caractères.')
    if (password !== confirm) return setError('Les mots de passe ne correspondent pas.')

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setDone(true)
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 1500)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <div className="w-full max-w-md rounded-2xl border border-border bg-background p-8 shadow-sm">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Nouveau mot de passe</h1>
          <p className="mt-1 text-muted-foreground">Choisissez un nouveau mot de passe pour votre compte.</p>
        </div>

        {done ? (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            Mot de passe mis à jour ✓ Redirection vers votre tableau de bord…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Nouveau mot de passe</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-input px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring/50"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-foreground">Confirmer</label>
              <input
                type="password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-lg border border-input px-3 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-ring/50"
                placeholder="••••••••"
              />
            </div>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary px-4 py-2.5 font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {loading ? 'Mise à jour…' : 'Mettre à jour le mot de passe'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">← Retour à la connexion</Link>
        </p>
      </div>
    </div>
  )
}
