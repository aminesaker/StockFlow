'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { productSchema } from '@/lib/validations'

export async function createProduct(formData: FormData) {
  const raw = {
    name: formData.get('name'),
    sku: formData.get('sku'),
    description: formData.get('description'),
    price: formData.get('price'),
    cost: formData.get('cost'),
    stock_quantity: formData.get('stock_quantity'),
    low_stock_threshold: formData.get('low_stock_threshold'),
    category: formData.get('category'),
    image_url: formData.get('image_url'),
  }

  const parsed = productSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('products').insert(parsed.data)

  if (error) return { error: { _root: [error.message] } }

  revalidatePath('/dashboard/stocks')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateProduct(id: string, formData: FormData) {
  const raw = {
    name: formData.get('name'),
    sku: formData.get('sku'),
    description: formData.get('description'),
    price: formData.get('price'),
    cost: formData.get('cost'),
    stock_quantity: formData.get('stock_quantity'),
    low_stock_threshold: formData.get('low_stock_threshold'),
    category: formData.get('category'),
    image_url: formData.get('image_url'),
  }

  const parsed = productSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('products').update(parsed.data).eq('id', id)

  if (error) return { error: { _root: [error.message] } }

  revalidatePath('/dashboard/stocks')
  return { success: true }
}

export async function deleteProduct(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('products').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/stocks')
  revalidatePath('/dashboard')
  return { success: true }
}
