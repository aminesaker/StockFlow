'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

export default function DemoForm() {
  const t = useTranslations('demoForm')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading'); setError('')
    const fd = new FormData(e.currentTarget)
    const payload = {
      name: String(fd.get('name') || ''), email: String(fd.get('email') || ''),
      company: String(fd.get('company') || ''), message: String(fd.get('message') || ''),
    }
    try {
      const res = await fetch('/api/demo-request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await res.json()
      if (!res.ok || !data.ok) throw new Error(data.error || 'Error')
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('error'))
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl bg-white/10 border border-white/20 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/20">
          <svg className="h-7 w-7 text-emerald-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5"/></svg>
        </div>
        <h3 className="text-xl font-semibold text-white">{t('successTitle')}</h3>
        <p className="mt-2 text-indigo-100">{t('successBody')}</p>
      </div>
    )
  }

  const inputCls = 'w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
  return (
    <form onSubmit={onSubmit} className="rounded-2xl bg-white p-6 sm:p-8 shadow-2xl">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('name')}</label>
          <input name="name" required type="text" placeholder={t('namePh')} className={inputCls} />
        </div>
        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('email')}</label>
          <input name="email" required type="email" placeholder={t('emailPh')} className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('company')}</label>
          <input name="company" type="text" placeholder={t('companyPh')} className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('message')}</label>
          <textarea name="message" rows={3} placeholder={t('messagePh')} className={inputCls} />
        </div>
      </div>
      {status === 'error' && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={status === 'loading'} className="mt-5 w-full rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60">
        {status === 'loading' ? t('sending') : t('submit')}
      </button>
      <p className="mt-3 text-center text-xs text-gray-400">{t('footnote')}</p>
    </form>
  )
}
