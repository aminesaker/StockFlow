/**
 * Réception des messages de contact (page /contact).
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

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

export async function POST(req: NextRequest) {
  let body: { name?: string; email?: string; company?: string; subject?: string; message?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Requête invalide' }, { status: 400 })
  }

  const name = (body.name || '').trim()
  const email = (body.email || '').trim()
  const company = (body.company || '').trim() || null
  const subject = (body.subject || '').trim() || null
  const message = (body.message || '').trim() || null

  if (!name || !email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !message) {
    return NextResponse.json({ ok: false, error: 'Nom, email valide et message requis' }, { status: 400 })
  }

  const supabase = getClient()

  const ip = (req.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim()
  const allowed = await checkRateLimit(supabase, `contact:${ip}`, 5, 600)
  if (!allowed) {
    return NextResponse.json({ ok: false, error: 'Trop de messages — réessayez plus tard' }, { status: 429 })
  }

  const { error } = await supabase.from('contact_messages').insert({ name, email, company, subject, message })
  if (error) {
    console.error('[contact] insert error', error)
    return NextResponse.json({ ok: false, error: 'Erreur serveur' }, { status: 500 })
  }

  if (EMAILS_ENABLED) {
    try {
      const { error: emailErr } = await resend.emails.send({
        from: FROM_EMAIL,
        to: NOTIFY_TO,
        subject: `✉️ Nouveau message de contact — ${name}${company ? ' (' + company + ')' : ''}`,
        html: `
          <h2>Nouveau message de contact ${BRAND}</h2>
          <p><strong>Nom :</strong> ${escapeHtml(name)}</p>
          <p><strong>Email :</strong> ${escapeHtml(email)}</p>
          <p><strong>Entreprise :</strong> ${escapeHtml(company || '—')}</p>
          <p><strong>Sujet :</strong> ${escapeHtml(subject || '—')}</p>
          <p><strong>Message :</strong><br/>${escapeHtml(message || '—').replace(/\n/g, '<br/>')}</p>
        `,
      })
      if (emailErr) console.error('[contact] email error', emailErr)
    } catch (e) {
      console.error('[contact] email exception', e)
    }
  }

  return NextResponse.json({ ok: true })
}
