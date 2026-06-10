import { NextRequest, NextResponse } from 'next/server'
import { withApiAuth, apiError } from '@/lib/api/auth'

// GET /api/v1/forecast?history_days=30&lead_time_days=7&cover_days=30
export const GET = withApiAuth(async (req: NextRequest, { userId, supabase }) => {
  const sp = new URL(req.url).searchParams
  const num = (k: string, d: number) => {
    const v = Number(sp.get(k))
    return Number.isFinite(v) && v > 0 ? v : d
  }
  const { data, error } = await supabase.rpc('forecast_stock', {
    p_user_id: userId,
    p_history_days: num('history_days', 30),
    p_lead_time_days: num('lead_time_days', 7),
    p_cover_days: num('cover_days', 30),
  })
  if (error) return apiError(error.message, 500)
  return NextResponse.json({ forecast: data })
})
