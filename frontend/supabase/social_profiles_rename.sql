alter table if exists public.profiles
rename to social_profiles;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'profiles_pkey'
      and conrelid = 'public.social_profiles'::regclass
  ) then
    alter table public.social_profiles rename constraint profiles_pkey to social_profiles_pkey;
  end if;

  if exists (
    select 1
    from pg_constraint
    where conname = 'profiles_mid_fkey'
      and conrelid = 'public.social_profiles'::regclass
  ) then
    alter table public.social_profiles rename constraint profiles_mid_fkey to social_profiles_mid_fkey;
  end if;

  if exists (
    select 1
    from pg_trigger
    where tgname = 'profiles_touch_updated_at'
      and tgrelid = 'public.social_profiles'::regclass
  ) then
    alter trigger profiles_touch_updated_at on public.social_profiles rename to social_profiles_touch_updated_at;
  end if;
end $$;

alter index if exists public.profiles_username_key
rename to social_profiles_username_key;

alter table public.social_profiles enable row level security;

drop policy if exists "users can read own profile" on public.social_profiles;
drop policy if exists "users can insert own profile" on public.social_profiles;
drop policy if exists "users can update own profile" on public.social_profiles;
drop policy if exists "users can read own social profile" on public.social_profiles;
create policy "users can read own social profile"
on public.social_profiles for select
using (mid = public.current_mid() or public.is_admin());

drop policy if exists "users can insert own social profile" on public.social_profiles;
create policy "users can insert own social profile"
on public.social_profiles for insert
with check (mid = public.current_mid());

drop policy if exists "users can update own social profile" on public.social_profiles;
create policy "users can update own social profile"
on public.social_profiles for update
using (mid = public.current_mid())
with check (mid = public.current_mid());
