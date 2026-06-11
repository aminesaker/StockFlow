import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withApiAuth, apiError } from '@/lib/api/auth'

const customerSchema = z.object({
  full_name: z.string().min(1),
  email:     z.string().email(),
  phone:     z.string().optional(),
  address:   z.string().optional(),
  city:      z.string().optional(),
  country:   z.string().optional(),
  notes:     z.string().optional(),
})

// ── GET /api/v1/customers ─────────────────────────────────────────────────

export const GET = withApiAuth(async (_req, { userId, supabase }) => {
  const { data, error } = await supabase
    .from('customers')
    .select('id, full_name, email, phone, city, country, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return apiError(error.message, 500)

  return NextResponse.json({ data, count: data.length })
})

// ── POST /api/v1/customers ────────────────────────────────────────────────

export const POST = withApiAuth(async (req: NextRequest, { userId, supabase }) => {
  let body: unknown
  try { body = await req.json() } catch { return apiError('Invalid JSON body', 400) }

  const parsed = customerSchema.safeParse(body)
  if (!parsed.success) return apiError('Validation error', 422, parsed.error.flatten().fieldErrors)

  // Upsert sur email (évite les doublons si la boutique envoie le même client)
  const { data, error } = await supabase
    .from('customers')
    .upsert({ ...parsed.data, user_id: userId }, { onConflict: 'user_id,email' })
    .select()
    .single()

  if (error) return apiError(error.message, 500)

  return NextResponse.json({ data }, { status: 201 })
})
