import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

interface ProviderIdentity {
  provider?: string
  identity_id?: string
  id?: string
  user_id?: string
  identity_data?: Record<string, unknown>
}

interface AuthUserLike {
  user_metadata?: Record<string, unknown>
  identities?: ProviderIdentity[]
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  return json({ blocked: false })

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

    const user = authData.user
    const provider = String(user.app_metadata?.provider ?? user.identities?.[0]?.provider ?? '')
    const providerUserId = getProviderUserId(user, provider)
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

    let query = adminClient
      .from('account_withdrawals')
      .select('rejoin_block_until')
      .gt('rejoin_block_until', new Date().toISOString())
      .order('rejoin_block_until', { ascending: false })
      .limit(1)

    if (providerUserIdHash) {
      query = query.eq('provider', provider).eq('provider_user_id_hash', providerUserIdHash)
    } else if (emailHash) {
      query = query.eq('email_hash', emailHash)
    } else {
      return json({ blocked: false })
    }

    const { data, error } = await query.maybeSingle()
    if (error) throw error
    if (!data) {
      await adminClient
        .from('app_users')
        .update({ status: 'active', withdrawn_at: null })
        .eq('mid', mid)
      await adminClient
        .from('social_profiles')
        .update({ account_status: 'active', withdrawn_at: null })
        .eq('mid', mid)
      return json({ blocked: false })
    }

    return json({ blocked: true, blockedUntil: data.rejoin_block_until })
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : '?ш????쒗븳 ?뺤씤???ㅽ뙣?덉뒿?덈떎.' }, 500)
  }
})
