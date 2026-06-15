import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WithdrawalRequest {
  reason?: string
  detail?: string
}

interface ProviderIdentity {
  provider?: string
  identity_id?: string
  id?: string
  user_id?: string
  identity_data?: Record<string, unknown>
}

interface AuthUserLike {
  app_metadata?: Record<string, unknown>
  user_metadata?: Record<string, unknown>
  identities?: ProviderIdentity[]
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function env(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`${name} is not configured`)
  return value
}

function optionalEnv(name: string) {
  return Deno.env.get(name) ?? ''
}

async function sha256(value: string, secret: string) {
  const data = new TextEncoder().encode(`${secret}:${value}`)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function getProviderUserId(user: AuthUserLike, provider: string | null) {
  const identities = Array.isArray(user?.identities) ? user.identities : []
  const identity = identities.find((item) => item.provider === provider) ?? identities[0]
  const identityData = identity?.identity_data ?? {}
  const metadata = user.user_metadata ?? {}
  return String(
    identityData.provider_id ??
    identityData.sub ??
    metadata.provider_id ??
    metadata.sub ??
    identity?.id ??
    identity?.user_id ??
    identity?.identity_id ??
    '',
  )
}

function metadataString(metadata: Record<string, unknown> | undefined, keys: string[]) {
  for (const key of keys) {
    const value = metadata?.[key]
    if (typeof value === 'string' && value.trim()) return value
  }
  return null
}

function providerMetadata(user: AuthUserLike) {
  const metadata = user.user_metadata ?? {}
  return {
    providerName: metadataString(metadata, ['name', 'full_name', 'nickname', 'user_name', 'preferred_username']),
    providerAvatarUrl: metadataString(metadata, ['avatar_url', 'picture', 'profile_image_url']),
    rawMetadata: {
      app_metadata: user.app_metadata ?? {},
      user_metadata: metadata,
      identities: user.identities ?? [],
    },
  }
}

async function unlinkKakao(providerUserId: string) {
  const kakaoAdminKey = optionalEnv('KAKAO_ADMIN_KEY')
  if (!kakaoAdminKey) throw new Error('KAKAO_ADMIN_KEY is not configured')
  if (!providerUserId) throw new Error('Kakao provider user id is missing')
  const body = new URLSearchParams({
    target_id_type: 'user_id',
    target_id: providerUserId,
  })
  const response = await fetch('https://kapi.kakao.com/v1/user/unlink', {
    method: 'POST',
    headers: {
      Authorization: `KakaoAK ${kakaoAdminKey}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    },
    body,
  })
  if (!response.ok) {
    const message = await response.text()
    throw new Error(`Kakao unlink failed: ${response.status} ${message}`)
  }
  return { ok: true, skipped: false }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const authorization = req.headers.get('Authorization')
    if (!authorization) return json({ error: 'Unauthorized' }, 401)

    const body = await req.json().catch(() => ({})) as WithdrawalRequest
    const reason = body.reason?.trim()
    const detail = body.detail?.trim()
    if (!reason || !detail) return json({ error: '?덊눜 ?ъ쑀瑜??낅젰?댁＜?몄슂.' }, 400)

    const supabaseUrl = env('SUPABASE_URL')
    const anonKey = env('SUPABASE_ANON_KEY')
    const serviceRoleKey = env('SUPABASE_SERVICE_ROLE_KEY')
    const hashSecret = env('WITHDRAWAL_HASH_SECRET')

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
    })
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: authData, error: authError } = await userClient.auth.getUser()
    if (authError || !authData.user) return json({ error: 'Unauthorized' }, 401)

    const user = authData.user
    const provider = String(user.app_metadata?.provider ?? user.identities?.[0]?.provider ?? '')
    const providerUserId = getProviderUserId(user, provider)
    const socialProfile = providerMetadata(user)
    const email = user.email ?? ''

    const providerUserIdHash = providerUserId ? await sha256(providerUserId, hashSecret) : null
    const emailHash = email ? await sha256(email.toLowerCase(), hashSecret) : null

    const { data: identityData, error: identityLookupError } = await adminClient
      .from('auth_identities')
      .select('mid')
      .eq('uid', user.id)
      .maybeSingle()
    if (identityLookupError) throw identityLookupError
    const mid = identityData?.mid
    if (!mid) return json({ error: '?뚯썝 ?뺣낫瑜?李얠쓣 ???놁뒿?덈떎.' }, 400)

    const kakaoUnlink = provider === 'kakao'
      ? await unlinkKakao(providerUserId)
      : { ok: false, skipped: true, reason: 'Not a Kakao account' }

    const now = new Date().toISOString()

    const { error: insertError } = await adminClient.from('account_withdrawals').insert({
      mid,
      provider,
      provider_user_id_hash: providerUserIdHash,
      email_hash: emailHash,
      reason,
      detail,
      records_retention_policy: 'preserve_all',
    })
    if (insertError) throw insertError

    const { error: appUserError } = await adminClient
      .from('app_users')
      .update({ status: 'withdrawn', withdrawn_at: now })
      .eq('mid', mid)
    if (appUserError) throw appUserError

    const { error: profileError } = await adminClient
      .from('social_profiles')
      .update({
        account_status: 'withdrawn',
        withdrawn_at: now,
      })
      .eq('mid', mid)
    if (profileError) throw profileError

    const { error: identityError } = await adminClient
      .from('auth_identities')
      .update({
        provider_user_id: providerUserId || null,
        provider_user_id_hash: providerUserIdHash,
        email: email || null,
        provider_name: socialProfile.providerName,
        provider_avatar_url: socialProfile.providerAvatarUrl,
        raw_metadata: socialProfile.rawMetadata,
        unlinked_at: now,
      })
      .eq('mid', mid)
      .eq('uid', user.id)
    if (identityError) throw identityError

    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(user.id)
    if (deleteUserError) throw deleteUserError

    return json({ ok: true, kakaoUnlink })
  } catch (error) {
    return json({ ok: false, error: error instanceof Error ? error.message : '탈퇴 처리에 실패했습니다.' })
  }
})
