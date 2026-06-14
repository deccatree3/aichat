alter table public.auth_identities
drop constraint if exists auth_identities_provider_provider_user_id_hash_key;

drop index if exists public.auth_identities_active_provider_hash_key;

create unique index auth_identities_active_provider_hash_key
on public.auth_identities(provider, provider_user_id_hash)
where provider_user_id_hash is not null and unlinked_at is null;
