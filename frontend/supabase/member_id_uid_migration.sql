drop policy if exists "admins can read admin users" on public.admin_users;
drop policy if exists "users can read own app user" on public.app_users;
drop policy if exists "users can read own auth identities" on public.auth_identities;
drop policy if exists "users can read own social profile" on public.social_profiles;
drop policy if exists "users can insert own social profile" on public.social_profiles;
drop policy if exists "users can update own social profile" on public.social_profiles;
drop policy if exists "users can manage own settings" on public.user_settings;
drop policy if exists "users can manage own notification preferences" on public.notification_preferences;
drop policy if exists "users can manage own blocks" on public.user_blocks;
drop policy if exists "users can read own wallet" on public.wallets;
drop policy if exists "admins can manage wallets" on public.wallets;
drop policy if exists "users can read own ledger" on public.piece_ledger;
drop policy if exists "admins can manage ledger" on public.piece_ledger;
drop policy if exists "admins can read account withdrawals" on public.account_withdrawals;
drop policy if exists "Users can read own contacts" on public.contacts;
drop policy if exists "Users can create own contacts" on public.contacts;
drop policy if exists "Admins can update contacts" on public.contacts;
drop policy if exists "Users can read own contact replies" on public.contact_replies;
drop policy if exists "Users can read contact replies" on public.contact_replies;
drop policy if exists "Admins can manage contact replies" on public.contact_replies;

drop function if exists public.current_app_user_id();

alter table public.app_users add column if not exists mid bigint;

with ordered as (
  select id, row_number() over (order by created_at, id)::bigint as next_mid
  from public.app_users
  where mid is null
)
update public.app_users
set mid = ordered.next_mid
from ordered
where public.app_users.id = ordered.id;

create sequence if not exists public.app_users_mid_seq;
select setval(
  'public.app_users_mid_seq',
  greatest((select coalesce(max(mid), 0) from public.app_users), 1),
  true
);

alter table public.app_users alter column mid set default nextval('public.app_users_mid_seq');
alter table public.app_users alter column mid set not null;

do $$
declare
  item record;
begin
  for item in
    select con.conname, rel.relname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and con.contype = 'f'
      and con.confrelid = 'public.app_users'::regclass
  loop
    execute format('alter table public.%I drop constraint %I', item.relname, item.conname);
  end loop;
end $$;

alter table public.social_profiles add column if not exists mid bigint;
update public.social_profiles set mid = app_users.mid from public.app_users where social_profiles.user_id = app_users.id and social_profiles.mid is null;
alter table public.social_profiles drop constraint if exists social_profiles_pkey;
alter table public.social_profiles drop column if exists user_id;
alter table public.social_profiles alter column mid set not null;
alter table public.social_profiles add constraint social_profiles_pkey primary key (mid);

alter table public.user_settings add column if not exists mid bigint;
update public.user_settings set mid = app_users.mid from public.app_users where user_settings.user_id = app_users.id and user_settings.mid is null;
alter table public.user_settings drop constraint if exists user_settings_pkey;
alter table public.user_settings drop column if exists user_id;
alter table public.user_settings alter column mid set not null;
alter table public.user_settings add constraint user_settings_pkey primary key (mid);

alter table public.notification_preferences add column if not exists mid bigint;
update public.notification_preferences set mid = app_users.mid from public.app_users where notification_preferences.user_id = app_users.id and notification_preferences.mid is null;
alter table public.notification_preferences drop constraint if exists notification_preferences_pkey;
alter table public.notification_preferences drop column if exists user_id;
alter table public.notification_preferences alter column mid set not null;
alter table public.notification_preferences add constraint notification_preferences_pkey primary key (mid, category, key);

alter table public.user_blocks add column if not exists mid bigint;
update public.user_blocks set mid = app_users.mid from public.app_users where user_blocks.user_id = app_users.id and user_blocks.mid is null;
alter table public.user_blocks drop constraint if exists user_blocks_user_id_target_type_target_id_key;
alter table public.user_blocks drop column if exists user_id;
alter table public.user_blocks alter column mid set not null;
alter table public.user_blocks add constraint user_blocks_mid_target_type_target_id_key unique (mid, target_type, target_id);

alter table public.wallets add column if not exists mid bigint;
update public.wallets set mid = app_users.mid from public.app_users where wallets.user_id = app_users.id and wallets.mid is null;
alter table public.wallets drop constraint if exists wallets_pkey;
alter table public.wallets drop column if exists user_id;
alter table public.wallets alter column mid set not null;
alter table public.wallets add constraint wallets_pkey primary key (mid);

alter table public.piece_ledger add column if not exists mid bigint;
update public.piece_ledger set mid = app_users.mid from public.app_users where piece_ledger.user_id = app_users.id and piece_ledger.mid is null;
alter table public.piece_ledger drop column if exists user_id;
alter table public.piece_ledger alter column mid set not null;

alter table public.contacts add column if not exists mid bigint;
update public.contacts set mid = app_users.mid from public.app_users where contacts.user_id = app_users.id and contacts.mid is null;
alter table public.contacts drop column if exists user_id;
alter table public.contacts alter column mid set not null;

alter table public.account_withdrawals add column if not exists mid bigint;
update public.account_withdrawals set mid = app_users.mid from public.app_users where account_withdrawals.user_id = app_users.id and account_withdrawals.mid is null;
alter table public.account_withdrawals drop column if exists user_id;

