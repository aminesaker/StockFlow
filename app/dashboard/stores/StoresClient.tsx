'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import type { Tables } from '@/lib/supabase/database.types'
import { createStore, updateStore, deleteStore, importShopifyCatalog } from './actions'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

type Store = Tables<'stores'>
const inputCls = 'w-full rounded-lg border border-input px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/50'

function StoreForm({ store, onDone }: { store?: Store; onDone: () => void }) {
  const t = useTranslations('stores')
  const tc = useTranslations('common')
  const [pending, start] = useTransition()
  const router = useRouter()
  const [platform, setPlatform] = useState(store?.platform ?? 'woocommerce')

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    start(async () => {
      const r = store ? await updateStore(store.id, fd) : await createStore(fd)
      if (r.error) toast.error(r.error)
      else { toast.success(store ? t('savedToast') : t('createdToast')); router.refresh(); onDone() }
    })
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">{t('name')}</span>
          <input name="name" required defaultValue={store?.name ?? ''} className={inputCls} />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">{t('platform')}</span>
          <input type="hidden" name="platform" value={platform} />
          <Select value={platform} onValueChange={setPlatform}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="woocommerce">{t('platformWoo')}</SelectItem>
              <SelectItem value="shopify">{t('platformShopify')}</SelectItem>
              <SelectItem value="other">{t('platformOther')}</SelectItem>
            </SelectContent>
          </Select>
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted-foreground">{t('domain')}</span>
        <input name="domain" defaultValue={store?.domain ?? ''} placeholder="maboutique.com" className={inputCls} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted-foreground">{t('secret')}</span>
        <input name="webhook_secret" type="password" defaultValue={store?.webhook_secret ?? ''} className={`${inputCls} font-mono`} />
        <span className="mt-1 block text-xs text-muted-foreground">{t('secretHint')}</span>
      </label>
      {platform === 'shopify' && (
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">{t('accessToken')}</span>
          <input name="access_token" type="password" defaultValue={store?.access_token ?? ''} placeholder="shpat_..." className={`${inputCls} font-mono`} />
          <span className="mt-1 block text-xs text-muted-foreground">{t('accessTokenHint')}</span>
        </label>
      )}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/40">{tc('cancel')}</button>
        <button type="submit" disabled={pending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
          {pending ? (store ? t('saving') : t('creating')) : (store ? t('save') : t('create'))}
        </button>
      </div>
    </form>
  )
}

export default function StoresClient({ stores, canAdd }: { stores: Store[]; canAdd: boolean }) {
  const t = useTranslations('stores')
  const tc = useTranslations('common')
  const router = useRouter()
  const [, start] = useTransition()
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [importing, setImporting] = useState<string | null>(null)

  function handleDelete(id: string) {
    if (!confirm(t('confirmDelete'))) return
    start(async () => {
      const r = await deleteStore(id)
      if (r.error) toast.error(r.error)
      else { toast.success(t('deletedToast')); router.refresh() }
    })
  }

  function handleImport(id: string) {
    setImporting(id)
    start(async () => {
      const r = await importShopifyCatalog(id)
      setImporting(null)
      if (r.error) toast.error(r.error)
      else { toast.success(t('importDone', { total: r.total ?? 0, created: r.created ?? 0, updated: r.updated ?? 0 })); router.refresh() }
    })
  }

  const platformLabel = (p: string) => p === 'shopify' ? t('platformShopify') : p === 'woocommerce' ? t('platformWoo') : t('platformOther')

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {!creating && canAdd && (
          <button onClick={() => setCreating(true)} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            {t('add')}
          </button>
        )}
      </div>

      {creating && <StoreForm onDone={() => setCreating(false)} />}

      {stores.length === 0 && !creating ? (
        <p className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">{t('empty')}</p>
      ) : (
        <div className="space-y-3">
          {stores.map((s) => (
            editing === s.id ? (
              <StoreForm key={s.id} store={s} onDone={() => setEditing(null)} />
            ) : (
              <div key={s.id} className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{s.name}</span>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{platformLabel(s.platform)}</span>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400">{t('statusActive')}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {s.domain ? `${s.domain} · ` : ''}{s.webhook_secret ? t('secretSet') : t('secretUnset')}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {s.platform === 'shopify' && (
                    <button onClick={() => handleImport(s.id)} disabled={importing === s.id} className="text-primary hover:underline disabled:opacity-50">
                      {importing === s.id ? t('importing') : t('importBtn')}
                    </button>
                  )}
                  <button onClick={() => setEditing(s.id)} className="text-primary hover:underline">{tc('edit')}</button>
                  <button onClick={() => handleDelete(s.id)} className="text-red-500 hover:underline">{t('delete')}</button>
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  )
}
