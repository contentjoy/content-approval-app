import { NextRequest, NextResponse } from 'next/server'

interface GenerateJwtBody {
  profileKey?: string
}

export async function POST(request: NextRequest) {
  try {
    const { profileKey }: GenerateJwtBody = await request.json()
    if (!profileKey) return NextResponse.json({ error: 'profileKey is required' }, { status: 400 })

    if (!process.env.AYRSHARE_API_KEY || !process.env.AYRSHARE_PRIVATE_KEY || !process.env.AYRSHARE_DOMAIN) {
      return NextResponse.json({ error: 'AYRSHARE credentials not configured' }, { status: 500 })
    }

    const res = await fetch('https://api.ayrshare.com/api/profiles/generateJWT', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.AYRSHARE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        domain: process.env.AYRSHARE_DOMAIN,
        privateKey: process.env.AYRSHARE_PRIVATE_KEY,
        profileKey,
        allowedSocial: ['instagram', 'tiktok'],
        logout: true,
        verify: true,
        // Per product requirement: let Ayrshare handle redirect back to app
        redirect: `/[gym-slug]`,
      }),
      cache: 'no-store',
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('Ayrshare generateJWT error:', res.status, text)
      return NextResponse.json({ error: 'Failed to generate JWT' }, { status: 500 })
    }

    const data = await res.json()
    return NextResponse.json({ url: data?.url || data?.authUrl || null })
  } catch (error) {
    console.error('generate-jwt route error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
