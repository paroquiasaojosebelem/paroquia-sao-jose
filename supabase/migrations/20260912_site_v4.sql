-- Paróquia São José — evolução incremental do banco existente
-- Execute no SQL Editor do Supabase. Não apaga as tabelas existentes.

create extension if not exists pgcrypto;

-- Colunas complementares em estruturas já existentes
alter table if exists public.pastorals add column if not exists name text;
alter table if exists public.pastorals add column if not exists slug text;
alter table if exists public.pastorals add column if not exists description text;
alter table if exists public.pastorals add column if not exists meeting_info text;
alter table if exists public.pastorals add column if not exists icon text default '✦';
alter table if exists public.pastorals add column if not exists sort_order integer default 0;
alter table if exists public.pastorals add column if not exists active boolean default true;

alter table if exists public.news add column if not exists title text;
alter table if exists public.news add column if not exists summary text;
alter table if exists public.news add column if not exists content text;
alter table if exists public.news add column if not exists image_url text;
alter table if exists public.news add column if not exists published_at timestamptz default now();
alter table if exists public.news add column if not exists active boolean default true;

alter table if exists public.intentions add column if not exists requester_name text;
alter table if exists public.intentions add column if not exists requester_phone text;
alter table if exists public.intentions add column if not exists intention_type text;
alter table if exists public.intentions add column if not exists intention_text text;
alter table if exists public.intentions add column if not exists mass_date date;
alter table if exists public.intentions add column if not exists mass_time time;
alter table if exists public.intentions add column if not exists status text default 'recebida';
alter table if exists public.intentions add column if not exists active boolean default true;
alter table if exists public.intentions add column if not exists created_at timestamptz default now();

alter table if exists public.daily_liturgy add column if not exists reflection text;
alter table if exists public.daily_liturgy add column if not exists updated_at timestamptz default now();

-- Transmissões do YouTube
create table if not exists public.live_streams (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  youtube_url text not null,
  starts_at timestamptz not null,
  status text not null default 'scheduled' check (status in ('scheduled','live','ended')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Configuração do Dízimo. Dados de cartão nunca são gravados aqui.
create table if not exists public.donation_settings (
  id uuid primary key default gen_random_uuid(),
  pix_key text,
  pix_qr_url text,
  card_payment_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Função reutilizável para políticas administrativas
create or replace function public.is_parish_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.active = true
      and p.role in ('admin','editor')
  );
$$;

alter table public.live_streams enable row level security;
alter table public.donation_settings enable row level security;

-- Políticas para tabelas novas
DO $$ BEGIN
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_streams' and policyname='public read active live streams') then
    create policy "public read active live streams" on public.live_streams for select using (active = true or public.is_parish_staff());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='live_streams' and policyname='staff manage live streams') then
    create policy "staff manage live streams" on public.live_streams for all using (public.is_parish_staff()) with check (public.is_parish_staff());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='donation_settings' and policyname='public read donation settings') then
    create policy "public read donation settings" on public.donation_settings for select using (active = true or public.is_parish_staff());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='donation_settings' and policyname='staff manage donation settings') then
    create policy "staff manage donation settings" on public.donation_settings for all using (public.is_parish_staff()) with check (public.is_parish_staff());
  end if;
END $$;

