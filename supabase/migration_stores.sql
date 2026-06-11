-- ============================================================
-- Multi-boutique : table stores + store_id partout + backfill.
-- Une clé API peut être rattachée à une boutique (api_keys.store_id).
-- (Appliqué en prod le 2026-06-11.)
-- ============================================================
create table if not exists public.stores (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  name           text not null,
  platform       text not null default 'woocommerce',
  domain         text,
  webhook_secret text,
  status         text not null default 'active',
  created_at     timestamptz not null default now()
);
alter table public.stores enable row level security;
drop policy if exists stores_select_own on public.stores;
create policy stores_select_own on public.stores for select using (auth.uid() = user_id);
drop policy if exists stores_insert_own on public.stores;
create policy stores_insert_own on public.stores for insert with check (auth.uid() = user_id);
drop policy if exists stores_update_own on public.stores;
create policy stores_update_own on public.stores for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists stores_delete_own on public.stores;
create policy stores_delete_own on public.stores for delete using (auth.uid() = user_id);

alter table public.products        add column if not exists store_id uuid references public.stores(id) on delete set null;
alter table public.orders          add column if not exists store_id uuid references public.stores(id) on delete set null;
alter table public.customers       add column if not exists store_id uuid references public.stores(id) on delete set null;
alter table public.invoices        add column if not exists store_id uuid references public.stores(id) on delete set null;
alter table public.stock_movements add column if not exists store_id uuid references public.stores(id) on delete set null;
alter table public.api_keys        add column if not exists store_id uuid references public.stores(id) on delete set null;
create index if not exists products_store_idx on public.products(store_id);
create index if not exists orders_store_idx on public.orders(store_id);
create index if not exists api_keys_store_idx on public.api_keys(store_id);

-- Backfill : une boutique par (user, external_source), puis rattachement de l'historique.
insert into public.stores (user_id, name, platform)
select distinct src.user_id, initcap(src.external_source), src.external_source
from (
  select user_id, external_source from public.products where external_source is not null and user_id is not null
  union
  select user_id, external_source from public.orders   where external_source is not null and user_id is not null
) src
where not exists (select 1 from public.stores s where s.user_id = src.user_id and s.platform = src.external_source);

update public.products p set store_id = s.id from public.stores s
where p.external_source is not null and p.store_id is null and s.user_id = p.user_id and s.platform = p.external_source;
update public.orders o set store_id = s.id from public.stores s
where o.external_source is not null and o.store_id is null and s.user_id = o.user_id and s.platform = o.external_source;
update public.invoices i set store_id = o.store_id from public.orders o
where i.order_id = o.id and i.store_id is null and o.store_id is not null;
