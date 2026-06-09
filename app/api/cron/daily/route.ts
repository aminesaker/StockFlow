/**
 * Cron job quotidien — exécuté à 08:00 UTC par Vercel Cron
 * 1. Passe les factures échues en 'overdue'
 * 2. Envoie les relances impayées (J+7, J+15, J+30)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { sendReminderEmail } from '@/lib/email/send'

// Client avec service_role pour contourner RLS dans les crons
function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const REMINDER_DAYS = [7, 15, 30] // jours après échéance

export async function GET(req: NextRequest) {
  // Sécurité : Vercel envoie un header d'autorisation sur les crons
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getServiceClient()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let overdueUpdated = 0
  let remindersSent = 0
  const errors: string[] = []

  // ── 1. Passer en 'overdue' toutes les factures 'sent' dont l'échéance est dépassée
  const { data: overdueInvoices, error: overdueErr } = await supabase
    .from('invoices')
    .update({ status: 'overdue' })
    .eq('status', 'sent')
    .lt('due_date', today.toISOString().split('T')[0])
    .select('id')

  if (overdueErr) errors.push(`overdue update: ${overdueErr.message}`)
  else overdueUpdated = overdueInvoices?.length ?? 0

  // ── 2. Envoyer les relances pour les factures overdue
  const { data: toRemind } = await supabase
    .from('invoices')
    .select(`
      id, invoice_number, amount, due_date, reminder_count, last_reminder_at,
      customer:customers(email, full_name),
      user:auth_users:user_id(email),
      user_settings!inner(overdue_reminders, notify_email)
    `)
    .eq('status', 'overdue')
    .lt('due_date', today.toISOString().split('T')[0])

  // Fallback si la jointure auth.users n'est pas possible
  const { data: overdueList } = await supabase
    .from('invoices')
    .select(`
      id, invoice_number, amount, due_date, reminder_count, last_reminder_at,
      user_id,
      customer:customers(email, full_name)
    `)
    .eq('status', 'overdue')

  for (const inv of (overdueList ?? [])) {
    const customer = (inv.customer as { email: string; full_name: string }[] | null)?.[0]
    if (!customer?.email) continue

    const dueDate = new Date(inv.due_date)
    const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
    const reminderCount = (inv.reminder_count ?? 0) + 1

    // N'envoyer que si on est à J+7, J+15 ou J+30 (± 1 jour de tolérance)
    const shouldSend = REMINDER_DAYS.some((d) => Math.abs(daysOverdue - d) <= 1)
    if (!shouldSend) continue

    // Éviter le double envoi dans la même journée
    if (inv.last_reminder_at) {
      const lastSent = new Date(inv.last_reminder_at)
      const hoursSince = (today.getTime() - lastSent.getTime()) / (1000 * 60 * 60)
      if (hoursSince < 20) continue
    }

    // Vérifier les settings utilisateur
    const { data: settings } = await supabase
      .from('user_settings')
      .select('overdue_reminders')
      .eq('user_id', inv.user_id)
      .maybeSingle()

    if (settings?.overdue_reminders === false) continue

    try {
      await sendReminderEmail(customer.email, {
        invoiceNumber: inv.invoice_number,
        invoiceId: inv.id,
        customerName: customer.full_name,
        amount: inv.amount,
        dueDate: inv.due_date,
        daysOverdue,
        reminderCount,
      })

      await supabase
        .from('invoices')
        .update({ reminder_count: reminderCount, last_reminder_at: new Date().toISOString() })
        .eq('id', inv.id)

      remindersSent++
    } catch (e) {
      errors.push(`reminder ${inv.invoice_number}: ${(e as Error).message}`)
    }
  }

  return NextResponse.json({
    ok: true,
    overdueUpdated,
    remindersSent,
    errors: errors.length ? errors : undefined,
    ran_at: new Date().toISOString(),
  })
}
