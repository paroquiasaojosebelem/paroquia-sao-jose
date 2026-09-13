-- PARÓQUIA SÃO JOSÉ — V6.14
-- Carrossel de Destaques/Banners da página inicial

begin;

create table if not exists public.highlights (
  id uuid primary key default gen_random_uuid(),
  title text,
  category text,
  summary text,
  image_url text not null,
  mobile_image_url text,
  image_alt text,
  button_label text,
  button_url text,
  display_type text not null default 'editorial' check (display_type in ('editorial','complete')),
  sort_order integer not null default 0,
  starts_on date,
  ends_on date,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint highlights_period_check check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

create index if not exists highlights_public_idx on public.highlights(active,sort_order,starts_on,ends_on);

alter table public.highlights enable row level security;

drop policy if exists "Destaques publicos podem ser lidos" on public.highlights;
create policy "Destaques publicos podem ser lidos"
on public.highlights for select
to anon, authenticated
using (active = true or public.is_parish_staff());

drop policy if exists "Equipe paroquial gerencia destaques" on public.highlights;
create policy "Equipe paroquial gerencia destaques"
on public.highlights for all
to authenticated
using (public.is_parish_staff())
with check (public.is_parish_staff());

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('parish-banners','parish-banners',true,8388608,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public=true,file_size_limit=8388608,allowed_mime_types=array['image/jpeg','image/png','image/webp','image/gif'];

drop policy if exists "Leitura publica banners paroquia" on storage.objects;
create policy "Leitura publica banners paroquia"
on storage.objects for select
to public
using (bucket_id='parish-banners');

drop policy if exists "Equipe envia banners paroquia" on storage.objects;
create policy "Equipe envia banners paroquia"
on storage.objects for insert
to authenticated
with check (bucket_id='parish-banners' and public.is_parish_staff());

drop policy if exists "Equipe atualiza banners paroquia" on storage.objects;
create policy "Equipe atualiza banners paroquia"
on storage.objects for update
to authenticated
using (bucket_id='parish-banners' and public.is_parish_staff())
with check (bucket_id='parish-banners' and public.is_parish_staff());

drop policy if exists "Equipe exclui banners paroquia" on storage.objects;
create policy "Equipe exclui banners paroquia"
on storage.objects for delete
to authenticated
using (bucket_id='parish-banners' and public.is_parish_staff());

commit;
