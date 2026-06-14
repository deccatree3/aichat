alter table public.auth_identities drop constraint if exists auth_identities_pkey;
alter table public.auth_identities alter column uid drop not null;
alter table public.auth_identities add constraint auth_identities_pkey primary key (mid, provider);
