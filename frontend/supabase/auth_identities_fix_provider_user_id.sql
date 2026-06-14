update public.auth_identities
set provider_user_id = coalesce(
  raw_metadata #>> '{identities,0,identity_data,provider_id}',
  raw_metadata #>> '{identities,0,identity_data,sub}',
  raw_metadata #>> '{user_metadata,provider_id}',
  raw_metadata #>> '{user_metadata,sub}',
  provider_user_id
)
where provider = 'kakao'
  and provider_user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
