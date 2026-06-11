-- ============================================================
-- Facturation conforme : profil vendeur, ventilation TVA,
-- numérotation séquentielle continue par vendeur.
-- (Appliqué en prod le 2026-06-11.)
-- ============================================================

create table if not exists public.billing_profiles (
  user_id            uuid primary key references auth.users(id) on delete cascade,
  company_name       text,
  address_line1      text,
  address_line2      text,
  postal_code        text,
  city               text,
  country            text not null default 'France',
  siret              text,
  vat_number         text,
  vat_exempt         boolean not null default false,
  default_vat_rate   numeric(5,2) not null default 20.00,
  invoice_prefix     text not null default 'F',
  next_invoice_seq   integer not null default 0,
  payment_terms_days integer not null default 30,
  legal_footer       text,
  logo_url           text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.billing_profiles enable row level security;
drop policy if exists billing_profiles_select_own on public.billing_profiles;
create policy billing_profiles_select_own on public.billing_profiles for select using (auth.uid() = user_id);
drop policy if exists billing_profiles_insert_own on public.billing_profiles;
create policy billing_profiles_insert_own on public.billing_profiles for insert with check (auth.uid() = user_id);
drop policy if exists billing_profiles_update_own on public.billing_profiles;
create policy billing_profiles_update_own on public.billing_profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists billing_profiles_delete_own on public.billing_profiles;
create policy billing_profiles_delete_own on public.billing_profiles for delete using (auth.uid() = user_id);

alter table public.invoices add column if not exists subtotal   numeric(10,2);
alter table public.invoices add column if not exists vat_rate   numeric(5,2);
alter table public.invoices add column if not exists vat_amount numeric(10,2);

create or replace function public.next_invoice_number(p_user_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare v_seq integer; v_prefix text;
begin
  insert into public.billing_profiles (user_id) values (p_user_id) on conflict (user_id) do nothing;
  update public.billing_profiles
     set next_invoice_seq = next_invoice_seq + 1, updated_at = now()
   where user_id = p_user_id
  returning next_invoice_seq, invoice_prefix into v_seq, v_prefix;
  return coalesce(v_prefix, 'F') || '-' || to_char(now(), 'YYYY') || '-' || lpad(v_seq::text, 4, '0');
end; $$;

grant execute on function public.next_invoice_number(uuid) to authenticated, service_role, anon;
