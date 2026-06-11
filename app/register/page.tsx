'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const t = useTranslations('auth.register')
  const tc = useTranslations('common')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    })
    if (error) setError(error.message)
    else setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/40">
        <div className="w-full max-w-md bg-background rounded-2xl shadow-sm border border-border p-8 text-center">
          <div className="text-4xl mb-4">✉️</div>
          <h2 className="text-xl font-bold text-foreground mb-2">{t('successTitle')}</h2>
          <p className="text-muted-foreground">{t('successBody', { email })}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40">
      <div className="w-full max-w-md bg-background rounded-2xl shadow-sm border border-border p-8">
        <div className="mb-8">
          <Link href="/" className="text-2xl font-bold text-foreground hover:opacity-80">{tc('appName')}</Link>
          <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{tc('email')}</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent"
              placeholder="vous@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">{tc('password')}</label>
            <input type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-transparent"
              placeholder={t('passwordPlaceholder')} />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 px-4 bg-primary hover:bg-primary/90 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors">
            {loading ? t('loading') : t('submit')}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {t('haveAccount')}{' '}
          <Link href="/login" className="text-primary hover:underline font-medium">{t('loginLink')}</Link>
        </p>
        <p className="mt-3 text-center text-sm">
          <Link href="/" className="text-muted-foreground hover:underline">{tc('backHome')}</Link>
        </p>
      </div>
    </div>
  )
}
