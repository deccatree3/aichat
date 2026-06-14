import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ProviderIdentity {
  provider?: string
  identity_id?: string
  id?: string
  user_id?: string
  identity_data?: Record<string, unknown>
}

interface AuthUserLike {
  id: string
  email?: string
  app_metadata?: { provider?: string }
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

async function sha256(value: string, secret: string) {
  const data = new TextEncoder().encode(`${secret}:${value}`)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function getProvider(user: AuthUserLike) {
  return String(user.app_metadata?.provider ?? user.identities?.[0]?.provider ?? '')
}

function getProviderUserId(user: AuthUserLike, provider: string) {
  const identities = Array.isArray(user.identities) ? user.identities : []
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const authorization = req.headers.get('Authorization')
    if (!authorization) return json({ error: 'Unauthorized' }, 401)

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

    const user = authData.user as AuthUserLike
    const provider = getProvider(user)
    const providerUserId = getProviderUserId(user, provider)
    const socialProfile = providerMetadata(user)
    const providerUserIdHash = providerUserId ? await sha256(providerUserId, hashSecret) : null
    const emailHash = user.email ? await sha256(user.email.toLowerCase(), hashSecret) : null

    let mid: number | null = null

    if (providerUserIdHash) {
      const { data } = await adminClient
        .from('auth_identities')
        .select('mid, app_users!inner(status)')
        .eq('provider', provider)
        .eq('provider_user_id_hash', providerUserIdHash)
        .is('unlinked_at', null)
        .eq('app_users.status', 'active')
        .maybeSingle()
      mid = data?.mid ?? null
    }

    if (!mid && !providerUserIdHash) {
      const { data } = await adminClient
        .from('app_users')
        .select('mid')
        .eq('uid', user.id)
        .maybeSingle()
      mid = data?.mid ?? null
    }

    if (!mid) {
      const { data: appUser, error: appUserError } = await adminClient
        .from('app_users')
        .insert({ uid: user.id, status: 'active' })
        .select('mid')
        .single()
      if (appUserError) throw appUserError
      mid = appUser.mid
    } else {
      const { error } = await adminClient
        .from('app_users')
        .update({ uid: user.id })
        .eq('mid', mid)
      if (error) throw error
    }

    const { error: identityError } = await adminClient.from('auth_identities').upsert({
      mid,
      uid: user.id,
      provider,
      provider_user_id: providerUserId || null,
      provider_user_id_hash: providerUserIdHash,
      email: user.email ?? null,
      email_hash: emailHash,
      provider_name: socialProfile.providerName,
      provider_avatar_url: socialProfile.providerAvatarUrl,
      raw_metadata: socialProfile.rawMetadata,
      unlinked_at: null,
    }, { onConflict: 'mid,provider' })
    if (identityError) throw identityError

    return json({ mid, uid: user.id })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : '회원 식별자 생성에 실패했습니다.' }, 500)
  }
})
