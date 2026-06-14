alter table public.auth_identities
add column if not exists provider_user_id text;

create index if not exists auth_identities_provider_user_id_idx
on public.auth_identities(provider, provider_user_id);
