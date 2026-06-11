-- ============================================================
-- Correctif multi-tenant : l'unicité de l'email client et du SKU produit
-- était GLOBALE (tout le SaaS) → passée PAR COMPTE. Deux marchands peuvent
-- désormais avoir le même email client / SKU. (Appliqué en prod le 2026-06-11.)
-- ============================================================
alter table public.products  drop constraint if exists products_sku_key;
alter table public.products  add  constraint products_user_sku_key   unique (user_id, sku);
alter table public.customers drop constraint if exists customers_email_key;
alter table public.customers add  constraint customers_user_email_key unique (user_id, email);
