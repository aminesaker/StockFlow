import { cookies } from 'next/headers'

/** Boutique active (cookie NEXT_STORE), ou null si « Toutes ». */
export async function getStoreFilter(): Promise<string | null> {
  const c = await cookies()
  const v = c.get('NEXT_STORE')?.value
  if (!v || v === 'all') return null
  return v
}
