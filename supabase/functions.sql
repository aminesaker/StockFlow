-- ============================================================
-- Fonctions Supabase à exécuter dans SQL Editor
-- ============================================================

-- Décrément atomique du stock (évite les race conditions)
create or replace function public.decrement_stock(
  p_product_id uuid,
  p_quantity    integer
)
returns void
language plpgsql
security definer
as $$
begin
  update public.products
  set stock_quantity = stock_quantity - p_quantity,
      updated_at     = now()
  where id = p_product_id
    and stock_quantity >= p_quantity;

  if not found then
    raise exception 'Stock insuffisant pour le produit %', p_product_id;
  end if;
end;
$$;

-- Incrément atomique du stock (restock sur annulation / remboursement)
create or replace function public.increment_stock(
  p_product_id uuid,
  p_quantity    integer
)
returns void
language plpgsql
security definer
as $$
begin
  update public.products
  set stock_quantity = stock_quantity + p_quantity,
      updated_at     = now()
  where id = p_product_id;
end;
$$;
