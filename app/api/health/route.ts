/**
 * Health check — vérifie la connectivité à la base. Public (pour monitoring
 * uptime). Renvoie 200 si OK, 503 si la base est injoignable.
 */
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const start = Date.now()
  let dbOk = false
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { error } = await supabase.from('products').select('id').limit(1)
    dbOk = !error
  } catch {
    dbOk = false
  }
  return NextResponse.json(
    {
      status: dbOk ? 'ok' : 'degraded',
      db: dbOk,
      latencyMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    },
    { status: dbOk ? 200 : 503 }
  )
}
