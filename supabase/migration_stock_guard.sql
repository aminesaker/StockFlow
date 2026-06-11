-- ============================================================
-- Fiabilité stock : le stock ne peut jamais devenir négatif.
-- Défense en profondeur (au-delà du contrôle dans decrement_stock).
-- (Appliqué en prod le 2026-06-11.)
-- ============================================================
alter table public.products drop constraint if exists products_stock_non_negative;
alter table public.products add constraint products_stock_non_negative check (stock_quantity >= 0);
