'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { customerSchema } from '@/lib/validations'

export async function createCustomer(formData: FormData) {
  const parsed = customerSchema.safeParse({
    full_name: formData.get('full_name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    city: formData.get('city'),
    country: formData.get('country'),
  })

  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { error } = await supabase.from('customers').insert(parsed.data)

  if (error) return { error: { _root: [error.message] } }

  revalidatePath('/dashboard/customers')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function updateCustomer(id: string, formData: FormData) {
  const parsed = customerSchema.safeParse({
    full_name: formData.get('full_name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    address: formData.get('address'),
    city: formData.get('city'),
    country: formData.get('country'),
  })

  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const supabase = await createClient()
  const { error } = await supabase.from('customers').update(parsed.data).eq('id', id)

  if (error) return { error: { _root: [error.message] } }

  revalidatePath('/dashboard/customers')
  return { success: true }
}

export async function deleteCustomer(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('customers').delete().eq('id', id)

  if (error) return { error: error.message }

  revalidatePath('/dashboard/customers')
  revalidatePath('/dashboard')
  return { success: true }
}
