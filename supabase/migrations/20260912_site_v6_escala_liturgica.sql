-- Paróquia São José — v6: Escala da Pastoral da Liturgia
-- Execute depois da migração v5. Incremental; não remove dados existentes.

create extension if not exists pgcrypto;

create table if not exists public.liturgy_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  can_commentator boolean not null default false,
  can_first_reading boolean not null default false,
  can_second_reading boolean not null default false,
  can_psalmist boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.liturgy_availability_cycles (
  id uuid primary key default gen_random_uuid(),
  month date not null unique,
  response_deadline date,
  status text not null default 'collecting',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint liturgy_cycle_status_check check (status in ('collecting','draft','published','closed'))
);

create table if not exists public.liturgy_availability_requests (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.liturgy_availability_cycles(id) on delete cascade,
  member_id uuid not null references public.liturgy_members(id) on delete cascade,
  token uuid not null default gen_random_uuid() unique,
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  unique (cycle_id, member_id)
);

create table if not exists public.liturgy_availability_choices (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.liturgy_availability_requests(id) on delete cascade,
  mass_schedule_id uuid not null references public.mass_schedule(id) on delete cascade,
  mass_date date not null,
  created_at timestamptz not null default now(),
  unique (request_id, mass_schedule_id, mass_date)
);

create table if not exists public.liturgy_assignments (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.liturgy_availability_cycles(id) on delete cascade,
  mass_schedule_id uuid not null references public.mass_schedule(id) on delete cascade,
  mass_date date not null,
  role text not null,
  member_id uuid references public.liturgy_members(id) on delete set null,
  confirmed boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cycle_id, mass_schedule_id, mass_date, role),
  constraint liturgy_assignment_role_check check (role in ('commentator','first_reading','second_reading','psalmist'))
);

create index if not exists idx_liturgy_requests_cycle on public.liturgy_availability_requests(cycle_id);
create index if not exists idx_liturgy_choices_request on public.liturgy_availability_choices(request_id);
create index if not exists idx_liturgy_assignments_cycle_date on public.liturgy_assignments(cycle_id,mass_date);

alter table public.liturgy_members enable row level security;
alter table public.liturgy_availability_cycles enable row level security;
alter table public.liturgy_availability_requests enable row level security;
alter table public.liturgy_availability_choices enable row level security;
alter table public.liturgy_assignments enable row level security;

DO $$ BEGIN
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='liturgy_members' and policyname='staff manage liturgy members') then
    create policy "staff manage liturgy members" on public.liturgy_members for all using (public.is_parish_staff()) with check (public.is_parish_staff());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='liturgy_availability_cycles' and policyname='staff manage liturgy cycles') then
    create policy "staff manage liturgy cycles" on public.liturgy_availability_cycles for all using (public.is_parish_staff()) with check (public.is_parish_staff());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='liturgy_availability_requests' and policyname='staff manage liturgy requests') then
    create policy "staff manage liturgy requests" on public.liturgy_availability_requests for all using (public.is_parish_staff()) with check (public.is_parish_staff());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='liturgy_availability_choices' and policyname='staff manage liturgy choices') then
    create policy "staff manage liturgy choices" on public.liturgy_availability_choices for all using (public.is_parish_staff()) with check (public.is_parish_staff());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='liturgy_assignments' and policyname='staff manage liturgy assignments') then
    create policy "staff manage liturgy assignments" on public.liturgy_assignments for all using (public.is_parish_staff()) with check (public.is_parish_staff());
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='liturgy_availability_cycles' and policyname='public reads published liturgy cycles') then
    create policy "public reads published liturgy cycles" on public.liturgy_availability_cycles for select using (status='published');
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='liturgy_assignments' and policyname='public reads published liturgy assignments') then
    create policy "public reads published liturgy assignments" on public.liturgy_assignments for select using (exists (select 1 from public.liturgy_availability_cycles c where c.id=cycle_id and c.status='published'));
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='liturgy_members' and policyname='public reads scheduled liturgy member names') then
    create policy "public reads scheduled liturgy member names" on public.liturgy_members for select using (exists (select 1 from public.liturgy_assignments a join public.liturgy_availability_cycles c on c.id=a.cycle_id where a.member_id=id and c.status='published'));
  end if;
END $$;

-- Retorna somente os dados necessários para a pessoa informar sua disponibilidade.
create or replace function public.get_liturgy_availability(p_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  req record;
  result jsonb;
begin
  select r.id request_id, r.submitted_at, c.id cycle_id, c.month, c.response_deadline, c.status,
         m.id member_id, m.name member_name
  into req
  from liturgy_availability_requests r
  join liturgy_availability_cycles c on c.id=r.cycle_id
  join liturgy_members m on m.id=r.member_id
  where r.token=p_token and m.active=true;

  if req.request_id is null then return null; end if;

  select jsonb_build_object(
    'request_id', req.request_id,
    'member_name', req.member_name,
    'month', req.month,
    'response_deadline', req.response_deadline,
    'status', req.status,
    'submitted_at', req.submitted_at,
    'schedules', coalesce((select jsonb_agg(jsonb_build_object(
      'id', ms.id,
      'weekday', ms.weekday,
      'mass_time', ms.mass_time,
      'title', ms.title,
      'notes', ms.notes
    ) order by ms.weekday, ms.mass_time) from mass_schedule ms where ms.active=true),'[]'::jsonb),
    'choices', coalesce((select jsonb_agg(jsonb_build_object('mass_schedule_id', ch.mass_schedule_id,'mass_date',ch.mass_date)) from liturgy_availability_choices ch where ch.request_id=req.request_id),'[]'::jsonb)
  ) into result;
  return result;
end $$;

create or replace function public.save_liturgy_availability(p_token uuid, p_choices jsonb)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  req record;
  item jsonb;
begin
  select r.id request_id, c.status, c.response_deadline
  into req
  from liturgy_availability_requests r
  join liturgy_availability_cycles c on c.id=r.cycle_id
  where r.token=p_token;

  if req.request_id is null or req.status <> 'collecting' then return false; end if;
  if req.response_deadline is not null and current_date > req.response_deadline then return false; end if;

  delete from liturgy_availability_choices where request_id=req.request_id;
  for item in select * from jsonb_array_elements(coalesce(p_choices,'[]'::jsonb)) loop
    insert into liturgy_availability_choices(request_id,mass_schedule_id,mass_date)
    values(req.request_id,(item->>'mass_schedule_id')::uuid,(item->>'mass_date')::date)
    on conflict do nothing;
  end loop;
  update liturgy_availability_requests set submitted_at=now() where id=req.request_id;
  return true;
end $$;

grant execute on function public.get_liturgy_availability(uuid) to anon, authenticated;
grant execute on function public.save_liturgy_availability(uuid,jsonb) to anon, authenticated;
