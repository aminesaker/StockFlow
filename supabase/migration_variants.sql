-- ============================================================
-- Variantes produits : une variante = un produit "enfant" rattaché
-- à un parent via parent_id, avec ses attributs (jsonb).
-- Chaque variante garde son propre SKU / prix / stock.
-- (Appliqué en prod le 2026-06-11.)
-- ============================================================
alter table public.products add column if not exists parent_id uuid references public.products(id) on delete cascade;
alter table public.products add column if not exists variant_attributes jsonb;
create index if not exists products_parent_idx on public.products(parent_id);
