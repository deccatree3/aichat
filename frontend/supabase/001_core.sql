create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = auth.uid()
  );
$$;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null default 'zeta',
  username text unique,
  email text,
  avatar_url text,
  bio text,
  birthdate date,
  gender text,
  provider text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  dialogue_mode text not null default 'unlimited' check (dialogue_mode in ('safe', 'unlimited')),
  marketing_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notification_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null,
  key text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, category, key)
);

create table if not exists public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('creator', 'plot', 'hashtag')),
  target_id text not null,
  target_label text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, target_type, target_id)
);

create table if not exists public.wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  piece_balance integer not null default 0 check (piece_balance >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.piece_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null,
  reason text not null,
  description text not null,
  created_at timestamptz not null default now()
);

create index if not exists piece_ledger_user_created_idx on public.piece_ledger(user_id, created_at desc);

create table if not exists public.policy_documents (
  slug text primary key,
  title text not null,
  body_markdown text not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_core_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_core_updated_at();

drop trigger if exists user_settings_touch_updated_at on public.user_settings;
create trigger user_settings_touch_updated_at
before update on public.user_settings
for each row execute function public.touch_core_updated_at();

drop trigger if exists notification_preferences_touch_updated_at on public.notification_preferences;
create trigger notification_preferences_touch_updated_at
before update on public.notification_preferences
for each row execute function public.touch_core_updated_at();

drop trigger if exists wallets_touch_updated_at on public.wallets;
create trigger wallets_touch_updated_at
before update on public.wallets
for each row execute function public.touch_core_updated_at();

drop trigger if exists policy_documents_touch_updated_at on public.policy_documents;
create trigger policy_documents_touch_updated_at
before update on public.policy_documents
for each row execute function public.touch_core_updated_at();

alter table public.admin_users enable row level security;
alter table public.profiles enable row level security;
alter table public.user_settings enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.user_blocks enable row level security;
alter table public.wallets enable row level security;
alter table public.piece_ledger enable row level security;
alter table public.policy_documents enable row level security;

drop policy if exists "admins can read admin users" on public.admin_users;
create policy "admins can read admin users"
on public.admin_users for select
using (public.is_admin() or user_id = auth.uid());

drop policy if exists "users can read own profile" on public.profiles;
create policy "users can read own profile"
on public.profiles for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "users can insert own profile" on public.profiles;
create policy "users can insert own profile"
on public.profiles for insert
with check (user_id = auth.uid());

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
on public.profiles for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "users can manage own settings" on public.user_settings;
create policy "users can manage own settings"
on public.user_settings for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "users can manage own notification preferences" on public.notification_preferences;
create policy "users can manage own notification preferences"
on public.notification_preferences for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "users can manage own blocks" on public.user_blocks;
create policy "users can manage own blocks"
on public.user_blocks for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "users can read own wallet" on public.wallets;
create policy "users can read own wallet"
on public.wallets for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "admins can manage wallets" on public.wallets;
create policy "admins can manage wallets"
on public.wallets for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "users can read own ledger" on public.piece_ledger;
create policy "users can read own ledger"
on public.piece_ledger for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "admins can manage ledger" on public.piece_ledger;
create policy "admins can manage ledger"
on public.piece_ledger for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "published policies are public" on public.policy_documents;
create policy "published policies are public"
on public.policy_documents for select
using (status = 'published' and published_at <= now());

drop policy if exists "admins can manage policies" on public.policy_documents;
create policy "admins can manage policies"
on public.policy_documents for all
using (public.is_admin())
with check (public.is_admin());
