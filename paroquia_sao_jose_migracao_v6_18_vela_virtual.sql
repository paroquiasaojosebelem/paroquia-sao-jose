-- Paróquia São José — V6.18 — Vela Virtual de São José
begin;

create table if not exists public.virtual_candles (
  id uuid primary key default gen_random_uuid(),
  name text,
  intention_type text not null default 'Pedido especial',
  message text,
  is_public boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '7 days'),
  moderated_at timestamptz,
  admin_notes text
);

create index if not exists virtual_candles_active_expiry_idx on public.virtual_candles(active, expires_at desc);
create index if not exists virtual_candles_created_idx on public.virtual_candles(created_at desc);

alter table public.virtual_candles enable row level security;
grant usage on schema public to anon, authenticated;
revoke all on public.virtual_candles from anon;
grant select,insert,update,delete on public.virtual_candles to authenticated;

drop policy if exists "Equipe gerencia velas virtuais" on public.virtual_candles;
create policy "Equipe gerencia velas virtuais" on public.virtual_candles
for all to authenticated
using (public.is_parish_staff())
with check (public.is_parish_staff());

-- Inserção pública controlada: o visitante nunca recebe acesso direto à tabela.
create or replace function public.light_virtual_candle(
  p_name text default null,
  p_intention_type text default 'Pedido especial',
  p_message text default null,
  p_is_public boolean default false
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_name text := nullif(trim(coalesce(p_name,'')), '');
  v_type text := trim(coalesce(p_intention_type,'Pedido especial'));
  v_message text := nullif(trim(coalesce(p_message,'')), '');
begin
  if v_type not in ('Família','Saúde','Trabalho','Falecidos','Ação de graças','Pedido especial') then
    raise exception 'Tipo de intenção inválido';
  end if;
  if length(coalesce(v_name,'')) > 80 then raise exception 'Nome muito longo'; end if;
  if length(coalesce(v_message,'')) > 250 then raise exception 'Intenção muito longa'; end if;

  insert into public.virtual_candles(name,intention_type,message,is_public,expires_at)
  values (v_name,v_type,v_message,coalesce(p_is_public,false),now()+interval '7 days')
  returning id into v_id;
  return v_id;
end;
$$;

-- Retorno sanitizado para a capela pública. Intenções privadas nunca saem da função.
create or replace function public.get_public_virtual_candles(p_limit integer default 36)
returns table(
  id uuid,
  display_name text,
  intention_type text,
  display_message text,
  is_public boolean,
  created_at timestamptz,
  expires_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select
    c.id,
    case when c.is_public then coalesce(nullif(trim(c.name),''),'Uma pessoa da comunidade') else 'Uma intenção particular' end,
    case when c.is_public then c.intention_type else 'Intenção particular' end,
    case when c.is_public then c.message else null end,
    c.is_public,
    c.created_at,
    c.expires_at
  from public.virtual_candles c
  where c.active = true and c.expires_at > now()
  order by c.created_at desc
  limit greatest(1,least(coalesce(p_limit,36),60));
$$;

create or replace function public.get_virtual_candle_stats()
returns table(total bigint, familia bigint, saude bigint, acao_gracas bigint)
language sql
security definer
set search_path = public
stable
as $$
 select
   count(*),
   count(*) filter (where intention_type='Família'),
   count(*) filter (where intention_type='Saúde'),
   count(*) filter (where intention_type='Ação de graças')
 from public.virtual_candles
 where active=true and expires_at>now();
$$;

grant execute on function public.light_virtual_candle(text,text,text,boolean) to anon, authenticated;
grant execute on function public.get_public_virtual_candles(integer) to anon, authenticated;
grant execute on function public.get_virtual_candle_stats() to anon, authenticated;

commit;
notify pgrst,'reload schema';
select table_schema,table_name from information_schema.tables where table_schema='public' and table_name='virtual_candles';
