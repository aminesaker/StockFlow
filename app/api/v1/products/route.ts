import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withApiAuth, apiError } from '@/lib/api/auth'
import { canCreate, limitMessage } from '@/lib/entitlements'

const productSchema = z.object({
  name:                z.string().min(1),
  sku:                 z.string().min(1),
  description:         z.string().optional(),
  price:               z.number().min(0),
  cost:                z.number().min(0).optional(),
  stock_quantity:      z.number().int().min(0).default(0),
  low_stock_threshold: z.number().int().min(0).default(5),
  category:            z.string().optional(),
  image_url:           z.string().url().optional(),
})

// ── GET /api/v1/products ──────────────────────────────────────────────────

export const GET = withApiAuth(async (_req, { userId, supabase }) => {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, sku, price, stock_quantity, low_stock_threshold, category, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return apiError(error.message, 500)

  return NextResponse.json({ data, count: data.length })
})

// ── POST /api/v1/products ─────────────────────────────────────────────────

export const POST = withApiAuth(async (req: NextRequest, { userId, supabase }) => {
  let body: unknown
  try { body = await req.json() } catch { return apiError('Invalid JSON body', 400) }

  const parsed = productSchema.safeParse(body)
  if (!parsed.success) return apiError('Validation error', 422, parsed.error.flatten().fieldErrors)

  // Enforcement : ne bloque que la création d'un NOUVEAU SKU.
  // Si le SKU existe déjà, c'est une mise à jour → toujours autorisée.
  const { data: existing } = await supabase
    .from('products')
    .select('id')
    .eq('user_id', userId)
    .eq('sku', parsed.data.sku)
    .maybeSingle()

  if (!existing) {
    const limit = await canCreate(supabase, userId, 'products')
    if (!limit.allowed) return apiError(limitMessage('products', limit), 403)
  }

  // Upsert sur SKU (crée ou met à jour)
  const { data, error } = await supabase
    .from('products')
    .upsert({ ...parsed.data, user_id: userId }, { onConflict: 'sku' })
    .select()
    .single()

  if (error) return apiError(error.message, 500)

  return NextResponse.json({ data }, { status: 201 })
})
