-- ============================================================
-- MIGRATION : Isolation des données par utilisateur
-- À exécuter dans Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Ajouter la colonne user_id sur les 4 tables principales
ALTER TABLE products  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE orders    ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE invoices  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Index pour les performances des requêtes filtrées
CREATE INDEX IF NOT EXISTS idx_products_user_id  ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON customers(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id    ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id  ON invoices(user_id);

-- 3. Supprimer toutes les anciennes politiques RLS (peu importe leur nom)
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE tablename IN ('products','customers','orders','order_items','invoices')
      AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I',
      r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- 4. Nouvelles politiques : chaque ligne n'est visible/modifiable que par son propriétaire

-- Products
CREATE POLICY "products_select" ON products FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "products_insert" ON products FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "products_update" ON products FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "products_delete" ON products FOR DELETE USING (user_id = auth.uid());

-- Customers
CREATE POLICY "customers_select" ON customers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "customers_insert" ON customers FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "customers_update" ON customers FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "customers_delete" ON customers FOR DELETE USING (user_id = auth.uid());

-- Orders
CREATE POLICY "orders_select" ON orders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "orders_insert" ON orders FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "orders_update" ON orders FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "orders_delete" ON orders FOR DELETE USING (user_id = auth.uid());

-- Order items : accès via la commande parente (pas de user_id direct)
CREATE POLICY "order_items_select" ON order_items FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
  ));
CREATE POLICY "order_items_insert" ON order_items FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
  ));
CREATE POLICY "order_items_update" ON order_items FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
  ));
CREATE POLICY "order_items_delete" ON order_items FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
  ));

-- Invoices
CREATE POLICY "invoices_select" ON invoices FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "invoices_insert" ON invoices FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "invoices_update" ON invoices FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "invoices_delete" ON invoices FOR DELETE USING (user_id = auth.uid());
