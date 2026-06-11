create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) > 0),
  body_markdown text not null check (char_length(trim(body_markdown)) > 0),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  is_pinned boolean not null default false,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notices_public_order_idx
  on public.notices (is_pinned desc, published_at desc)
  where status = 'published';

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = auth.uid()
  );
$$;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  if new.status = 'published' and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists notices_touch_updated_at on public.notices;
create trigger notices_touch_updated_at
before insert or update on public.notices
for each row execute function public.touch_updated_at();

alter table public.admin_users enable row level security;
alter table public.notices enable row level security;

drop policy if exists "Admins can read admin users" on public.admin_users;
create policy "Admins can read admin users"
on public.admin_users
for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "Public can read published notices" on public.notices;
create policy "Public can read published notices"
on public.notices
for select
using (status = 'published' or public.is_admin());

drop policy if exists "Admins can insert notices" on public.notices;
create policy "Admins can insert notices"
on public.notices
for insert
with check (public.is_admin());

drop policy if exists "Admins can update notices" on public.notices;
create policy "Admins can update notices"
on public.notices
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Admins can delete notices" on public.notices;
create policy "Admins can delete notices"
on public.notices
for delete
using (public.is_admin());
