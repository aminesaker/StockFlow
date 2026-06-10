/**
 * Réception des demandes de démo (formulaire landing page).
 * Public. Anti-spam par IP. Stocke en base + notifie par email.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resend, FROM_EMAIL, EMAILS_ENABLED } from '@/lib/email/resend'
import { checkRateLimit } from '@/lib/rate-limit'
import { BRAND } from '@/lib/brand'

const NOTIFY_TO = 'aminesaker@outlook.com'

function getClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: NextRequest) {
  let body: { name?: string; email?: string; company?: string; message?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Requête invalide' }, { status: 400 })
  }

  const name = (body.name || '').trim()
  const email = (body.email || '').trim()
  const company = (body.company || '').trim() || null
  const message = (body.message || '').trim() || null

  if (!name || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: 'Nom et email valides requis' }, { status: 400 })
  }

  const supabase = getClient()

  // Anti-spam : 5 demandes / 10 min par IP
  const ip = (req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim()
  const allowed = await checkRateLimit(supabase, `demo:${ip}`, 5, 600)
  if (!allowed) {
    return NextResponse.json({ ok: false, error: 'Trop de demandes — réessayez plus tard' }, { status: 429 })
  }

  const { error } = await supabase
    .from('demo_requests')
    .insert({ name, email, company, message })
  if (error) {
    console.error('[demo-request] insert error', error)
    return NextResponse.json({ ok: false, error: 'Erreur serveur' }, { status: 500 })
  }

  // Notification email (best-effort)
  if (EMAILS_ENABLED) {
    resend.emails
      .send({
        from: FROM_EMAIL,
        to: NOTIFY_TO,
        subject: `🎯 Nouvelle demande de démo — ${name}${company ? ' (' + company + ')' : ''}`,
        html: `
          <h2>Nouvelle demande de démo ${BRAND}</h2>
          <p><strong>Nom :</strong> ${escapeHtml(name)}</p>
          <p><strong>Email :</strong> ${escapeHtml(email)}</p>
          <p><strong>Entreprise :</strong> ${escapeHtml(company || '—')}</p>
          <p><strong>Message :</strong><br/>${escapeHtml(message || '—').replace(/\n/g, '<br/>')}</p>
        `,
      })
      .then((r) => { if (r.error) console.error('[demo-request] email error', r.error) })
      .catch((e) => console.error('[demo-request] email exception', e))
  }

  return NextResponse.json({ ok: true })
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
