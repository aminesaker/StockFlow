import { z } from 'zod'

export const productSchema = z.object({
  name: z.string().min(1, 'Nom requis').max(200),
  sku: z.string().min(1, 'SKU requis').max(100),
  description: z.string().max(1000).optional().or(z.literal('')),
  price: z.coerce.number().min(0, 'Prix invalide'),
  cost: z.coerce.number().min(0, 'Coût invalide'),
  stock_quantity: z.coerce.number().int().min(0),
  low_stock_threshold: z.coerce.number().int().min(0),
  category: z.string().max(100).optional().or(z.literal('')),
  image_url: z.string().url('URL invalide').optional().or(z.literal('')),
})

export const customerSchema = z.object({
  full_name: z.string().min(1, 'Nom requis').max(200),
  email: z.string().email('Email invalide'),
  phone: z.string().max(30).optional().or(z.literal('')),
  address: z.string().max(300).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  country: z.string().max(100).optional().or(z.literal('')),
})

export const orderItemSchema = z.object({
  product_id: z.string().uuid('Produit invalide'),
  quantity: z.coerce.number().int().min(1, 'Quantité min. 1'),
  unit_price: z.coerce.number().min(0),
})

export const orderSchema = z.object({
  customer_id: z.string().uuid('Client requis'),
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled']),
  notes: z.string().max(1000).optional().or(z.literal('')),
  items: z.array(orderItemSchema).min(1, 'Au moins un article requis'),
})

export const invoiceSchema = z.object({
  customer_id: z.string().uuid('Client requis'),
  order_id: z.string().uuid().optional().or(z.literal('')),
  amount: z.coerce.number().min(0),
  due_date: z.string().min(1, 'Date requise'),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
})

export type ProductInput = z.infer<typeof productSchema>
export type CustomerInput = z.infer<typeof customerSchema>
export type OrderInput = z.infer<typeof orderSchema>
export type InvoiceInput = z.infer<typeof invoiceSchema>
