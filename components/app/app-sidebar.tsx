'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { BRAND } from '@/lib/brand'
import { ThemeToggle } from '@/components/theme-toggle'

const nav = [
  { href: '/dashboard', label: "Vue d'ensemble", icon: '📊', exact: true },
  { href: '/dashboard/onboarding', label: 'Bien démarrer', icon: '🚀' },
  { href: '/dashboard/stocks', label: 'Stocks', icon: '📦' },
  { href: '/dashboard/forecast', label: 'Prévisions', icon: '📈' },
  { href: '/dashboard/reports', label: 'Rapports', icon: '📑' },
  { href: '/dashboard/orders', label: 'Commandes', icon: '🛒' },
  { href: '/dashboard/customers', label: 'Clients', icon: '👥' },
  { href: '/dashboard/invoices', label: 'Factures', icon: '🧾' },
  { href: '/dashboard/billing', label: 'Facturation', icon: '💳' },
  { href: '/dashboard/settings', label: 'Paramètres', icon: '⚙️' },
  { href: '/dashboard/api-docs', label: 'API', icon: '🔌' },
]

export function AppSidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href)

  const Content = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex items-center gap-2 border-b border-sidebar-border px-5 py-4">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary text-sm font-bold text-sidebar-primary-foreground">
          {BRAND.charAt(0)}
        </span>
        <span className="font-bold text-sidebar-foreground">{BRAND}</span>
        <button className="ml-auto text-muted-foreground lg:hidden" onClick={() => setOpen(false)} aria-label="Fermer">✕</button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {nav.map((item) => {
          const active = isActive(item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                active
                  ? 'bg-sidebar-accent font-medium text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              )}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" />}
            </Link>
          )
        })}
      </nav>

      {/* Footer : thème + user + logout */}
      <div className="border-t border-sidebar-border p-3">
        <div className="mb-2 flex items-center justify-between px-1">
          <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
          <ThemeToggle />
        </div>
        <form action="/auth/signout" method="post">
          <button type="submit" className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground">
            <span>🚪</span><span>Déconnexion</span>
          </button>
        </form>
      </div>
    </div>
  )

  return (
    <>
      {/* Hamburger mobile */}
      <button className="fixed left-4 top-4 z-50 rounded-lg border bg-card p-2 shadow-sm lg:hidden" onClick={() => setOpen(true)} aria-label="Menu">
        <svg className="h-5 w-5 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
      </button>
      {open && <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 transform border-r border-sidebar-border bg-sidebar transition-transform duration-200 lg:static lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full'
      )}>
        {Content}
      </aside>
    </>
  )
}
