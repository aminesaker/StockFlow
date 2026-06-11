-- ============================================================
-- Retours / Avoirs : table credit_notes + numérotation propre.
-- (Appliqué en prod le 2026-06-11.)
-- ============================================================
alter table public.billing_profiles add column if not exists credit_prefix   text not null default 'A';
alter table public.billing_profiles add column if not exists next_credit_seq integer not null default 0;

create table if not exists public.credit_notes (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  invoice_id    uuid references public.invoices(id) on delete set null,
  customer_id   uuid not null references public.customers(id) on delete restrict,
  credit_number text not null unique,
  reason        text,
  subtotal      numeric(10,2),
  vat_rate      numeric(5,2),
  vat_amount    numeric(10,2),
  amount        numeric(10,2) not null,
  created_at    timestamptz not null default now()
);

alter table public.credit_notes enable row level security;
drop policy if exists credit_notes_select_own on public.credit_notes;
create policy credit_notes_select_own on public.credit_notes for select using (auth.uid() = user_id);
drop policy if exists credit_notes_insert_own on public.credit_notes;
create policy credit_notes_insert_own on public.credit_notes for insert with check (auth.uid() = user_id);
drop policy if exists credit_notes_delete_own on public.credit_notes;
create policy credit_notes_delete_own on public.credit_notes for delete using (auth.uid() = user_id);

create index if not exists credit_notes_invoice_idx on public.credit_notes(invoice_id);
create index if not exists credit_notes_user_idx on public.credit_notes(user_id);

create or replace function public.next_credit_number(p_user_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare v_seq integer; v_prefix text;
begin
  insert into public.billing_profiles (user_id) values (p_user_id) on conflict (user_id) do nothing;
  update public.billing_profiles
     set next_credit_seq = next_credit_seq + 1, updated_at = now()
   where user_id = p_user_id
  returning next_credit_seq, credit_prefix into v_seq, v_prefix;
  return coalesce(v_prefix, 'A') || '-' || to_char(now(), 'YYYY') || '-' || lpad(v_seq::text, 4, '0');
end; $$;

grant execute on function public.next_credit_number(uuid) to authenticated, service_role, anon;
