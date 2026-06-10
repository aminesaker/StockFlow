'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

const inputCls = 'w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'

export default function ContactForm() {
  const t = useTranslations('contactForm')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('loading'); setError('')
    const fd = new FormData(e.currentTarget)
    const payload = {
      name: String(fd.get('name') || ''), email: String(fd.get('email') || ''),
      company: String(fd.get('company') || ''), subject: String(fd.get('subject') || ''), message: String(fd.get('message') || ''),
    }
    try {
      const res = await fetch('/api/contact', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
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
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <svg className="h-7 w-7 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900">{t('successTitle')}</h3>
        <p className="mt-2 text-gray-600">{t('successBody')}</p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('name')}</label>
          <input name="name" required type="text" placeholder={t('namePh')} className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('email')}</label>
          <input name="email" required type="email" placeholder={t('emailPh')} className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('company')}</label>
          <input name="company" type="text" placeholder={t('companyPh')} className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('subject')}</label>
          <input name="subject" type="text" placeholder={t('subjectPh')} className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('message')}</label>
          <textarea name="message" required rows={4} placeholder={t('messagePh')} className={inputCls} />
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