alter table public.auth_identities add column if not exists mid bigint;
update public.auth_identities set mid = app_users.mid from public.app_users where auth_identities.app_user_id = app_users.id and auth_identities.mid is null;
alter table public.auth_identities drop constraint if exists auth_identities_pkey;
alter table public.auth_identities drop constraint if exists auth_identities_app_user_id_supabase_user_id_key;
alter table public.auth_identities drop column if exists app_user_id;
alter table public.auth_identities rename column supabase_user_id to uid;
alter table public.auth_identities alter column mid set not null;
alter table public.auth_identities alter column uid set not null;
alter table public.auth_identities add constraint auth_identities_pkey primary key (uid);
alter table public.auth_identities drop column if exists id;

alter table public.app_users rename column primary_auth_user_id to uid;
alter table public.app_users drop constraint if exists app_users_pkey;
alter table public.app_users add constraint app_users_pkey primary key (mid);
alter table public.app_users drop column if exists id;

alter table public.admin_users rename column user_id to uid;
alter table public.notices rename column created_by to created_by_uid;
alter table public.notices rename column updated_by to updated_by_uid;
alter table public.faqs rename column created_by to created_by_uid;
alter table public.faqs rename column updated_by to updated_by_uid;
alter table public.contact_replies rename column author_id to author_uid;

alter table public.social_profiles add constraint social_profiles_mid_fkey foreign key (mid) references public.app_users(mid) on delete cascade;
alter table public.user_settings add constraint user_settings_mid_fkey foreign key (mid) references public.app_users(mid) on delete cascade;
alter table public.notification_preferences add constraint notification_preferences_mid_fkey foreign key (mid) references public.app_users(mid) on delete cascade;
alter table public.user_blocks add constraint user_blocks_mid_fkey foreign key (mid) references public.app_users(mid) on delete cascade;
alter table public.wallets add constraint wallets_mid_fkey foreign key (mid) references public.app_users(mid) on delete cascade;
alter table public.piece_ledger add constraint piece_ledger_mid_fkey foreign key (mid) references public.app_users(mid) on delete cascade;
alter table public.contacts add constraint contacts_mid_fkey foreign key (mid) references public.app_users(mid) on delete cascade;
alter table public.account_withdrawals add constraint account_withdrawals_mid_fkey foreign key (mid) references public.app_users(mid) on delete set null;
alter table public.auth_identities add constraint auth_identities_mid_fkey foreign key (mid) references public.app_users(mid) on delete cascade;

drop index if exists auth_identities_app_user_idx;
create index if not exists auth_identities_mid_idx on public.auth_identities(mid);
drop index if exists contacts_user_idx;
create index if not exists contacts_mid_idx on public.contacts(mid, updated_at desc);
drop index if exists piece_ledger_user_created_idx;
create index if not exists piece_ledger_mid_created_idx on public.piece_ledger(mid, created_at desc);

create or replace function public.current_mid()
returns bigint
language sql
security definer
set search_path = public
as $$
  select mid
  from public.auth_identities
  where uid = auth.uid()
    and unlinked_at is null
  order by linked_at desc
  limit 1;
$$;

create or replace function public.current_app_user_id()
returns bigint
language sql
security definer
set search_path = public
as $$
  select public.current_mid();
$$;

drop policy if exists "admins can read admin users" on public.admin_users;
create policy "admins can read admin users"
on public.admin_users for select
using (public.is_admin() or uid = auth.uid());

drop policy if exists "users can read own app user" on public.app_users;
create policy "users can read own app user"
on public.app_users for select
using (mid = public.current_mid() or public.is_admin());

drop policy if exists "users can read own auth identities" on public.auth_identities;
create policy "users can read own auth identities"
on public.auth_identities for select
using (mid = public.current_mid() or public.is_admin());

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

drop policy if exists "users can manage own settings" on public.user_settings;
create policy "users can manage own settings"
on public.user_settings for all
using (mid = public.current_mid())
with check (mid = public.current_mid());

drop policy if exists "users can manage own notification preferences" on public.notification_preferences;
create policy "users can manage own notification preferences"
on public.notification_preferences for all
using (mid = public.current_mid())
with check (mid = public.current_mid());

drop policy if exists "users can manage own blocks" on public.user_blocks;
create policy "users can manage own blocks"
on public.user_blocks for all
using (mid = public.current_mid())
with check (mid = public.current_mid());

drop policy if exists "users can read own wallet" on public.wallets;
create policy "users can read own wallet"
on public.wallets for select
using (mid = public.current_mid() or public.is_admin());

drop policy if exists "admins can manage wallets" on public.wallets;
create policy "admins can manage wallets"
on public.wallets for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "users can read own ledger" on public.piece_ledger;
create policy "users can read own ledger"
on public.piece_ledger for select
using (mid = public.current_mid() or public.is_admin());

drop policy if exists "admins can manage ledger" on public.piece_ledger;
create policy "admins can manage ledger"
on public.piece_ledger for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admins can read account withdrawals" on public.account_withdrawals;
create policy "admins can read account withdrawals"
on public.account_withdrawals for select
using (public.is_admin());

drop policy if exists "Users can read own contacts" on public.contacts;
create policy "Users can read own contacts"
on public.contacts
for select
using (mid = public.current_mid() or public.is_admin());

drop policy if exists "Users can create own contacts" on public.contacts;
create policy "Users can create own contacts"
on public.contacts
for insert
with check (mid = public.current_mid());

drop policy if exists "Admins can update contacts" on public.contacts;
create policy "Admins can update contacts"
on public.contacts
for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Users can read own contact replies" on public.contact_replies;
create policy "Users can read own contact replies"
on public.contact_replies
for select
using (
  public.is_admin()
  or exists (
    select 1 from public.contacts
    where contacts.id = contact_replies.contact_id
      and contacts.mid = public.current_mid()
  )
);

drop policy if exists "Admins can manage contact replies" on public.contact_replies;
create policy "Admins can manage contact replies"
on public.contact_replies
for all
using (public.is_admin())
with check (public.is_admin());
