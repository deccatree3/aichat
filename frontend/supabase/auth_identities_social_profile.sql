alter table public.auth_identities
add column if not exists email text,
add column if not exists provider_name text,
add column if not exists provider_avatar_url text,
add column if not exists raw_metadata jsonb not null default '{}'::jsonb;