-- Políticas adicionais nas tabelas existentes, sem remover as atuais
DO $$ BEGIN
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='pastorals') then
    alter table public.pastorals enable row level security;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='pastorals' and policyname='site read active pastorals') then
      create policy "site read active pastorals" on public.pastorals for select using (active = true or public.is_parish_staff());
    end if;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='pastorals' and policyname='staff manage pastorals') then
      create policy "staff manage pastorals" on public.pastorals for all using (public.is_parish_staff()) with check (public.is_parish_staff());
    end if;
  end if;

  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='news') then
    alter table public.news enable row level security;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='news' and policyname='site read active news') then
      create policy "site read active news" on public.news for select using (active = true or public.is_parish_staff());
    end if;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='news' and policyname='staff manage news') then
      create policy "staff manage news" on public.news for all using (public.is_parish_staff()) with check (public.is_parish_staff());
    end if;
  end if;

  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='intentions') then
    alter table public.intentions enable row level security;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='intentions' and policyname='public submit intentions') then
      create policy "public submit intentions" on public.intentions for insert with check (true);
    end if;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='intentions' and policyname='staff manage intentions') then
      create policy "staff manage intentions" on public.intentions for all using (public.is_parish_staff()) with check (public.is_parish_staff());
    end if;
  end if;

  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='daily_liturgy') then
    alter table public.daily_liturgy enable row level security;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='daily_liturgy' and policyname='site read daily liturgy reflections') then
      create policy "site read daily liturgy reflections" on public.daily_liturgy for select using (true);
    end if;
    if not exists (select 1 from pg_policies where schemaname='public' and tablename='daily_liturgy' and policyname='staff manage daily liturgy') then
      create policy "staff manage daily liturgy" on public.daily_liturgy for all using (public.is_parish_staff()) with check (public.is_parish_staff());
    end if;
  end if;
END $$;

-- Pastorais solicitadas (insere somente se ainda não existirem)
insert into public.pastorals (name,slug,description,icon,sort_order,active)
select v.name,v.slug,v.description,v.icon,v.ord,true
from (values
 ('Liturgia','liturgia','Serviço de preparação e cuidado das celebrações litúrgicas.','✝',1),
 ('Guarda','guarda','Serviço de acolhida, organização e apoio às celebrações e eventos.','♜',2),
 ('Batismo','batismo','Acolhida e preparação de famílias para o Sacramento do Batismo.','♢',3),
 ('Idoso','idoso','Acolhida, convivência, espiritualidade e cuidado com as pessoas idosas.','♥',4),
 ('Música','musica','Ministério que anima as celebrações por meio do canto e da música litúrgica.','♫',5),
 ('Dízimo','dizimo','Evangelização e acompanhamento dos dizimistas da comunidade.','◆',6),
 ('Saúde','saude','Presença pastoral e oração junto aos enfermos e suas famílias.','✚',7),
 ('Família','familia','Acompanhamento, formação e fortalecimento da vida matrimonial e familiar.','⌂',8),
 ('Pascom','pascom','Pastoral da Comunicação: evangelizar e informar por todos os meios.','◉',9),
 ('Catequese','catequese','Iniciação à vida cristã e formação na fé.','▣',10),
 ('Mães que Oram pelos Filhos','maes-que-oram-pelos-filhos','Mães unidas em oração pela santificação e proteção de seus filhos.','🙏',11)
) as v(name,slug,description,icon,ord)
where not exists (select 1 from public.pastorals p where lower(p.name)=lower(v.name));

-- Horários solicitados (não remove registros existentes; inclui apenas os ausentes)
DO $$
DECLARE r record;
BEGIN
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='mass_schedule') then
    for r in select * from (values
      (1,'18:30'::time,'Santa Missa',null::text),
      (2,'07:00'::time,'Santa Missa',null::text),(2,'18:30'::time,'Santa Missa',null::text),
      (3,'07:00'::time,'Santa Missa',null::text),(3,'19:00'::time,'Santa Missa',null::text),
      (4,'07:00'::time,'Santa Missa',null::text),(4,'18:30'::time,'Santa Missa',null::text),
      (5,'07:00'::time,'Santa Missa',null::text),(5,'18:30'::time,'Santa Missa',null::text),
      (6,'12:00'::time,'Santa Missa','Shopping Boulevard'),(6,'19:00'::time,'Santa Missa',null::text),
      (0,'07:00'::time,'Santa Missa',null::text),(0,'09:00'::time,'Santa Missa',null::text),(0,'11:00'::time,'Santa Missa',null::text),(0,'17:00'::time,'Santa Missa',null::text),(0,'19:00'::time,'Santa Missa',null::text)
    ) as x(weekday,mass_time,title,notes)
    loop
      if not exists (select 1 from public.mass_schedule m where m.weekday=r.weekday and m.mass_time=r.mass_time) then
        insert into public.mass_schedule(weekday,mass_time,title,notes,active) values(r.weekday,r.mass_time,r.title,r.notes,true);
      end if;
    end loop;
  end if;
END $$;
