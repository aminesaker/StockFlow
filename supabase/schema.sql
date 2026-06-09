-- ============================================================
-- StockFlow — Schéma Supabase
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- PRODUCTS (stock)
-- ============================================================
create table public.products (
  id                  uuid primary key default uuid_generate_v4(),
  name                text not null,
  sku                 text not null unique,
  description         text,
  price               numeric(10, 2) not null default 0,
  cost                numeric(10, 2) not null default 0,
  stock_quantity      integer not null default 0,
  low_stock_threshold integer not null default 5,
  category            text,
  image_url           text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ============================================================
-- CUSTOMERS
-- ============================================================
create table public.customers (
  id         uuid primary key default uuid_generate_v4(),
  full_name  text not null,
  email      text not null unique,
  phone      text,
  address    text,
  city       text,
  country    text,
  created_at timestamptz not null default now()
);

-- ============================================================
-- ORDERS
-- ============================================================
create table public.orders (
  id           uuid primary key default uuid_generate_v4(),
  customer_id  uuid not null references public.customers(id) on delete restrict,
  status       text not null default 'pending'
                 check (status in ('pending','confirmed','shipped','delivered','cancelled')),
  total_amount numeric(10, 2) not null default 0,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ============================================================
-- ORDER ITEMS
-- ============================================================
create table public.order_items (
  id          uuid primary key default uuid_generate_v4(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  product_id  uuid not null references public.products(id) on delete restrict,
  quantity    integer not null check (quantity > 0),
  unit_price  numeric(10, 2) not null,
  total_price numeric(10, 2) generated always as (quantity * unit_price) stored
);

-- ============================================================
-- INVOICES
-- ============================================================
create table public.invoices (
  id                        uuid primary key default uuid_generate_v4(),
  order_id                  uuid references public.orders(id) on delete set null,
  customer_id               uuid not null references public.customers(id) on delete restrict,
  invoice_number            text not null unique,
  status                    text not null default 'draft'
                              check (status in ('draft','sent','paid','overdue','cancelled')),
  amount                    numeric(10, 2) not null,
  due_date                  date not null,
  paid_at                   timestamptz,
  stripe_payment_intent_id  text,
  created_at                timestamptz not null default now()
);

-- ============================================================
-- AUTO-UPDATE updated_at
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create trigger orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
alter table public.products  enable row level security;
alter table public.customers enable row level security;
alter table public.orders    enable row level security;
alter table public.order_items enable row level security;
alter table public.invoices  enable row level security;

-- Politique simple : tout utilisateur authentifié a accès complet
-- (à affiner selon vos besoins multi-tenant)
create policy "Authenticated users — products"
  on public.products for all
  to authenticated using (true) with check (true);

create policy "Authenticated users — customers"
  on public.customers for all
  to authenticated using (true) with check (true);

create policy "Authenticated users — orders"
  on public.orders for all
  to authenticated using (true) with check (true);

create policy "Authenticated users — order_items"
  on public.order_items for all
  to authenticated using (true) with check (true);

create policy "Authenticated users — invoices"
  on public.invoices for all
  to authenticated using (true) with check (true);

-- ============================================================
-- INDEX pour les performances
-- ============================================================
create index on public.products (sku);
create index on public.orders (customer_id, status);
create index on public.order_items (order_id);
create index on public.invoices (customer_id, status);
create index on public.invoices (due_date) where status = 'sent';
