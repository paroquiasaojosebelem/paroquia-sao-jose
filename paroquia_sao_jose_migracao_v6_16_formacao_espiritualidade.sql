-- Paróquia São José — V6.16 — Formação e Espiritualidade
begin;
create table if not exists public.spiritual_content (
 id uuid primary key default gen_random_uuid(),
 category text not null default 'Formação Católica',
 title text not null,
 summary text,
 content text not null,
 author text,
 image_url text,
 audio_url text,
 video_url text,
 featured boolean not null default false,
 active boolean not null default true,
 published_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index if not exists spiritual_content_published_idx on public.spiritual_content(active,published_at desc);
alter table public.spiritual_content enable row level security;
grant usage on schema public to anon, authenticated;
grant select on public.spiritual_content to anon;
grant select,insert,update,delete on public.spiritual_content to authenticated;
drop policy if exists "Conteudos espirituais publicados sao publicos" on public.spiritual_content;
create policy "Conteudos espirituais publicados sao publicos" on public.spiritual_content for select to anon,authenticated using (active=true or (auth.role()='authenticated' and public.is_parish_staff()));
drop policy if exists "Equipe gerencia formacao espiritual" on public.spiritual_content;
create policy "Equipe gerencia formacao espiritual" on public.spiritual_content for all to authenticated using (public.is_parish_staff()) with check (public.is_parish_staff());
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values ('parish-spirituality','parish-spirituality',true,8388608,array['image/jpeg','image/png','image/webp','image/gif']) on conflict(id) do update set public=true,file_size_limit=8388608,allowed_mime_types=array['image/jpeg','image/png','image/webp','image/gif'];
drop policy if exists "Leitura publica imagens espiritualidade" on storage.objects;
create policy "Leitura publica imagens espiritualidade" on storage.objects for select to public using(bucket_id='parish-spirituality');
drop policy if exists "Equipe envia imagens espiritualidade" on storage.objects;
create policy "Equipe envia imagens espiritualidade" on storage.objects for insert to authenticated with check(bucket_id='parish-spirituality' and public.is_parish_staff());
drop policy if exists "Equipe atualiza imagens espiritualidade" on storage.objects;
create policy "Equipe atualiza imagens espiritualidade" on storage.objects for update to authenticated using(bucket_id='parish-spirituality' and public.is_parish_staff()) with check(bucket_id='parish-spirituality' and public.is_parish_staff());
drop policy if exists "Equipe exclui imagens espiritualidade" on storage.objects;
create policy "Equipe exclui imagens espiritualidade" on storage.objects for delete to authenticated using(bucket_id='parish-spirituality' and public.is_parish_staff());
commit;
notify pgrst,'reload schema';
select table_schema,table_name from information_schema.tables where table_schema='public' and table_name='spiritual_content';
