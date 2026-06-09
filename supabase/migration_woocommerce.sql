-- ============================================================
-- MIGRATION : Intégration WooCommerce
-- À exécuter dans Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Identifier l'origine externe d'une commande (WooCommerce, Shopify, etc.)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS external_id     text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS external_source text; -- 'woocommerce' | 'shopify' | 'api'

-- Index pour retrouver une commande par son ID externe
CREATE INDEX IF NOT EXISTS idx_orders_external
  ON orders(user_id, external_source, external_id)
  WHERE external_id IS NOT NULL;

-- 2. Secret WooCommerce webhook par utilisateur
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS wc_webhook_secret text;

-- 3. Vue utile : commandes avec leur source
COMMENT ON COLUMN orders.external_id     IS 'ID de la commande dans le système source (ex: WooCommerce order ID)';
COMMENT ON COLUMN orders.external_source IS 'Système source : woocommerce | shopify | api | manual';
