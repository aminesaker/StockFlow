'use client'

import { useRef, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { useTranslations, useLocale } from 'next-intl'
import { createApiKey, deleteApiKey } from './api-keys-actions'

type ApiKey = { id: string; name: string; key_prefix: string; last_used_at: string | null; created_at: string }

export default function ApiKeysSection({ apiKeys }: { apiKeys: ApiKey[] }) {
  const t = useTranslations('settings.apiKeys')
  const locale = useLocale()
  const dateLocale = locale === 'en' ? 'en-US' : 'fr-FR'
  const [isPending, startTransition] = useTransition()
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const r = await createApiKey(fd)
      if (r.error) { toast.error(r.error); return }
      setNewKey(r.rawKey ?? null)
      formRef.current?.reset()
      toast.success(t('createdToast'))
    })
  }

  function handleCopy() {
    if (!newKey) return
    navigator.clipboard.writeText(newKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleRevoke(id: string, name: string) {
    if (!confirm(t('confirmRevoke', { name }))) return
    startTransition(async () => {
      const r = await deleteApiKey(id)
      if (r.error) toast.error(r.error)
      else toast.success(t('revokedToast'))
    })
  }

  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="px-6 py-5 border-b border-border">
        <h3 className="font-semibold text-foreground">{t('title')}</h3>
        <p className="text-sm text-muted-foreground mt-0.5">{t('desc')}</p>
      </div>

      {/* Alerte clé générée — affichée une seule fois */}
      {newKey && (
        <div className="mx-6 mt-5 bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-amber-800 mb-2">{t('copyNow')}</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-background border border-amber-200 rounded px-3 py-2 text-xs font-mono text-foreground break-all">
              {newKey}
            </code>
            <button
              onClick={handleCopy}
              className="px-3 py-2 bg-amber-600 text-white text-xs font-medium rounded-lg hover:bg-amber-700 transition-colors whitespace-nowrap"
            >
              {copied ? t('copied') : t('copy')}
            </button>
          </div>
          <button
            onClick={() => setNewKey(null)}
            className="text-xs text-amber-600 hover:underline mt-2"
          >
            {t('copiedClose')}
          </button>
        </div>
      )}

      {/* Liste des clés existantes */}
      {apiKeys.length > 0 && (
        <div className="divide-y divide-border px-6 mt-4">
          {apiKeys.map((key) => (
            <div key={key.id} className="py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">{key.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                  {key.key_prefix}••••••••••••••••••••••
                  {key.last_used_at
                    ? t('lastUsed', { date: new Date(key.last_used_at).toLocaleDateString(dateLocale) })
                    : t('neverUsed')}
                </p>
              </div>
              <button
                onClick={() => handleRevoke(key.id, key.name)}
                disabled={isPending}
                className="text-xs text-red-500 hover:underline disabled:opacity-50 whitespace-nowrap"
              >
                {t('revoke')}
              </button>
            </div>
          ))}
        </div>
      )}

      {apiKeys.length === 0 && !newKey && (
        <p className="px-6 py-4 text-sm text-muted-foreground">{t('noKeys')}</p>
      )}

      {/* Formulaire de création */}
      <form ref={formRef} onSubmit={handleCreate} className="px-6 py-5 border-t border-border flex gap-3">
        <input
          type="text"
          name="name"
          placeholder={t('namePlaceholder')}
          required
          className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
        />
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {t('generate')}
        </button>
      </form>
    </div>
  )
}
