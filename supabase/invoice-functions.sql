-- ============================================================
-- À exécuter dans Supabase Dashboard → SQL Editor
-- ============================================================

-- Génère un numéro de facture unique : INV-202506-0001
create or replace function public.generate_invoice_number()
returns text
language plpgsql
security definer
as $$
declare
  v_prefix  text;
  v_count   integer;
  v_number  text;
begin
  v_prefix := 'INV-' || to_char(now(), 'YYYYMM');

  select count(*) + 1
  into   v_count
  from   public.invoices
  where  invoice_number like v_prefix || '-%';

  v_number := v_prefix || '-' || lpad(v_count::text, 4, '0');
  return v_number;
end;
$$;
