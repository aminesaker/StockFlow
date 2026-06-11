-- ============================================================
-- Données de démo : drapeau is_demo pour charger/retirer
-- proprement un jeu de données d'exemple. (Appliqué en prod le 2026-06-11.)
-- ============================================================
alter table public.products  add column if not exists is_demo boolean not null default false;
alter table public.orders    add column if not exists is_demo boolean not null default false;
alter table public.customers add column if not exists is_demo boolean not null default false;
alter table public.invoices  add column if not exists is_demo boolean not null default false;
