export type Product = {
  id: string
  name: string
  sku: string
  description: string | null
  price: number
  cost: number
  stock_quantity: number
  low_stock_threshold: number
  category: string | null
  image_url: string | null
  parent_id: string | null
  variant_attributes: Record<string, string> | null
  store_id: string | null
  created_at: string
  updated_at: string
}

export type Customer = {
  id: string
  full_name: string
  email: string
  phone: string | null
  address: string | null
  city: string | null
  country: string | null
  created_at: string
}

export type Order = {
  id: string
  customer_id: string
  customer?: Customer
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  total_amount: number
  notes: string | null
  created_at: string
  updated_at: string
  items?: OrderItem[]
}

export type OrderItem = {
  id: string
  order_id: string
  product_id: string
  product?: Product
  quantity: number
  unit_price: number
  total_price: number
}

export type Invoice = {
  id: string
  order_id: string
  order?: Order
  customer_id: string
  customer?: Customer
  invoice_number: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  amount: number
  due_date: string
  paid_at: string | null
  stripe_payment_intent_id: string | null
  created_at: string
}
