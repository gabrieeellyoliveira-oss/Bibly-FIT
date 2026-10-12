-- Bibly: rode este arquivo inteiro no SQL Editor do Supabase (pode rodar mais de uma vez)

-- 1. Dados do app (treinos, registros, medidas, metas), um registro por pessoa
create table if not exists public.app_state (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_state enable row level security;

drop policy if exists "app_state: dona lê" on public.app_state;
drop policy if exists "app_state: dona cria" on public.app_state;
drop policy if exists "app_state: dona atualiza" on public.app_state;
drop policy if exists "app_state: dona apaga" on public.app_state;

create policy "app_state: dona lê" on public.app_state
  for select to authenticated using (auth.uid() = user_id);
create policy "app_state: dona cria" on public.app_state
  for insert to authenticated with check (auth.uid() = user_id);
create policy "app_state: dona atualiza" on public.app_state
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "app_state: dona apaga" on public.app_state
  for delete to authenticated using (auth.uid() = user_id);

-- 2. Fotos de evolução: bucket privado, cada pessoa só vê a própria pasta (<user_id>/...)
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

drop policy if exists "fotos: dona lê" on storage.objects;
drop policy if exists "fotos: dona envia" on storage.objects;
drop policy if exists "fotos: dona atualiza" on storage.objects;
drop policy if exists "fotos: dona apaga" on storage.objects;

create policy "fotos: dona lê" on storage.objects
  for select to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "fotos: dona envia" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "fotos: dona atualiza" on storage.objects
  for update to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "fotos: dona apaga" on storage.objects
  for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
