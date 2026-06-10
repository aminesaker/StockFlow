/**
 * Cron job hebdomadaire — exécuté le lundi à 07:00 UTC par Vercel Cron
 * Envoie un rapport de synthèse à chaque utilisateur actif
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { sendWeeklyReport } from '@/lib/email/send'
import { usersWithAutomations } from '@/lib/entitlements'
import type { Locale } from '@/i18n/locales'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient()
  const now = new Date()

  // Semaine passée
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - 7)
  weekStart.setHours(0, 0, 0, 0)

  const weekLabel = `${weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} – ${now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`

  // Récupérer tous les utilisateurs avec weekly_report activé
  const { data: settingsList } = await supabase
    .from('user_settings')
    .select('user_id, notify_email, weekly_report, locale')
    .eq('weekly_report', true)

  if (!settingsList?.length) {
    return NextResponse.json({ ok: true, sent: 0, message: 'Aucun utilisateur abonné' })
  }

  let sent = 0
  const errors: string[] = []

  // Gating : rapport hebdo uniquement pour les plans avec automatisations (Pro+)
  const autoUsers = await usersWithAutomations(supabase, settingsList.map((s) => s.user_id as string))

  for (const settings of settingsList) {
    if (!autoUsers.has(settings.user_id as string)) continue
    try {
      // Récupérer l'email utilisateur depuis auth
      const { data: authUser } = await supabase.auth.admin.getUserById(settings.user_id)
      const userEmail = settings.notify_email ?? authUser?.user?.email
      if (!userEmail) continue

      const uid = settings.user_id
      const since = weekStart.toISOString()

      // Données de la semaine (parallèle)
      const [
        { count: newOrders },
        { count: newCustomers },
        { data: invoicesWeek },
        { data: overdueInvoices },
        { data: lowStock },
      ] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('user_id', uid).gte('created_at', since),
        supabase.from('customers').select('*', { count: 'exact', head: true }).eq('user_id', uid).gte('created_at', since),
        supabase.from('invoices').select('status, amount').eq('user_id', uid).gte('created_at', since),
        supabase.from('invoices').select('amount').eq('user_id', uid).eq('status', 'overdue'),
        supabase.from('products').select('name, stock_quantity, low_stock_threshold').eq('user_id', uid).order('stock_quantity').limit(5),
      ])

      const revenue = invoicesWeek?.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0) ?? 0
      const pendingList = invoicesWeek?.filter((i) => ['sent', 'draft'].includes(i.status)) ?? []
      const pendingAmount = pendingList.reduce((s, i) => s + i.amount, 0)
      const overdueAmount = overdueInvoices?.reduce((s, i) => s + i.amount, 0) ?? 0

      const lowStockProducts = (lowStock ?? [])
        .filter((p) => p.stock_quantity <= p.low_stock_threshold)
        .map((p) => ({ name: p.name, stock_quantity: p.stock_quantity }))

      await sendWeeklyReport(userEmail, {
        weekLabel,
        newOrders: newOrders ?? 0,
        newCustomers: newCustomers ?? 0,
        revenue,
        pendingInvoices: pendingList.length,
        pendingAmount,
        overdueInvoices: overdueInvoices?.length ?? 0,
        overdueAmount,
        lowStockProducts,
      }, (settings.locale as Locale) ?? 'fr')

      sent++
    } catch (e) {
      errors.push(`user ${settings.user_id}: ${(e as Error).message}`)
    }
  }

  return NextResponse.json({
    ok: true,
    sent,
    errors: errors.length ? errors : undefined,
    ran_at: now.toISOString(),
  })
}
