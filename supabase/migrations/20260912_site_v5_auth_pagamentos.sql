-- Paróquia São José — v5: recuperação de senha + pagamentos de intenções
-- Execute depois da migração v4. É incremental e não remove dados.

alter table if exists public.intentions add column if not exists amount numeric(10,2);
alter table if exists public.intentions add column if not exists payment_method text;
alter table if exists public.intentions add column if not exists payment_status text default 'pendente';
alter table if exists public.intentions add column if not exists payment_reference text;
alter table if exists public.intentions add column if not exists paid_at timestamptz;

alter table if exists public.donation_settings add column if not exists intention_amount numeric(10,2);
alter table if exists public.donation_settings add column if not exists intention_pix_key text;
alter table if exists public.donation_settings add column if not exists intention_pix_qr_url text;
alter table if exists public.donation_settings add column if not exists intention_card_payment_url text;

-- Restrições são adicionadas apenas se ainda não existirem.
DO $$ BEGIN
  if not exists (select 1 from pg_constraint where conname='intentions_payment_method_check') then
    alter table public.intentions add constraint intentions_payment_method_check check (payment_method is null or payment_method in ('pix','credit','debit'));
  end if;
  if not exists (select 1 from pg_constraint where conname='intentions_payment_status_check') then
    alter table public.intentions add constraint intentions_payment_status_check check (payment_status is null or payment_status in ('pendente','pago','isento','cancelado'));
  end if;
END $$;
