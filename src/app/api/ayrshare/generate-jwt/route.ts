import { NextRequest, NextResponse } from 'next/server'

interface GenerateJwtBody {
  profileKey?: string
}

export async function POST(request: NextRequest) {
  try {
    const { profileKey }: GenerateJwtBody = await request.json()
    if (!profileKey) return NextResponse.json({ error: 'profileKey is required' }, { status: 400 })

    const apiKey = process.env.AYRSHARE_API_KEY
    const domain = process.env.AYRSHARE_DOMAIN
    const privateKeyRaw = process.env.AYRSHARE_PRIVATE_KEY
    let privateKey = (privateKeyRaw || '').replace(/\\n/g, '\n').trim()
    // Strip accidental wrapping quotes
    if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || (privateKey.startsWith('\'') && privateKey.endsWith('\''))) {
      privateKey = privateKey.slice(1, -1)
    }

    // If user pasted base64 content only (no PEM headers) OR the BEGIN/END lines are on one line, wrap/format it
    if (privateKey && !/BEGIN (RSA )?PRIVATE KEY/.test(privateKey)) {
      const body = privateKey.replace(/\s+/g, '')
      const chunked = body.match(/.{1,64}/g)?.join('\n') || body
      privateKey = `-----BEGIN RSA PRIVATE KEY-----\n${chunked}\n-----END RSA PRIVATE KEY-----`
    }
    // Ensure header/footer are on their own lines
    privateKey = privateKey
      .replace(/-----BEGIN [^-]+-----\s*/g, (m) => m.endsWith('\n') ? m : m + '\n')
      .replace(/\s*-----END [^-]+-----/g, (m) => (m.startsWith('\n') ? '' : '\n') + m)

    if (!apiKey || !domain || !privateKeyRaw) {
      return NextResponse.json({
        error: 'AYRSHARE credentials not configured',
        details: {
          apiKey: !!apiKey,
          domain: !!domain,
          privateKey: !!privateKeyRaw
        }
      }, { status: 500 })
    }

    const form = new URLSearchParams()
    form.set('domain', domain)
    form.set('privateKey', privateKey)
    form.set('profileKey', profileKey)
    form.set('verify', 'true')
    form.set('logout', 'true')
    // If you want to restrict networks, uncomment:
    // form.set('allowedSocial[0]', 'instagram')
    // form.set('allowedSocial[1]', 'tiktok')

    const res = await fetch('https://api.ayrshare.com/api/profiles/generateJWT', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: form.toString(),
      cache: 'no-store',
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('Ayrshare generateJWT error:', res.status, text)
      return NextResponse.json({
        error: 'Failed to generate JWT',
        upstreamStatus: res.status,
        upstreamText: text,
        meta: { domainPresent: !!domain, profileKeyPresent: !!profileKey }
      }, { status: 500 })
    }

    const data = await res.json()
    return NextResponse.json({ url: data?.url || data?.authUrl || null })
  } catch (error) {
    console.error('generate-jwt route error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
