-- =====================================================================
-- Brasileirao Draft - Schema do Supabase
-- =====================================================================
-- Como usar:
--   1. Crie um projeto gratis em https://supabase.com
--   2. Abra: SQL Editor > New query
--   3. Cole TODO este arquivo e clique em "Run"
--   4. Copie a URL e a "anon key" em Project Settings > API
--      e cole em www/js/config.js
-- =====================================================================

-- ---------------------------------------------------------------------
-- Tabela de perfis (1 linha por usuario autenticado).
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

-- Cada usuario so enxerga/edita o proprio perfil.
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---------------------------------------------------------------------
-- Ranking GLOBAL: quantas vezes os usuarios levaram cada time ao titulo.
-- ---------------------------------------------------------------------
create table if not exists public.team_titles (
  club text primary key,
  titles int not null default 0
);

alter table public.team_titles enable row level security;

-- Leitura liberada para todos (inclusive visitantes).
drop policy if exists "team_titles_read_all" on public.team_titles;
create policy "team_titles_read_all" on public.team_titles
  for select using (true);

-- A escrita NAO e liberada por policy: so acontece via a funcao abaixo,
-- que roda com privilegios elevados (security definer) e exige login.
-- Isso evita que alguem altere a contagem diretamente.
create or replace function public.increment_team_title(p_club text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'login obrigatorio';
  end if;
  insert into public.team_titles (club, titles)
  values (p_club, 1)
  on conflict (club) do update set titles = public.team_titles.titles + 1;
end;
$$;

grant execute on function public.increment_team_title(text) to authenticated;

-- ---------------------------------------------------------------------
-- (Opcional) Trigger para criar o perfil automaticamente no cadastro.
-- O cliente ja faz um upsert no signUp, entao isto e apenas um reforco.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
