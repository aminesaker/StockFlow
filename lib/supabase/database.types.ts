export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      api_keys: {
        Row: {
          created_at: string | null
          id: string
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      billing_profiles: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          company_name: string | null
          country: string
          created_at: string
          default_vat_rate: number
          credit_prefix: string
          invoice_prefix: string
          next_credit_seq: number
          legal_footer: string | null
          logo_url: string | null
          next_invoice_seq: number
          payment_terms_days: number
          postal_code: string | null
          siret: string | null
          updated_at: string
          user_id: string
          vat_exempt: boolean
          vat_number: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_name?: string | null
          country?: string
          created_at?: string
          default_vat_rate?: number
          credit_prefix?: string
          invoice_prefix?: string
          next_credit_seq?: number
          legal_footer?: string | null
          logo_url?: string | null
          next_invoice_seq?: number
          payment_terms_days?: number
          postal_code?: string | null
          siret?: string | null
          updated_at?: string
          user_id: string
          vat_exempt?: boolean
          vat_number?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          company_name?: string | null
          country?: string
          created_at?: string
          default_vat_rate?: number
          credit_prefix?: string
          invoice_prefix?: string
          next_credit_seq?: number
          legal_footer?: string | null
          logo_url?: string | null
          next_invoice_seq?: number
          payment_terms_days?: number
          postal_code?: string | null
          siret?: string | null
          updated_at?: string
          user_id?: string
          vat_exempt?: boolean
          vat_number?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          subject: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          subject?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          subject?: string | null
        }
        Relationships: []
      }
      credit_notes: {
        Row: {
          amount: number
          created_at: string
          credit_number: string
          customer_id: string
          id: string
          invoice_id: string | null
          reason: string | null
          subtotal: number | null
          user_id: string
          vat_amount: number | null
          vat_rate: number | null
        }
        Insert: {
          amount: number
          created_at?: string
          credit_number: string
          customer_id: string
          id?: string
          invoice_id?: string | null
          reason?: string | null
          subtotal?: number | null
          user_id: string
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Update: {
          amount?: number
          created_at?: string
          credit_number?: string
          customer_id?: string
          id?: string
          invoice_id?: string | null
          reason?: string | null
          subtotal?: number | null
          user_id?: string
          vat_amount?: number | null
          vat_rate?: number | null
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      demo_requests: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
        }
        Relationships: []
      }
      error_logs: {
        Row: {
          context: string | null
          created_at: string
          details: Json | null
          id: string
          message: string
          source: string | null
          user_id: string | null
        }
        Insert: {
          context?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          message: string
          source?: string | null
          user_id?: string | null
        }
        Update: {
          context?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          message?: string
          source?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          customer_id: string
          due_date: string
          id: string
          invoice_number: string
          last_reminder_at: string | null
          order_id: string | null
          paid_at: string | null
          reminder_count: number | null
          status: string
          stripe_payment_intent_id: string | null
          subtotal: number | null
          vat_amount: number | null
          vat_rate: number | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          customer_id: string
          due_date: string
          id?: string
          invoice_number: string
          last_reminder_at?: string | null
          order_id?: string | null
          paid_at?: string | null
          reminder_count?: number | null
          status?: string
          stripe_payment_intent_id?: string | null
          subtotal?: number | null
          vat_amount?: number | null
          vat_rate?: number | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string
          due_date?: string
          id?: string
          invoice_number?: string
          last_reminder_at?: string | null
          order_id?: string | null
          paid_at?: string | null
          reminder_count?: number | null
          status?: string
          stripe_payment_intent_id?: string | null
          subtotal?: number | null
          vat_amount?: number | null
          vat_rate?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          total_price: number | null
          unit_price: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          total_price?: number | null
          unit_price: number
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          quantity?: number
          total_price?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_id: string
          external_id: string | null
          external_source: string | null
          id: string
          notes: string | null
          status: string
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          external_id?: string | null
          external_source?: string | null
          id?: string
          notes?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          external_id?: string | null
          external_source?: string | null
          id?: string
          notes?: string | null
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          cost: number
          created_at: string
          description: string | null
          external_id: string | null
          external_source: string | null
          id: string
          image_url: string | null
          low_stock_threshold: number
          name: string
          price: number
          sku: string
          stock_quantity: number
          updated_at: string
          user_id: string | null
          woo_id: number | null
        }
        Insert: {
          category?: string | null
          cost?: number
          created_at?: string
          description?: string | null
          external_id?: string | null
          external_source?: string | null
          id?: string
          image_url?: string | null
          low_stock_threshold?: number
          name: string
          price?: number
          sku: string
          stock_quantity?: number
          updated_at?: string
          user_id?: string | null
          woo_id?: number | null
        }
        Update: {
          category?: string | null
          cost?: number
          created_at?: string
          description?: string | null
          external_id?: string | null
          external_source?: string | null
          id?: string
          image_url?: string | null
          low_stock_threshold?: number
          name?: string
          price?: number
          sku?: string
          stock_quantity?: number
          updated_at?: string
          user_id?: string | null
          woo_id?: number | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          bucket: string
          count: number
          window_start: number
        }
        Insert: {
          bucket: string
          count?: number
          window_start: number
        }
        Update: {
          bucket?: string
          count?: number
          window_start?: number
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          balance_after: number | null
          created_at: string
          delta: number
          id: string
          note: string | null
          product_id: string
          reason: string
          reference: string | null
          user_id: string
        }
        Insert: {
          balance_after?: number | null
          created_at?: string
          delta: number
          id?: string
          note?: string | null
          product_id: string
          reason?: string
          reference?: string | null
          user_id: string
        }
        Update: {
          balance_after?: number | null
          created_at?: string
          delta?: number
          id?: string
          note?: string | null
          product_id?: string
          reason?: string
          reference?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      sync_events: {
        Row: {
          action: string
          created_at: string
          detail: string | null
          id: string
          source: string
          status: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          detail?: string | null
          id?: string
          source: string
          status: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          detail?: string | null
          id?: string
          source?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          auto_invoice: boolean | null
          created_at: string | null
          id: string
          locale: string
          notify_email: string | null
          overdue_reminders: boolean | null
          stock_alerts: boolean | null
          updated_at: string | null
          user_id: string
          wc_webhook_secret: string | null
          weekly_report: boolean | null
        }
        Insert: {
          auto_invoice?: boolean | null
          created_at?: string | null
          id?: string
          locale?: string
          notify_email?: string | null
          overdue_reminders?: boolean | null
          stock_alerts?: boolean | null
          updated_at?: string | null
          user_id: string
          wc_webhook_secret?: string | null
          weekly_report?: boolean | null
        }
        Update: {
          auto_invoice?: boolean | null
          created_at?: string | null
          id?: string
          locale?: string
          notify_email?: string | null
          overdue_reminders?: boolean | null
          stock_alerts?: boolean | null
          updated_at?: string | null
          user_id?: string
          wc_webhook_secret?: string | null
          weekly_report?: boolean | null
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          current_period_end: string | null
          plan: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          current_period_end?: string | null
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          current_period_end?: string | null
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: { p_bucket: string; p_limit: number; p_window_seconds: number }
        Returns: boolean
      }
      decrement_stock: {
        Args: {
          p_product_id: string
          p_quantity: number
          p_reason?: string
          p_reference?: string
        }
        Returns: undefined
      }
      forecast_stock: {
        Args: {
          p_cover_days?: number
          p_history_days?: number
          p_lead_time_days?: number
          p_user_id: string
        }
        Returns: {
          daily_velocity: number
          days_of_cover: number
          name: string
          product_id: string
          sku: string
          status: string
          stock_quantity: number
          stockout_date: string
          suggested_reorder: number
          units_sold: number
        }[]
      }
      generate_invoice_number: { Args: Record<PropertyKey, never>; Returns: string }
      next_invoice_number: { Args: { p_user_id: string }; Returns: string }
      next_credit_number: { Args: { p_user_id: string }; Returns: string }
      increment_stock: {
        Args: {
          p_product_id: string
          p_quantity: number
          p_reason?: string
          p_reference?: string
        }
        Returns: undefined
      }
      reports_overview: {
        Args: { p_days?: number; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
