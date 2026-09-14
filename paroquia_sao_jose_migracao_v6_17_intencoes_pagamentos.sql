-- PARÓQUIA SÃO JOSÉ — V6.17 — Intenções e Pagamentos
-- Executar no Supabase SQL Editor. Não apaga intenções existentes.
begin;

alter table public.intentions add column if not exists payment_informed_at timestamptz;
alter table public.intentions add column if not exists payment_notes text;
alter table public.intentions add column if not exists confirmed_at timestamptz;
alter table public.intentions add column if not exists celebrated_at timestamptz;
alter table public.intentions add column if not exists admin_notes text;

-- Amplia os estados preservando compatibilidade com registros antigos.
alter table public.intentions drop constraint if exists intentions_payment_status_check;
alter table public.intentions add constraint intentions_payment_status_check
  check (payment_status is null or payment_status in ('pendente','informado','pago','isento','cancelado'));

-- Índices para o uso diário da Secretaria.
create index if not exists intentions_mass_date_idx on public.intentions(mass_date);
create index if not exists intentions_status_idx on public.intentions(status);
create index if not exists intentions_payment_status_idx on public.intentions(payment_status);

-- Garante permissões do PostgREST.
grant select, insert on public.intentions to anon;
grant select, insert, update, delete on public.intentions to authenticated;

-- O fiel pode registrar a intenção e depois informar que realizou o pagamento,
-- sem poder marcar a própria intenção como paga/confirmada.
drop policy if exists "Publico cria intencoes" on public.intentions;
create policy "Publico cria intencoes" on public.intentions
for insert to anon, authenticated
with check (
  coalesce(payment_status,'pendente') = 'pendente'
  and coalesce(status,'recebida') = 'recebida'
);

-- Atualização pública estritamente limitada é feita por RPC abaixo, evitando UPDATE aberto.
create or replace function public.inform_intention_payment(p_id uuid, p_reference text default null)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.intentions
     set payment_status = case when payment_status = 'pago' then 'pago' else 'informado' end,
         payment_reference = coalesce(nullif(trim(p_reference),''), payment_reference),
         payment_informed_at = coalesce(payment_informed_at, now())
   where id = p_id
     and coalesce(payment_status,'pendente') in ('pendente','informado','pago');
  return found;
end;
$$;
revoke all on function public.inform_intention_payment(uuid,text) from public;
grant execute on function public.inform_intention_payment(uuid,text) to anon, authenticated;

commit;
notify pgrst, 'reload schema';

select table_schema, table_name
from information_schema.tables
where table_schema='public' and table_name='intentions';
