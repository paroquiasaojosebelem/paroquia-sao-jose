-- Paróquia São José — V6.15 Agenda Paroquial
begin;
create table if not exists public.parish_events (
 id uuid primary key default gen_random_uuid(),
 title text not null, category text, summary text, description text, location text,
 starts_at timestamptz not null, ends_at timestamptz, image_url text, responsible text,
 active boolean not null default true, featured boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 constraint parish_events_period check (ends_at is null or ends_at >= starts_at)
);
alter table public.parish_events enable row level security;
grant usage on schema public to anon, authenticated;
grant select on public.parish_events to anon;
grant select,insert,update,delete on public.parish_events to authenticated;
drop policy if exists "Agenda publica pode ser lida" on public.parish_events;
create policy "Agenda publica pode ser lida" on public.parish_events for select to anon,authenticated using (active=true or (auth.role()='authenticated' and public.is_parish_staff()));
drop policy if exists "Equipe paroquial gerencia agenda" on public.parish_events;
create policy "Equipe paroquial gerencia agenda" on public.parish_events for all to authenticated using (public.is_parish_staff()) with check (public.is_parish_staff());
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('parish-events','parish-events',true,8388608,array['image/jpeg','image/png','image/webp','image/gif']) on conflict(id) do update set public=true,file_size_limit=8388608,allowed_mime_types=array['image/jpeg','image/png','image/webp','image/gif'];
drop policy if exists "Leitura publica imagens agenda" on storage.objects;
create policy "Leitura publica imagens agenda" on storage.objects for select to public using(bucket_id='parish-events');
drop policy if exists "Equipe envia imagens agenda" on storage.objects;
create policy "Equipe envia imagens agenda" on storage.objects for insert to authenticated with check(bucket_id='parish-events' and public.is_parish_staff());
drop policy if exists "Equipe atualiza imagens agenda" on storage.objects;
create policy "Equipe atualiza imagens agenda" on storage.objects for update to authenticated using(bucket_id='parish-events' and public.is_parish_staff()) with check(bucket_id='parish-events' and public.is_parish_staff());
drop policy if exists "Equipe exclui imagens agenda" on storage.objects;
create policy "Equipe exclui imagens agenda" on storage.objects for delete to authenticated using(bucket_id='parish-events' and public.is_parish_staff());
commit;
notify pgrst, 'reload schema';
select table_schema,table_name from information_schema.tables where table_schema='public' and table_name='parish_events';
