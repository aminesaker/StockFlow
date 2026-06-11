'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { saveBillingProfile } from './billing-actions'
import type { BillingProfile } from '@/lib/billing/profile'

const inputCls = 'w-full rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

export default function BillingProfileForm({ profile }: { profile: BillingProfile }) {
  const t = useTranslations('settings.billing')
  const [isPending, start] = useTransition()

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    start(async () => {
      const r = await saveBillingProfile(fd)
      if (r.error) toast.error(r.error)
      else toast.success(t('savedToast'))
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-foreground">{t('title')}</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">{t('desc')}</p>
        </div>

        <Field label={t('company')}>
          <input name="company_name" defaultValue={profile.company_name ?? ''} className={inputCls} />
        </Field>
        <Field label={t('address1')}>
          <input name="address_line1" defaultValue={profile.address_line1 ?? ''} className={inputCls} />
        </Field>
        <Field label={t('address2')}>
          <input name="address_line2" defaultValue={profile.address_line2 ?? ''} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('postal')}>
            <input name="postal_code" defaultValue={profile.postal_code ?? ''} className={inputCls} />
          </Field>
          <Field label={t('city')}>
            <input name="city" defaultValue={profile.city ?? ''} className={inputCls} />
          </Field>
        </div>
        <Field label={t('country')}>
          <input name="country" defaultValue={profile.country ?? 'France'} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label={t('siret')}>
            <input name="siret" defaultValue={profile.siret ?? ''} className={inputCls} />
          </Field>
          <Field label={t('vatNumber')}>
            <input name="vat_number" defaultValue={profile.vat_number ?? ''} className={inputCls} />
          </Field>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-4">
        <label className="flex items-start gap-3">
          <input type="checkbox" name="vat_exempt" defaultChecked={!!profile.vat_exempt} className="mt-1 h-4 w-4" />
          <span>
            <span className="text-sm font-medium text-foreground">{t('vatExempt')}</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">{t('vatExemptHint')}</span>
          </span>
        </label>
        <div className="grid grid-cols-3 gap-4">
          <Field label={t('vatRate')}>
            <input type="number" step="0.1" min="0" name="default_vat_rate" defaultValue={String(profile.default_vat_rate ?? 20)} className={inputCls} />
          </Field>
          <Field label={t('prefix')}>
            <input name="invoice_prefix" defaultValue={profile.invoice_prefix ?? 'F'} className={inputCls} />
          </Field>
          <Field label={t('paymentTerms')}>
            <input type="number" min="0" name="payment_terms_days" defaultValue={String(profile.payment_terms_days ?? 30)} className={inputCls} />
          </Field>
        </div>
        <p className="text-xs text-muted-foreground">{t('nextHint', { prefix: profile.invoice_prefix ?? 'F', year: new Date().getFullYear() })}</p>
        <Field label={t('legalFooter')}>
          <textarea name="legal_footer" defaultValue={profile.legal_footer ?? ''} rows={3} className={inputCls} />
        </Field>
        <p className="text-xs text-muted-foreground">{t('legalFooterHint')}</p>
      </div>

      <div className="flex justify-end">
        <button type="submit" disabled={isPending}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50">
          {isPending ? t('saving') : t('save')}
        </button>
      </div>
    </form>
  )
}
