-- ============================================================
-- Retours partiels : lignes d'avoir (credit_note_items) pour suivre
-- les quantités retournées par produit. (Appliqué en prod le 2026-06-11.)
-- ============================================================
create table if not exists public.credit_note_items (
  id             uuid primary key default gen_random_uuid(),
  credit_note_id uuid not null references public.credit_notes(id) on delete cascade,
  product_id     uuid references public.products(id) on delete set null,
  quantity       integer not null check (quantity > 0),
  unit_price     numeric(10,2) not null
);
create index if not exists credit_note_items_cn_idx on public.credit_note_items(credit_note_id);

alter table public.credit_note_items enable row level security;
drop policy if exists cni_select on public.credit_note_items;
create policy cni_select on public.credit_note_items for select
  using (exists (select 1 from public.credit_notes cn where cn.id = credit_note_id and cn.user_id = auth.uid()));
drop policy if exists cni_insert on public.credit_note_items;
create policy cni_insert on public.credit_note_items for insert
  with check (exists (select 1 from public.credit_notes cn where cn.id = credit_note_id and cn.user_id = auth.uid()));
drop policy if exists cni_delete on public.credit_note_items;
create policy cni_delete on public.credit_note_items for delete
  using (exists (select 1 from public.credit_notes cn where cn.id = credit_note_id and cn.user_id = auth.uid()));
