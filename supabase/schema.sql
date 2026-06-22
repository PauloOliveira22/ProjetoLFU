-- =====================================================================
-- Brasileirao Draft - Schema do Supabase (com validacao server-side)
-- =====================================================================
-- Como usar:
--   1. Crie um projeto gratis em https://supabase.com
--   2. SQL Editor > New query > cole TODO este arquivo > Run
--   3. Copie URL e "anon key" em Project Settings > API e cole em www/js/config.js
--   4. Faca deploy da Edge Function:  supabase functions deploy submit-season
--
-- MODELO DE SEGURANCA:
--   - O cliente NUNCA escreve estatisticas nem titulos. Ele apenas LE.
--   - As tabelas so sao escritas pela Edge Function "submit-season", que usa
--     a service role (ignora RLS) depois de validar e simular no servidor.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Perfis (1 linha por usuario). Cliente apenas LE o proprio perfil.
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  seasons int not null default 0,
  titles int not null default 0,
  wins int not null default 0,
  draws int not null default 0,
  losses int not null default 0,
  goals_for int not null default 0,
  goals_against int not null default 0,
  best_finish int,
  formation_usage jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Apenas LEITURA do proprio perfil. (Sem policies de insert/update: o cliente
-- nao consegue escrever; quem grava e a Edge Function via service role.)
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

-- ---------------------------------------------------------------------
-- Ranking GLOBAL de titulos por time. Leitura para todos; escrita so via
-- a funcao bump_team_title (chamada pela Edge Function / service role).
-- ---------------------------------------------------------------------
create table if not exists public.team_titles (
  club text primary key,
  titles int not null default 0
);

alter table public.team_titles enable row level security;

drop policy if exists "team_titles_read_all" on public.team_titles;
create policy "team_titles_read_all" on public.team_titles
  for select using (true);

-- Incremento atomico (evita corrida entre dois campeoes simultaneos).
create or replace function public.bump_team_title(p_club text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.team_titles (club, titles)
  values (p_club, 1)
  on conflict (club) do update set titles = public.team_titles.titles + 1;
end;
$$;

-- So o servidor pode executar (nao exponha para anon/authenticated).
revoke all on function public.bump_team_title(text) from public, anon, authenticated;
grant execute on function public.bump_team_title(text) to service_role;

-- ---------------------------------------------------------------------
-- Cria o perfil automaticamente quando um usuario se cadastra.
-- Usa o username dos metadados, se enviado no signUp.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
