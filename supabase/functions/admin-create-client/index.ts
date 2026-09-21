import { createClient } from 'npm:@supabase/supabase-js@2'

const ALLOWED_ORIGINS = new Set([
  'https://gerenciarecreio-cmd.github.io',
  'http://localhost:5173',
  'http://localhost:3000',
])

function corsHeaders(req: Request) {
  const origin = req.headers.get('origin') || ''
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : 'https://gerenciarecreio-cmd.github.io'
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json; charset=utf-8' },
  })
}

function getSecretKey() {
  const modern = Deno.env.get('SUPABASE_SECRET_KEYS')
  if (modern) {
    const parsed = JSON.parse(modern)
    return parsed.default || Object.values(parsed)[0]
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(req) })
  }

  if (req.method !== 'POST') {
    return json(req, { error: 'Método não permitido.' }, 405)
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const secretKey = getSecretKey()

    if (!supabaseUrl || !secretKey) {
      return json(req, { error: 'Configuração interna do Supabase incompleta.' }, 500)
    }

    const authorization = req.headers.get('Authorization')
    const token = authorization?.replace(/^Bearer\s+/i, '')

    if (!token) {
      return json(req, { error: 'Sessão não encontrada.' }, 401)
    }

    const admin = createClient(supabaseUrl, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: userData, error: userError } = await admin.auth.getUser(token)
    if (userError || !userData.user) {
      return json(req, { error: 'Sessão inválida ou expirada.' }, 401)
    }

    const { data: callerProfile, error: profileError } = await admin
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single()

    if (profileError || callerProfile?.role !== 'admin') {
      return json(req, { error: 'Apenas administradores podem cadastrar clientes.' }, 403)
    }

    const body = await req.json()

    const email = String(body.email || '').trim().toLowerCase()
    const password = String(body.password || '')
    const fullName = String(body.full_name || '').trim()
    const coupleName = String(body.couple_name || '').trim()
    const partner1Name = String(body.partner1_name || '').trim()
    const partner2Name = String(body.partner2_name || '').trim()

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return json(req, { error: 'Informe um e-mail válido.' }, 400)
    }
    if (password.length < 8) {
      return json(req, { error: 'A senha provisória precisa ter pelo menos 8 caracteres.' }, 400)
    }
    if (!fullName) {
      return json(req, { error: 'Informe o nome do cliente.' }, 400)
    }
    if (!coupleName) {
      return json(req, { error: 'Informe o nome dos noivos.' }, 400)
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (createError || !created.user) {
      const message = createError?.message?.toLowerCase().includes('already')
        ? 'Já existe um usuário com este e-mail.'
        : (createError?.message || 'Não foi possível criar o login do cliente.')
      return json(req, { error: message }, createError?.status || 400)
    }

    const userId = created.user.id

    const weddingPayload = {
      client_user_id: userId,
      couple_name: coupleName,
      partner1_name: partner1Name || null,
      partner2_name: partner2Name || null,
      wedding_date: body.wedding_date || null,
      wedding_time: body.wedding_time || null,
      venue: String(body.venue || '').trim() || null,
      guests: Number(body.guests || 0),
      ceremony_type: String(body.ceremony_type || '').trim() || null,
      reception_type: String(body.reception_type || '').trim() || null,
      updated_at: new Date().toISOString(),
    }

    const { data: wedding, error: weddingError } = await admin
      .from('weddings')
      .insert(weddingPayload)
      .select()
      .single()

    if (weddingError) {
      await admin.auth.admin.deleteUser(userId)
      return json(req, { error: 'O login foi criado, mas o casamento não pôde ser salvo. O cadastro foi desfeito.' }, 400)
    }

    return json(req, {
      ok: true,
      user: { id: userId, email, full_name: fullName },
      wedding,
    })
  } catch (error) {
    console.error(error)
    return json(req, { error: 'Erro inesperado ao cadastrar o cliente.' }, 500)
  }
})
